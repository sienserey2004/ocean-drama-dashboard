import api from "@/app/api/client";

export const coinsBalance = async () => {
  try {
    const { data } = await api.get("/coins/balance");
    return data;
  } catch (error) {
    console.error("Error fetching coins balance:", error);
    throw error;
  }
};

export const dailyCheckin = async () => {
  try {
    const { data } = await api.post("/coins/checkin");
    return data;
  } catch (error) {
    console.error("Error during daily check-in:", error);
    throw error;
  }
};

export const getCheckinStatus = async () => {
  try {
    const { data } = await api.get("/coins/checkin/status");
    return data;
  } catch (error) {
    console.error("Error fetching check-in status:", error);
    throw error;
  }
};
