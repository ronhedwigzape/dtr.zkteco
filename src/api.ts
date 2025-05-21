
export type Log = {
    id: string
    deviceId: string
    userId: string
    timestamp: string
    type: number
    state: number
    ip: string
  }
  
  const API_BASE = import.meta.env.VITE_API_URL || ''
  
  export async function fetchLogs(from: string, to: string): Promise<Log[]> {
    const url = `${API_BASE}/api/logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Error fetching logs: ${res.statusText}`)
    const json = await res.json()
    return json.data as Log[]
  }
  