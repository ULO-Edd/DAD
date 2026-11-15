import { addUser, removeUser } from "../state/connection.js";

const HEARTBEAT_INTERVAL = 30000; 
const HEARTBEAT_TIMEOUT = 10000; 

export const handleConnectionEvents = (io, socket) => {
  let heartbeatInterval;
  let heartbeatTimeout;
  const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat");

      heartbeatTimeout = setTimeout(() => {
        console.log(
          `[Heartbeat] No response from ${socket.id}, disconnecting...`
        );
        socket.disconnect(true);
      }, HEARTBEAT_TIMEOUT);
    }, HEARTBEAT_INTERVAL);
  };

  socket.on("heartbeat_ack", () => {
    clearTimeout(heartbeatTimeout);
    console.log(`[Heartbeat] Received pong from ${socket.id}`);
  });

  socket.on("join", (user) => {
    addUser(socket, user);
    console.log(`[Connection] User ${user.name} has joined the server`);
  });

  socket.on("leave", () => {
    const user = removeUser(socket.id);
    if (user) {
      console.log(`[Connection] User ${user.name} has left the server`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Connection Lost:", socket.id);
    removeUser(socket.id);
  });
};
