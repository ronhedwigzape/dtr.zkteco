// src/store/attendanceStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const ACTIVE_EMPLOYEE_IDS = [
    '1019', // Darlene Joy Magpantay
    '1022', // Margie Neth Benosa
    '1025', // Ailea Kathleen B. Dadua
    '135', // Alma Collado
    '149', // 	Merolyn Felin
    '155', // Greg Mandigma
    '205',
    '36',
    '40',
    '424', // Sir Lawrence
    '427',
    '463',
    '469', // Ron
    '474',
    '478' // Alma C. Mallare
];

export interface AttendanceLog {
  sn:          number;
  employeeId:  string;
  name:        string;
  date:        string;                   // 'YYYY-MM-DD'
  dayOfWeek:   'Sunday'|'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday';
  timeIn?:     string;                   // 'HH:mm:ss'
  timeOut?:    string;                   // 'HH:mm:ss'
  status:      'Early' | 'On Time' | 'Late' | 'Absent';
}

export interface DeviceDetails {
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

export interface DeviceUser {
  user_id:   string;
  name:      string;
  privilege: number;
}

interface AttendanceState {
  deviceDetails: DeviceDetails | null;
  users:         DeviceUser[];
  logs:          AttendanceLog[];

  setDeviceData: (d: DeviceDetails) => void;
  setUsers:      (u: DeviceUser[]) => void;
  addBatch:      (batch: Array<{
                  sn: number;
                  employeeId: string;
                  name: string;
                  record_time: string;
                  type: number;
                  state: 0 | 1;
                }>) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(set => {
    // Internal map key = `${employeeId}|${date}`
    const dayMap = new Map<string, Partial<AttendanceLog>>();

    return {
      deviceDetails: null,
      users:         [],
      logs:          [],

      setDeviceData: d => set({ deviceDetails: d }),
      setUsers:      u => set({ users: u }),

      addBatch: rawLogs => {
        const nineAM = 9 * 60; // minutes after midnight

        // 1) Process each raw record (only ACTIVE employees)
        rawLogs
          .filter(r => ACTIVE_EMPLOYEE_IDS.includes(r.employeeId))
          .forEach(r => {
            const dt     = new Date(r.record_time);
            const date   = dt.toISOString().slice(0, 10);
            const dow    = dt.toLocaleDateString('en-US', { weekday: 'long' }) as AttendanceLog['dayOfWeek'];
            const key    = `${r.employeeId}|${date}`;

            if (!dayMap.has(key)) {
              dayMap.set(key, {
                sn:         r.sn,
                employeeId: r.employeeId,
                name:       r.name,
                date,
                dayOfWeek:  dow,
              });
            }

            const entry = dayMap.get(key)!;
            if (r.state === 0) {
              // time-in: earliest
              if (!entry.timeIn || dt < new Date(entry.timeIn)) {
                entry.timeIn = dt.toTimeString().split(' ')[0];
              }
            } else {
              // time-out: latest
              if (!entry.timeOut || dt > new Date(entry.timeOut)) {
                entry.timeOut = dt.toTimeString().split(' ')[0];
              }
            }
          });

        // 2) Ensure every ACTIVE user has an entry each date
        const dates = new Set<string>();
        dayMap.forEach((_, k) => dates.add(k.split('|')[1]));

        const allUsers = useAttendanceStore.getState().users;
        dates.forEach(date => {
          const dt  = new Date(date);
          const dow = dt.toLocaleDateString('en-US', { weekday: 'long' }) as AttendanceLog['dayOfWeek'];

          allUsers
            .filter(u => ACTIVE_EMPLOYEE_IDS.includes(u.user_id))
            .forEach(u => {
              const key = `${u.user_id}|${date}`;
              if (!dayMap.has(key)) {
                dayMap.set(key, {
                  sn:         0,
                  employeeId: u.user_id,
                  name:       u.name,
                  date,
                  dayOfWeek:  dow,
                });
              }
            });
        });

        // 3) Flatten + compute status (only ACTIVE employees)
        const out: AttendanceLog[] = [];
        // inside addBatch, when building `out`:
        dayMap.forEach(v => {
            const e = v as AttendanceLog;
        
            // skip non-active
            if (!ACTIVE_EMPLOYEE_IDS.includes(e.employeeId)) return;
        
            let status: AttendanceLog['status'];
            if (!e.timeIn || !e.timeOut) {
            status = 'Absent';
            } else {
            const [hh, mm] = e.timeIn.split(':').map(Number);
            const minutes  = hh * 60 + mm;
            if (minutes < nineAM) status = 'Early';
            else if (minutes === nineAM) status = 'On Time';
            else status = 'Late';
            }
        
            out.push({ ...e, status });
        });
                

        // 4) Sort by date, then employeeId
        out.sort((a, b) => {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;
            return a.employeeId.localeCompare(b.employeeId);
        });

        set({ logs: out });
      },
    };
  })
);
