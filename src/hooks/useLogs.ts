import { useQuery } from '@tanstack/react-query'
import type { Log } from '../api'
import { fetchLogs } from '../api'

export function useLogs(from: string, to: string) {
  return useQuery<Log[], Error>({
    queryKey: ['logs', from, to],
    queryFn: () => fetchLogs(from, to),
    enabled: Boolean(from && to),
    staleTime: 30_000,       // keep “fresh” for 30s
    gcTime: 60_000,          // drop from cache 1m after unused
    refetchInterval: 60_000, // refetch every 60s in background
  })
}
