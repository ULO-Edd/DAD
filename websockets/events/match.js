import { getMatch, addMatch } from "../state/match.js";
import BiscaMatch from "../classes/BiscaMatch.js";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

export default (io, socket) => {
  const broadcastMatchUpdate = (matchId, match) => {
    const roomName = `match_${matchId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
      for (const socketId of room) {
        const clientSocket = io.sockets.sockets.get(socketId);
        if (!clientSocket || !clientSocket.user) continue;
        const userId = clientSocket.user.id;
        const publicState = match.getPublicState();
        const gameState = match.getGameState(userId);
        clientSocket.emit("match:update", { ...publicState, game: gameState });
      }
    }
  };

  const createMatchEmitter = (matchId) => (eventName, payload) => {
    const match = getMatch(matchId);
    if (!match) return;

    if (
      eventName === "match:new-round-start" ||
      eventName === "match:ended-signal"
    ) {
      broadcastMatchUpdate(matchId, match);
    } else if (eventName === "match:round-ended") {
      io.to(`match_${matchId}`).emit("match:round-ended", payload);
    } else {
      io.to(`match_${matchId}`).emit(eventName, payload);
    }
  };

  const handleAutoPlay = (matchId) => (userId, cardId) => {
    const match = getMatch(matchId);
    if (!match || match.status !== "Playing") return;

    console.log(`[Match ${matchId}] Auto-playing for User ${userId}`);
    const result = match.playCard(userId, cardId);

    if (result && result.action === "trick_resolved") {
      io.to(`match_${matchId}`).emit("game:trick-end", result.trickResult);
      setTimeout(() => {
        broadcastMatchUpdate(matchId, match);
      }, 1500);
    } else {
      broadcastMatchUpdate(matchId, match);
    }
  };

  socket.on("match:enter", async (data) => {
    const { matchId } = data;
    if (!socket.user || !socket.user.id)
      return socket.emit("error", { message: "Auth failed" });
    const userId = socket.user.id;
    socket.activeMatchId = matchId;

    const room = `match_${matchId}`;
    let match = getMatch(matchId);

    if (!match) {
      try {
        const res = await axios.get(`${API_URL}/matches/${matchId}`, {
          headers: {
            Authorization: socket.token || socket.handshake.auth.token,
          },
        });
        const matchData = res.data.data || res.data;

        match = new BiscaMatch(
          matchData,
          createMatchEmitter(matchId),
          socket.token,
          handleAutoPlay(matchId)
        );
        addMatch(match);
      } catch (e) {
        return socket.emit("error", "Match not found");
      }
    }
    match.emitStateCallback = createMatchEmitter(matchId);
    if (userId !== match.player1Id && match.player2Id === 1)
      await match.joinPlayer(userId, socket.user);

    socket.join(room);
    const publicState = match.getPublicState();
    const gameState = match.getGameState(userId);
    socket.emit("match:update", { ...publicState, game: gameState });
    if (match.status === "Playing") broadcastMatchUpdate(matchId, match);
  });

  socket.on("game:play-card", (data) => {
    const { matchId, cardId } = data;
    const match = getMatch(matchId);
    if (!match || match.status !== "Playing") return;
    const result = match.playCard(socket.user.id, cardId);
    if (result && result.error)
      return socket.emit("error", { message: result.error });
    if (result && result.action === "trick_resolved") {
      io.to(`match_${matchId}`).emit("game:trick-end", result.trickResult);
      setTimeout(() => {
        broadcastMatchUpdate(matchId, match);
      }, 1500);
    } else {
      broadcastMatchUpdate(matchId, match);
    }
  });

  socket.on("game:surrender", async ({ matchId }) => {
    const match = getMatch(matchId);
    if (!match || match.status !== "Playing") return;
    const userId = socket.user.id;
    console.log(`[Match ${matchId}] User ${userId} surrendered ROUND.`);
    const opponentId =
      match.player1Id == userId ? match.player2Id : match.player1Id;
    const result = {
      winnerId: opponentId,
      loserId: userId,
      isDraw: false,
      player1_id: match.player1Id,
      player2_id: match.player2Id,
      player1_points: match.player1Id == opponentId ? 91 : 0,
      player2_points: match.player2Id == opponentId ? 91 : 0,
      reason: "surrender",
    };
    await match.handleGameEnd(result);
  });

  socket.on("match:surrender", async ({ matchId }) => {
    const match = getMatch(matchId);
    if (!match || match.status !== "Playing") return;
    const userId = socket.user.id;

    await match.abortCurrentGame(userId);

    console.log(`[Match ${matchId}] User ${userId} surrendered MATCH.`);
    const opponentId =
      match.player1Id == userId ? match.player2Id : match.player1Id;
    match.marks[opponentId] = 4;
    await match.finishMatch();
    broadcastMatchUpdate(matchId, match);
  });

  socket.on("disconnect", async () => {
    if (socket.activeMatchId) {
      const match = getMatch(socket.activeMatchId);
      if (match && match.status === "Playing") {
        const userId = socket.user?.id;
        if (userId === match.player1Id || userId === match.player2Id) {
          console.log(`[Match ${match.id}] Player ${userId} disconnected.`);

          await match.abortCurrentGame(userId);

          const opponentId =
            match.player1Id == userId ? match.player2Id : match.player1Id;
          match.marks[opponentId] = 4;
          await match.finishMatch();
          broadcastMatchUpdate(match.id, match);
        }
      }
    }
  });
};
