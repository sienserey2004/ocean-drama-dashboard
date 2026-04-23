import api from "./client";

export const coinApi = {
  earnWatchTime: (durationSeconds: number) =>
    api.post("/coins/earn/watch-time", { duration_seconds: durationSeconds }),
};
