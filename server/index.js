// server/index.js
import 'dotenv/config';               // load .env into process.env
import redis from 'redis';
import { EventEmitter } from 'events';
import Zkteco from 'zkteco-js';
import http from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';

// Environment variables (see README)
const {
  REDIS_URL     ,
  REDIS_CHANNEL ,
  DEVICE_IP     ,
  DEVICE_PORT   ,
  SEND_TIMEOUT  ,
  RECV_TIMEOUT  ,
  SERVER_PORT   ,
  DB_HOST       ,
  DB_USER       ,
  DB_PASS       ,
  DB_NAME       ,
  DB_PORT
} = process.env;

// parse ints
const DEVICE_PORT_NUM  = parseInt(DEVICE_PORT, 10);
const SEND_TIMEOUT_MS  = parseInt(SEND_TIMEOUT, 10);
const RECV_TIMEOUT_MS  = parseInt(RECV_TIMEOUT, 10);
const SERVER_PORT_NUM  = parseInt(SERVER_PORT, 10);

const db = await mysql.createPool({
  host:     (DB_HOST === 'localhost' || DB_HOST === '::1') ? '127.0.0.1' : DB_HOST,
  port:     Number(DB_PORT) || 3306,
  user:     DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ensure table exists
await db.execute(`
  CREATE TABLE IF NOT EXISTS attendance_logs (
    sn           INT PRIMARY KEY,
    user_id      VARCHAR(50),
    name         VARCHAR(255),
    record_time  DATETIME,
    type         TINYINT,
    state        TINYINT,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`);

const fallbackBus = new EventEmitter();
fallbackBus.setMaxListeners(20);

let pub, sub;
async function initPubSub() {
  const client = redis.createClient({ url: REDIS_URL });
  client.on('error', err => console.error('Redis error', err));
  await client.connect();
  pub = client;
  sub = client.duplicate();
  await sub.connect();
  sub.setMaxListeners(20);
  console.log('✅ Connected to Redis Pub/Sub');
}

// helper: save or update batch of logs
async function saveLogs(logs) {
  if (!logs.length) return;
  const values = logs.map(r => [
    r.sn,
    r.user_id,
    r.name,
    r.record_time,
    r.type,
    r.state,
  ]);
  // bulk insert with ON DUPLICATE KEY UPDATE
  await db.query(
      `INSERT INTO attendance_logs
      (sn, user_id, name, record_time, type, state)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       user_id=VALUES(user_id),
       name=VALUES(name),
       record_time=VALUES(record_time),
       type=VALUES(type),
       state=VALUES(state)`,
      [values]
  );
}

;(async () => {
  // 1) Connect to the ZKTeco device
  const device = new Zkteco(DEVICE_IP, DEVICE_PORT_NUM, SEND_TIMEOUT_MS, RECV_TIMEOUT_MS);
  await device.createSocket();

  // 2) Fetch static device details
  const deviceDetails = {
    info:           await device.getInfo(),
    attendanceSize: await device.getAttendanceSize(),
    pin:            await device.getPIN(),
    currentTime:    await device.getTime(),
    faceOn:         await device.getFaceOn(),
    ssr:            await device.getSSR(),
    firmware:       await device.getDeviceVersion(),
    deviceName:     await device.getDeviceName(),
    platform:       await device.getPlatform(),
    os:             await device.getOS(),
    vendor:         await device.getVendor(),
    productTime:    await device.getProductTime(),
    macAddress:     await device.getMacAddress(),
  };

  // 3) Fetch & normalize enrolled users
  const rawUsers = await device.getUsers();
  const usersArray = Array.isArray(rawUsers)
      ? rawUsers
      : Array.isArray(rawUsers.data)
          ? rawUsers.data
          : Object.values(rawUsers);
  const usersDevice = usersArray.map(u => ({
    user_id: u.userId,
    name:    u.name,
    role:    u.role,
  }));

  // 4) Init Pub/Sub
  await initPubSub();

  // 5) Date range: Jan 1 this year → now
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const now         = Date.now();

  // 6) Fetch → enrich → filter → publish → persist
  let lastPayload = null;
  async function publishAttendances() {
    const raw = await device.getAttendances();
    const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.data)
            ? raw.data
            : Object.values(raw);

    const enriched = arr
        .filter(r => {
          const ts = new Date(r.record_time).getTime();
          return ts >= startOfYear && ts <= now;
        })
        .map(r => ({
          sn:          r.sn,
          user_id:     r.user_id,
          name:        usersDevice.find(u => u.user_id === r.user_id)?.name || 'Unknown',
          record_time: r.record_time,
          type:        r.type,
          state:       r.state,
        }));

    // pack & publish
    const payloadObj = {
      timestamp:    Date.now(),
      deviceDetails,
      users:        usersDevice,
      logs:         enriched,
    };
    const packed = msgpack.encode(payloadObj);
    lastPayload = packed;
    await pub.publish(REDIS_CHANNEL, packed);

    // persist into MariaDB
    try {
      await saveLogs(enriched);
    } catch (err) {
      console.error('DB save error:', err);
    }
  }

  // 7) Fire immediately, then every 60s
  await publishAttendances();
  setInterval(publishAttendances, 60_000);

  // 8) Socket.IO server
  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors:       { origin: process.env.CLIENT_ORIGIN || '*' },
    transports: ['websocket'],
  });

  io.on('connection', socket => {
    console.log(`Client connected: ${socket.id}`);
    if (lastPayload) socket.emit('attendance', lastPayload);

    const handler = (_ch, msg) => socket.emit('attendance', msg);
    sub.on(REDIS_CHANNEL, handler);

    socket.on('disconnect', () => {
      sub.off(REDIS_CHANNEL, handler);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(SERVER_PORT_NUM, () =>
      console.log(`⚡️ Socket.IO listening on port ${SERVER_PORT_NUM}`)
  );
})();
