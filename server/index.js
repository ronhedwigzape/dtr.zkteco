// server/index.js
import 'dotenv/config';               // load .env into process.env
import redis from 'redis';
import { EventEmitter } from 'events';
import msgpack from 'notepack.io';
import Zkteco from 'zkteco-js';
import http from 'http';
import { Server } from 'socket.io';

// Environment variables (see README)
const REDIS_URL     = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const REDIS_CHANNEL = process.env.REDIS_CHANNEL || 'attendance:updates';
const DEVICE_IP     = process.env.DEVICE_IP || '10.10.80.8';
const DEVICE_PORT   = parseInt(process.env.DEVICE_PORT, 10) || 4370;
const SEND_TIMEOUT  = parseInt(process.env.SEND_TIMEOUT, 10) || 20000;
const RECV_TIMEOUT  = parseInt(process.env.RECV_TIMEOUT, 10) || 20000;
const SERVER_PORT   = parseInt(process.env.SERVER_PORT, 10) || 8090;

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

;(async () => {
  // 1) Connect to the ZKTeco device
  const device = new Zkteco(DEVICE_IP, DEVICE_PORT, SEND_TIMEOUT, RECV_TIMEOUT);
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

  // 6) Fetch → enrich → filter → publish
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
          employeeId:  r.user_id,
          name:        (usersDevice.find(u => u.user_id === r.user_id)?.name) || 'Unknown',
          record_time: r.record_time,
          type:        r.type,
          state:       r.state,
        }));

    const payloadObj = {
      timestamp:    Date.now(),
      deviceDetails,
      users:         usersDevice,
      logs:          enriched,
    };

    const packed = msgpack.encode(payloadObj);
    lastPayload = packed;
    await pub.publish(REDIS_CHANNEL, packed);
  }

  // 7) Fire immediately, then every 60s
  await publishAttendances();
  setInterval(publishAttendances, 60_000);

  // 8) Socket.IO server
  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors:       { origin: process.env.CLIENT_ORIGIN || 'http://localhost:2000', methods: ['GET','POST'] },
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

  httpServer.listen(SERVER_PORT, () =>
      console.log(`⚡️ Socket.IO listening on port ${SERVER_PORT}`)
  );
})();
