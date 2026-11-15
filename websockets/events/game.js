import axios from "axios";
import { getGame, createGame } from "../state/game.js";
import { getUser } from "../state/connection.js";

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

const getStrength = (rank) => {
  const strengthMap = {
    1: 10,
    7: 9,
    13: 8,
    11: 7,
    12: 6,
    6: 5,
    5: 4,
    4: 3,
    3: 2,
    2: 1,
  };
  return strengthMap[rank] || 0;
};

const drawCard = (game, playerId) => {
  const player = game.players[playerId];
  if (!player) return;

  if (game.deck && game.deck.length > 0) {
    const card = game.deck.pop();
    player.hand.push(card);
  } else if (game.trumpCard) {
    player.hand.push(game.trumpCard);
    game.trumpCard = null;
  }
};

const sanitizeState = (state, game) => {
  if (!state) return null;
  const p1 = game.player1 || state.player1 || {};
  const p2 = game.player2 || state.player2 || {};

  return {
    id: state.id,
    status: state.status || game.status,
    player1: { id: p1.id, name: p1.name },
    player2: { id: p2.id, name: p2.name },
    players: state.players,
    hand: state.hand,
    points: state.points,
    opponent: {
      id: state.opponent?.id,
      name: state.opponent?.name,
      points: state.opponent?.points,
      cardCount: state.opponent?.cardCount,
    },
    table: state.table,
    trumpCard: state.trumpCard,
    deckCount: game.deck ? game.deck.length : state.deckCount || 0,
    currentTurn: state.currentTurn,
    turnStartedAt: state.turnStartedAt,
  };
};

