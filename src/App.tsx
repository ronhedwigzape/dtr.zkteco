import React from 'react';
import { useLogs } from './hooks/useLogs';
import { LogTable } from './components/LogTable';

export const App: React.FC = () => {
  // default to last 24h
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data, isLoading, error } = useLogs(from, to);

  if (isLoading) return <p className="p-4">Loading logs…</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error.message}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Attendance Logs (Last 24h)</h1>
      <LogTable logs={data!} />
    </div>
  );
};
