import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeaderboard(leagueId: string) {
  return useSWR(`/api/leagues/${leagueId}/leaderboard`, fetcher, {
    refreshInterval: 60_000, // 1 minute
    revalidateOnFocus: true,
  });
}
