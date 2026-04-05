import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLockStatus(leagueId: string) {
  return useSWR(`/api/lock/${leagueId}`, fetcher, {
    refreshInterval: 30_000, // 30s — countdown updates on client anyway
    revalidateOnFocus: true,
  });
}
