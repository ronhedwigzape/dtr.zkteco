import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import msgpack from 'notepack.io';
import { useAttendanceStore } from '../store/attendanceStore';

interface ZktecoUser {
  user_id: string;
  name:    string;
  privilege: number;
}

interface DeviceDetails {
  info:           object;
  attendanceSize: number;
  pin:            string;
  currentTime:    string;
  faceOn:         boolean;
  ssr:            string;
  firmware:       string;
  deviceName:     string;
  platform:       string;
  os:             string;
  vendor:         string;
  productTime:    string;
  macAddress:     string;
}

interface ServerLog {
  sn:          number;
  employeeId:  string;
  name:        string;
  record_time: string;
  type:        number;
  state:       0 | 1;
}

interface ServerPayload {
  timestamp:     number;
  deviceDetails: DeviceDetails;
  users:         ZktecoUser[];
  logs:          ServerLog[];
}

// Extend Socket to include binaryType
interface BinarySocket extends Socket {
  binaryType: 'arraybuffer';
}

let socket: BinarySocket | null = null;

export function useAttendanceSocket(): void {
  const { setDeviceData, setUsers, addBatch } = useAttendanceStore();

  useEffect(() => {
    if (socket) return;

    // initialize
    socket = io(`http://localhost:${import.meta.env.SERVER_PORT ?? 8090}`, {
      path:       '/socket.io',
      transports: ['websocket'],
      reconnectionDelayMax: 5000,
    }) as BinarySocket;

    socket.binaryType = 'arraybuffer';

    socket.on('connect', () =>
      console.log('✅ Connected to attendance WS')
    );

    // hooks/useAttendanceSocket.ts
    socket.on('attendance', (data: ArrayBuffer | string) => {
        let payload: ServerPayload;
    
        if (typeof data === 'string') {
        // fallback JSON
        payload = JSON.parse(data) as ServerPayload;
        } else {
        // binary MsgPack
        payload = msgpack.decode(new Uint8Array(data)) as ServerPayload;
        }
    
        setDeviceData(payload.deviceDetails);
        setUsers(payload.users);
        addBatch(payload.logs);
    });
  

    socket.on('disconnect', () =>
      console.warn('⚠️ Disconnected from WS')
    );

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [setDeviceData, setUsers, addBatch]);
}
