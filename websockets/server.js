import { Server } from "socket.io";
import axios from "axios";
import { handleConnectionEvents } from "./events/connection.js";
import { addUser, removeUser } from "./state/connection.js";
import gameEvents from "./events/game.js";
import matchEvents from "./events/match.js";

export const server = {
  io: null,
};

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

const disconnectTimers = new Map();
const RECONNECT_GRACE_PERIOD = 1 * 60 * 1000;

const userId = (socket) => socket.user && socket.user.id;

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      origin: "*",
    },
  });

  console.log(`[WebSocket] API_URL is set to ${API_URL}`);

  server.io.use(async (socket, next) => {
    let token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    if (!token.startsWith("Bearer ")) {
      token = "Bearer " + token;
    }

    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: token,
          Accept: "application/json",
        },
      });

      const user = response.data.data || response.data;

      if (!user || !user.id) {
        return next(new Error("Authentication error: User data not found"));
      }

      socket.user = user;
      socket.token = token;
      socket.handshake.auth.token = token;

      if (disconnectTimers.has(user.id)) {
        console.log(
          `[Connection] User ${user.id} reconnected! Cancelling surrender timer.`
        );
        clearTimeout(disconnectTimers.get(user.id));
        disconnectTimers.delete(user.id);
      }

      addUser(socket.id, user);

      next();
    } catch (error) {
      if (error.response) {
        console.error(
          "❌ Erro Laravel:",
          error.response.status,
          error.response.data
        );
      } else {
        console.error("❌ Erro Rede:", error.message);
      }
      next(new Error("Authentication error: Invalid token"));
    }
  });

  server.io.on("connection", (socket) => {
    gameEvents(server.io, socket);
    matchEvents(server.io, socket);

    handleConnectionEvents(server.io, socket);

    socket.on("notify_disconnect", () => {
      socket.isVoluntaryDisconnect = true;
    });

    socket.on("disconnect", () => {
      // Remove from active socket list
      removeUser(socket.id);

      if (socket.isVoluntaryDisconnect) {
        console.log(
          `[Disconnect] User ${userId} disconnected voluntarily. No surrender needed.`
        );
        return;
      }

      if (userId) {
        console.log(
          `[Disconnect] User ${userId} disconnected. Waiting ${
            RECONNECT_GRACE_PERIOD / 1000
          }s...`
        );

        // -----------------------------------------------------------
        // 2. START SURRENDER TIMER
        // -----------------------------------------------------------
        const timer = setTimeout(async () => {
          console.log(
            `[Timeout] User ${userId} did not return. Forcing surrender.`
          );

          // A. Find the Game ID this user is playing (You need a way to look this up)
          // Ideally, your 'socket' object or a global map knows which gameID the user is in.
          // For this example, let's assume you stored `socket.activeGameId` when they joined.
          const gameId = socket.activeGameId;

          if (gameId) {
            try {
              // B. Call Laravel API to resign on their behalf
              // We use the token we saved during the handshake
              await axios.post(
                `${API_URL}/games/${gameId}/resign`,
                {},
                {
                  headers: {
                    Authorization: socket.handshake.auth.token,
                    Accept: "application/json",
                  },
                }
              );

              // C. Notify the room (The API likely triggers a Pusher/Socket event,
              // but we can also emit locally if needed)
              server.io.to(gameId).emit("game_over", {
                winner: "opponent",
                reason: "disconnect",
              });

              console.log(
                `[Timeout] Successfully resigned game ${gameId} for user ${userId}`
              );
            } catch (err) {
              console.error(
                `[Timeout] Failed to resign game for user ${userId}:`,
                err.message
              );
            }
          }

          disconnectTimers.delete(userId);
        }, RECONNECT_GRACE_PERIOD);

        disconnectTimers.set(userId, timer);
      }
    });
  });
};
