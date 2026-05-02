import api from "./client";

export const coinApi = {
  earnWatchTime: (durationSeconds: number) =>
    api.post("/coins/earn/watch-time", { duration_seconds: durationSeconds }),
  unlockVideo: (videoId: number, coins: number) =>
    api.post("/coins/spend/unlock-video", { video_id: videoId, coins }),
};
