import BiscaGame from "../classes/BiscaGame.js";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

class BiscaMatch {
  constructor(apiData, emitStateCallback, token, autoPlayCallback) {
    this.id = apiData.id;
    this.emitStateCallback = emitStateCallback;
    this.autoPlayCallback = autoPlayCallback;
    this.token = token;
    this.stake = apiData.stake;
    this.type = apiData.type;
    this.status = apiData.status;

    this.player1Id = apiData.player1_user_id;
    this.player2Id = apiData.player2_user_id;
    this.player1 = apiData.player1;
    this.player2 = apiData.player2;

    this.marks = {
      [this.player1Id]: apiData.player1_marks || 0,
      [this.player2Id]: apiData.player2_marks || 0,
    };

    this.points = {
      [this.player1Id]: apiData.player1_points || 0,
      [this.player2Id]: apiData.player2_points || 0,
    };

    this.currentGame = null;
    this.GHOST_ID = 1;

    if (this.status === "Playing" && this.player2Id !== this.GHOST_ID) {
      this.startNewGame();
    }
  }

  async joinPlayer(userId, user) {
    if (this.player2Id !== this.GHOST_ID) return false;
    if (userId === this.player1Id) return false;

    this.player2Id = userId;
    this.player2 = user;
    this.marks[userId] = 0;
    this.points[userId] = 0;
    this.status = "Playing";

    await this.startNewGame();
    return true;
  }

  getAuthHeaders() {
    return {
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  }

  async startNewGame() {
    console.log(`[Match ${this.id}] Starting new round...`);
    let newGameDbId = null;
    try {
      const payload = {
        type: this.type,
        player1_user_id: this.player1Id,
        player2_user_id: this.player2Id,
        match_id: this.id,
        status: "Playing",
        began_at: new Date().toISOString(),
      };

      const res = await axios.post(
        `${API_URL}/games`,
        payload,
        this.getAuthHeaders()
      );
      const gameData = res.data.game || res.data.data || res.data;
      newGameDbId = gameData.id;

      const p1Name = this.player1?.nickname || `User ${this.player1Id}`;
      const p2Name = this.player2?.nickname || `User ${this.player2Id}`;

      this.currentGame = new BiscaGame(
        this.id,
        this.type,
        { id: this.player1Id, name: p1Name },
        { id: this.player2Id, name: p2Name },
        newGameDbId,
        (result) => {
          this.handleGameEnd(result);
        }
      );

      this.currentGame.init();

      this.currentGame.startTurnTimer((uid, cid) => {
        if (this.autoPlayCallback) this.autoPlayCallback(uid, cid);
      });

      if (this.emitStateCallback) {
        this.emitStateCallback("match:new-round-start", null);
      }
    } catch (e) {
      console.error(`❌ Start Game Error: ${e.message}`);
    }
  }

  async abortCurrentGame(loserId) {
    if (this.currentGame && this.currentGame.dbId) {
      console.log(`[Match ${this.id}] Aborting Game #${this.currentGame.dbId}`);
      try {
        const winnerId =
          loserId == this.player1Id ? this.player2Id : this.player1Id;

        const payload = {
          status: "Ended",
          winner_user_id: winnerId,
          loser_user_id: loserId,
          is_draw: false,
          ended_at: new Date().toISOString(),
        };
        await axios.put(
          `${API_URL}/games/${this.currentGame.dbId}`,
          payload,
          this.getAuthHeaders()
        );
      } catch (e) {
        console.error("Error aborting game:", e.message);
      }
    }
  }

  async handleGameEnd(result) {
    console.log(`[Match ${this.id}] Round ended. Winner: ${result.winnerId}`);

    if (this.points[result.player1_id] !== undefined)
      this.points[result.player1_id] += result.player1_points;
    if (this.points[result.player2_id] !== undefined)
      this.points[result.player2_id] += result.player2_points;

    if (this.currentGame && this.currentGame.dbId) {
      try {
        const payload = {
          status: "Ended",
          winner_user_id: result.winnerId,
          loser_user_id: result.loserId,
          is_draw: result.isDraw,
          player1_points: result.player1_points,
          player2_points: result.player2_points,
          ended_at: new Date().toISOString(),
        };
        await axios.put(
          `${API_URL}/games/${this.currentGame.dbId}`,
          payload,
          this.getAuthHeaders()
        );
      } catch (e) {
        console.error("DB Game Update Error:", e.message);
      }
    }

    let marksToAdd = 0;
    let roundWinnerId = result.winnerId;

    if (roundWinnerId) {
      const winningScore =
        roundWinnerId == result.player1_id
          ? result.player1_points
          : result.player2_points;
      if (winningScore === 120) marksToAdd = 4;
      else if (winningScore > 90) marksToAdd = 2;
      else if (winningScore >= 60) marksToAdd = 1;

      if (this.marks[roundWinnerId] !== undefined)
        this.marks[roundWinnerId] += marksToAdd;
    }

    if (this.emitStateCallback) {
      this.emitStateCallback("match:round-ended", {
        winnerId: roundWinnerId,
        marksAdded: marksToAdd,
        p1Points: result.player1_points,
        p2Points: result.player2_points,
        p1Marks: this.marks[this.player1Id],
        p2Marks: this.marks[this.player2Id],
        reason: result.reason || "points",
      });
    }

    if (this.marks[this.player1Id] >= 4 || this.marks[this.player2Id] >= 4) {
      await this.finishMatch();
      if (this.emitStateCallback)
        this.emitStateCallback("match:ended-signal", null);
    } else {
      setTimeout(() => {
        this.startNewGame();
      }, 1000);
    }
  }

  async finishMatch() {
    this.status = "Ended";
    const winnerId =
      this.marks[this.player1Id] >= 4 ? this.player1Id : this.player2Id;
    const loserId =
      winnerId == this.player1Id ? this.player2Id : this.player1Id;

    const payload = {
      status: "Ended",
      winner_user_id: winnerId,
      loser_user_id: loserId,
      player1_marks: this.marks[this.player1Id],
      player2_marks: this.marks[this.player2Id],
      player1_points: this.points[this.player1Id],
      player2_points: this.points[this.player2Id],
    };

    try {
      await axios.put(
        `${API_URL}/matches/${this.id}`,
        payload,
        this.getAuthHeaders()
      );
      console.log(`[Match ${this.id}] Match Closed in DB.`);
    } catch (e) {
      console.error(`Match Close Error: ${e.message}`);
    }
  }

  playCard(userId, cardId) {
    if (!this.currentGame || this.status !== "Playing") return;

    const result = this.currentGame.playCard(userId, cardId);

    if (
      result &&
      (result.action === "next_turn" || result.action === "trick_resolved")
    ) {
      this.currentGame.startTurnTimer((uid, cid) => {
        if (this.autoPlayCallback) this.autoPlayCallback(uid, cid);
      });
    }

    return result;
  }

  getGameState(userId) {
    if (!this.currentGame) return null;
    if (this.currentGame.players[userId])
      return this.currentGame.getStateForPlayer(userId);
    return null;
  }

  getPublicState() {
    return {
      matchId: this.id,
      status: this.status,
      marks: this.marks,
      points: this.points,
      player1: this.player1,
      player2: this.player2,
    };
  }
}

export default BiscaMatch;
