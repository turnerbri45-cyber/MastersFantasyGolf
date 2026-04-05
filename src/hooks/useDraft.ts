import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDraft(leagueId: string) {
  return useSWR(`/api/draft/${leagueId}`, fetcher, {
    revalidateOnFocus: true,
  });
}

export function useGolfers() {
  return useSWR("/api/golfers", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}
