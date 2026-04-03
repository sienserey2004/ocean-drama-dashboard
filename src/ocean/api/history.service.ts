import api from "./client";

export interface WatchHistoryResponse {
  currentTime: number;
}

export const historyApi = {
  saveProgress: (data: { episodeId: number; currentTime: number }) =>
    api.post('/watch-history', data).then(r => r.data),

  getProgress: (episodeId: number) =>
    api.get<WatchHistoryResponse>(`/watch-history/${episodeId}`).then(r => r.data),
};
