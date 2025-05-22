// server/index.js
import redis from 'redis';
import { EventEmitter } from 'events';
import msgpack from 'notepack.io';
import Zkteco from 'zkteco-js';
import http from 'http';
import { Server } from 'socket.io';

const REDIS_URL     = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const REDIS_CHANNEL = 'attendance:updates';
const DEVICE_IP     = '10.10.80.8';
const DEVICE_PORT   = 4370;
const SEND_TIMEOUT  = 20000;
const RECV_TIMEOUT  = 20000;

// 1) Define your “active” employees here:
const ACTIVE_EMPLOYEE_IDS = [
    '1019', 
    '1022', 
    '1025', 
    '135' , 
    '149', 
    '155', 
    '205', 
    '3', 
    '36', 
    '40', 
    '424',
    '427',
    '463',
    '469',
    '474',
    '478'
];

const fallbackBus = new EventEmitter();
fallbackBus.setMaxListeners(20);

let pub, sub;
async function initPubSub() {
  try {
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    pub = client;
    sub = client.duplicate();
    await sub.connect();
    sub.setMaxListeners?.(20);
    console.log('✅ Connected to Redis Pub/Sub');
  } catch {
    console.warn('⚠️ Redis unavailable, using in-memory Pub/Sub');
    pub = { publish: async (ch, msg) => fallbackBus.emit(ch, msg) };
    sub = fallbackBus;
  }
}

;(async () => {
  // 2) Connect to the ZKTeco device
  const device = new Zkteco(DEVICE_IP, DEVICE_PORT, SEND_TIMEOUT, RECV_TIMEOUT);
  await device.createSocket();

  // 3) Fetch static device details
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

  // 4) Fetch & normalize enrolled users
  const rawUsers = await device.getUsers();
  const usersArray = Array.isArray(rawUsers)
    ? rawUsers
    : Array.isArray(rawUsers.data)
      ? rawUsers.data
      : Object.values(rawUsers);

  const usersDevice = usersArray.map(u => ({
    user_id: u.userId,  // normalize to `user_id`
    name:    u.name,
    role:    u.role,
  }));

  // 5) Init Pub/Sub
  await initPubSub();

  // 6) Date range: Jan 1 this year → now
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const now         = Date.now();

  // 7) Fetch → enrich → filter by ACTIVE_EMPLOYEE_IDS → publish
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
      }))
      // only keep active employees
      .filter(entry => ACTIVE_EMPLOYEE_IDS.includes(entry.employeeId));

    const payloadObj = {
      timestamp:         Date.now(),
      deviceDetails,           // metadata
      users:              usersDevice,
      activeEmployeeIds:  ACTIVE_EMPLOYEE_IDS,
      logs:               enriched,
    };

    const packed = msgpack.encode(payloadObj);
    lastPayload = packed;
    await pub.publish(REDIS_CHANNEL, packed);
  }

  // 8) Fire immediately, then every 60s
  await publishAttendances();
  setInterval(publishAttendances, 60_000);

  // 9) Socket.IO server
  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors:       { origin: 'http://localhost:2000', methods: ['GET','POST'] },
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

  httpServer.listen(8090, () =>
    console.log('⚡️ Socket.IO listening on port 8090')
  );
})();