const broadcastState = (io, gameId, game) => {
  const roomName = `game_${gameId}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(roomName);

  if (socketsInRoom) {
    for (const socketId of socketsInRoom) {
      const s = io.sockets.sockets.get(socketId);
      const u = getUser(socketId);
      if (u && game.players[u.id]) {
        const rawState = game.getStateForPlayer(u.id);
        const cleanState = sanitizeState(rawState, game);
        s.emit("game-state", cleanState);
      }
    }
  }
};

async function saveGameResult(gameId, result, token) {
  try {
    const payload = {
      status: "Ended",
      is_draw: result.isDraw,
      total_time: result.totalTime,
      player1_points: result.player1_points,
      player2_points: result.player2_points,
    };
    if (!result.isDraw && result.winnerId) {
      payload.winner_user_id = result.winnerId;
      payload.loser_user_id = result.loserId;
    }

    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    await axios.put(`${API_URL}/games/${gameId}`, payload, {
      headers: { Authorization: authHeader },
    });
  } catch (error) {
    console.error(`[DB Error] Game ${gameId}:`, error.message);
  }
}

const performGameEnd = (io, game, gameId, winnerId, loserId, reason) => {
  const result = {
    action: "game_ended",
    winnerId: parseInt(winnerId),
    loserId: parseInt(loserId),
    totalTime: game.startTime
      ? Math.floor((Date.now() - game.startTime) / 1000)
      : 0,
    isDraw: false,
    player1_points: game.players[Object.keys(game.players)[0]]?.points || 0,
    player2_points: game.players[Object.keys(game.players)[1]]?.points || 0,
    reason: reason,
  };

  game.status = "ended";
  if (game.timer) clearInterval(game.timer);

  io.to(`game_${gameId}`).emit("game-over", {
    winnerId: result.winnerId,
    isDraw: result.isDraw,
    p1Points: result.player1_points,
    p2Points: result.player2_points,
    message: reason === "surrender" ? "Opponent Surrendered!" : "Game Over",
  });

  const anyId = Object.keys(game.players)[0];
  const token = game.players[anyId]?.token;
  if (token) saveGameResult(gameId, result, token);
};

const handleTimeout = (io, gameId, userId) => {
  const game = getGame(gameId);
  if (!game || game.status === "ended") return;

  console.log(`[Timeout] User ${userId} auto-playing lowest card.`);

  const player = game.players[userId];
  if (!player || !player.hand || player.hand.length === 0) return;

  const trumpSuit = game.trumpCard?.suit || "";

  const sortedHand = [...player.hand].sort((a, b) => {
    const strengthA = getStrength(a.rank) + (a.suit === trumpSuit ? 100 : 0);
    const strengthB = getStrength(b.rank) + (b.suit === trumpSuit ? 100 : 0);
    return strengthA - strengthB;
  });

  const cardToPlay = sortedHand[0];
  if (cardToPlay) {
    handleGameMove(io, gameId, userId, cardToPlay.id);
  }
};

const handleGameMove = (io, gameId, userId, cardId) => {
  const game = getGame(gameId);
  if (!game) return;

  const result = game.playCard(userId, cardId);
  const roomName = `game_${gameId}`;

  broadcastState(io, gameId, game);

  if (result.action === "trick_resolved") {
    io.to(roomName).emit("trick-end", result.trickResult);

    setTimeout(() => {
      if (game.status !== "ended") {
        const canDraw =
          (game.deck && game.deck.length > 0) || game.trumpCard !== null;

        if (canDraw) {
          const winnerId = result.trickResult.winnerId;
          const loserId = Object.keys(game.players).find(
            (id) => String(id) !== String(winnerId)
          );

          if (winnerId) drawCard(game, winnerId);
          if (loserId) drawCard(game, loserId);
        }
        broadcastState(io, gameId, game);
      }
    }, 1500);
  }

  if (result.action === "game_ended") {
    performGameEnd(io, game, gameId, result.winnerId, result.loserId, "points");
  }

  if (result.action === "next_turn" || result.action === "trick_resolved") {
    game.startTurnTimer((timeoutUserId) => {
      handleTimeout(io, gameId, timeoutUserId);
    });
  }
};

export default (io, socket) => {
  socket.on("join-game", async ({ gameId }) => {
    const user = getUser(socket.id);
    if (!user) {
      socket.emit("error", { message: "Not authenticated." });
      return;
    }

    let game = getGame(gameId);
    let gameData = null;

    try {
      const token = socket.handshake.auth.token;
      const response = await axios.get(`${API_URL}/games/${gameId}`, {
        headers: { Authorization: token },
      });
      gameData = response.data.data || response.data;
    } catch (e) {
      console.error("DB Sync Failed");
    }

    if (!game && gameData) {
      const p1Name = gameData.player1?.nickname || "Player 1";
      const p2Name = gameData.player2?.nickname || "Player 2";
      const type = gameData.type == "9" ? 9 : 3;
      game = createGame(
        gameId,
        type,
        { id: gameData.player1_user_id, name: p1Name },
        { id: gameData.player2_user_id, name: p2Name }
      );
      game.status = gameData.status === "Playing" ? "playing" : "pending";
    }

    if (!game) {
      socket.emit("error", { message: "Game not found." });
      return;
    }

    const myId = user.id;
    const ghostKey = Object.keys(game.players).find((key) => key == 1);
    const amIDbPlayer2 = gameData && gameData.player2_user_id == myId;

    if (!game.players[myId] && (ghostKey || amIDbPlayer2)) {
      let ghostHand = [];
      let ghostPoints = 0;
      let ghostTricks = 0;
      if (ghostKey && game.players[ghostKey]) {
        ghostHand = game.players[ghostKey].hand || [];
        ghostPoints = game.players[ghostKey].points || 0;
        ghostTricks = game.players[ghostKey].tricks || 0;
        delete game.players[ghostKey];
      }

      game.players[myId] = {
        id: myId,
        name: user.nickname,
        hand: ghostHand,
        points: ghostPoints,
        tricks: ghostTricks,
        token: socket.handshake.auth.token,
      };
      game.player2 = { id: myId, name: user.nickname };
      game.status = "playing";
      if (!game.timer) {
        game.startTurnTimer((timeoutUserId) =>
          handleTimeout(io, gameId, timeoutUserId)
        );
      }
    }

    socket.join(`game_${gameId}`);
    socket.activeGameId = gameId;

    if (game.players[myId]) {
      game.players[myId].token = socket.handshake.auth.token;

      const rawState = game.getStateForPlayer(myId);
      const cleanState = sanitizeState(rawState, game);

      socket.emit("game-state", cleanState);
      broadcastState(io, gameId, game);
    }
  });

  socket.on("play-card", ({ gameId, cardId }) => {
    const user = getUser(socket.id);
    if (user) handleGameMove(io, gameId, user.id, cardId);
  });

  socket.on("surrender", ({ gameId }) => {
    const user = getUser(socket.id);
    const game = getGame(gameId);

    if (!game || !user || !game.players[user.id]) return;

    console.log(`[Game] User ${user.nickname} surrendered.`);

    const winnerId = Object.keys(game.players).find(
      (id) => String(id) !== String(user.id)
    );
    performGameEnd(io, game, gameId, winnerId, user.id, "surrender");
  });
};
