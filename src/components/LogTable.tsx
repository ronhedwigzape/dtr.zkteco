import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';  // runtime import
import type { ListChildComponentProps } from 'react-window';  // type-only

import type { Log } from '../api';

interface Props {
  logs: Log[];
}

const COLUMN_WIDTHS = {
  time: 120,
  device: 100,
  user: 80,
  type: 60,
  state: 60,
  ip: 120
};

export const LogRow = ({ index, style, data }: ListChildComponentProps<Log[]>) => {
  const log = data[index];
  const date = new Date(log.timestamp);

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 0.5rem'
      }}
    >
      <div style={{ width: COLUMN_WIDTHS.time }}>{date.toLocaleString()}</div>
      <div style={{ width: COLUMN_WIDTHS.device }}>{log.deviceId}</div>
      <div style={{ width: COLUMN_WIDTHS.user }}>{log.userId}</div>
      <div style={{ width: COLUMN_WIDTHS.type }}>{log.type}</div>
      <div style={{ width: COLUMN_WIDTHS.state }}>{log.state}</div>
      <div style={{ flex: 1 }}>{log.ip}</div>
    </div>
  );
};

export const LogTable: React.FC<Props> = ({ logs }) => {
  const itemData = useMemo(() => logs, [logs]);

  return (
    <div className="border rounded overflow-hidden">
      <div className="flex bg-gray-100 p-2 font-semibold text-sm">
        <div style={{ width: COLUMN_WIDTHS.time }}>Timestamp</div>
        <div style={{ width: COLUMN_WIDTHS.device }}>Device</div>
        <div style={{ width: COLUMN_WIDTHS.user }}>User</div>
        <div style={{ width: COLUMN_WIDTHS.type }}>Type</div>
        <div style={{ width: COLUMN_WIDTHS.state }}>State</div>
        <div style={{ flex: 1 }}>IP</div>
      </div>
      <List
        height={400}
        itemCount={logs.length}
        itemSize={35}
        width="100%"
        itemData={itemData}
      >
        {LogRow}
      </List>
    </div>
  );
};
