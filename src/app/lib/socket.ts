import { io, Socket } from "socket.io-client";

const SOCKET_URL = ""; // Use current host/proxy

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to Transcoding Socket");
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Disconnected from Transcoding Socket");
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to updates for a specific episode
   */
  joinEpisode(episodeId: number) {
    const socket = this.getSocket();
    socket.emit("join-episode-updates", episodeId);
  }

  /**
   * Listen for progress events
   */
  onProgress(callback: (data: any) => void) {
    const socket = this.getSocket();
    socket.on("episode-progress", callback);
    return () => socket.off("episode-progress", callback);
  }
}

export const socketService = new SocketService();
