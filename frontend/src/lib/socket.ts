import { io, type Socket } from "socket.io-client";
import { config } from "@/config/config";

const SOCKET_URL = config.socketUrl;

let socket: Socket | null = null;

// Auth comes from the httpOnly accessToken cookie sent with the handshake (`withCredentials`).
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
  });

  return socket;
}

/** Re-handshakes with the current cookies (after login, logout or a token refresh). Room hooks re-join on "connect". */
export function reconnectSocket() {
  if (socket?.connected) socket.disconnect().connect();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const SOCKET_EVENTS = {
  JOIN_POLL_ROOM: "join-poll-room",
  LEAVE_POLL_ROOM: "leave-poll-room",
  REQUEST_ANALYTICS: "request-analytics-update",
  JOINED_ROOM: "joined-room",
  NEW_RESPONSE: "new-response",
  ANALYTICS_UPDATE: "analytics-update",
  POLL_STATUS_CHANGE: "poll-status-change",
  POLL_CLOSED: "poll-closed",
  POLL_PUBLISHED: "poll-published",
  JOIN_FORM_ROOM: "join-form-room",
  LEAVE_FORM_ROOM: "leave-form-room",
  FORM_ANALYTICS_UPDATE: "form-analytics-update",
  FORM_STATUS_CHANGE: "form-status-change",
  JOIN_QUIZ_ROOM: "join-quiz-room",
  LEAVE_QUIZ_ROOM: "leave-quiz-room",
  QUIZ_LIVE_STATE: "quiz-live-state",
  QUIZ_LOBBY_COUNT: "quiz-lobby-count",
  ERROR: "socket-error",
} as const;
