class BiscaGame {
  constructor(id, type, player1, player2, dbId = null, onGameEnd = null) {
    this.id = id;
    this.dbId = dbId;
    this.type = type;
    this.onGameEnd = onGameEnd;

    this.deck = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.timer = null;
    this.turnDeadline = null;
    this.timeoutCallback = null;

    this.table = {
      playerCard: null,
      opponentCard: null,
      firstPlayerId: null,
    };

    this.currentTurn = null;
    this.status = "pending";
    this.startTime = null;

    this.players = {
      [player1.id]: {
        id: player1.id,
        name: player1.name,
        hand: [],
        points: 0,
        tricks: 0,
      },
      [player2.id]: {
        id: player2.id,
        name: player2.name,
        hand: [],
        points: 0,
        tricks: 0,
      },
    };
  }

  init() {
    this.deck = this.createDeck();
    const lastCard = this.deck.pop();
    this.trumpCard = lastCard;
    this.trumpSuit = lastCard.suit;

    this.dealInitialCards();

    const playerKeys = Object.keys(this.players);
    const startKey = playerKeys.find((key) => key != 1) || playerKeys[0];
    this.currentTurn = this.players[startKey].id;

    this.startTime = Date.now();
    this.status = "playing";
  }

  startTurnTimer(callback) {
    if (this.timer) clearTimeout(this.timer);

    this.timeoutCallback = callback;
    const DURATION_MS = 20000;
    this.turnDeadline = Date.now() + DURATION_MS;

    console.log(`[Game ${this.id}] Timer started for User ${this.currentTurn}`);

    this.timer = setTimeout(() => {
      this.handleTimeout();
    }, DURATION_MS);
  }

  stopTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.turnDeadline = null;
  }

  handleTimeout() {
    console.log(
      `[Game ${this.id}] Timeout! Auto-playing for ${this.currentTurn}`
    );

    const lowestCard = this.getLowestCard(this.currentTurn);

    if (lowestCard && this.timeoutCallback) {
      this.timeoutCallback(this.currentTurn, lowestCard.id);
    }
  }

  getLowestCard(userId) {
    const hand = this.players[userId].hand;
    if (!hand || hand.length === 0) return null;

    const sortedHand = [...hand].sort((a, b) => a.strength - b.strength);
    return sortedHand[0];
  }

  createDeck() {
    const suits = ["c", "e", "o", "p"];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];
    let deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          strength: this.getStrength(rank),
          points: this.getPoints(rank),
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  dealInitialCards() {
    const cardsToDeal = this.type == 9 ? 9 : 3;
    const pIds = Object.keys(this.players);
    for (let i = 0; i < cardsToDeal; i++) {
      pIds.forEach((id) => this.drawCard(id));
    }
  }

  drawCard(userId) {
    if (this.deck.length > 0) {
      this.players[userId].hand.push(this.deck.pop());
    } else if (this.trumpCard) {
      this.players[userId].hand.push(this.trumpCard);
      this.trumpCard = null;
    }
  }

  playCard(userId, cardId) {
    if (this.currentTurn != userId) return { error: "Not your turn!" };

    const player = this.players[userId];
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);

    if (cardIndex === -1) return { error: "You don't own that card!" };

    const card = player.hand[cardIndex];

    const deckEmpty = this.deck.length === 0 && this.trumpCard === null;
    if (this.table.playerCard && deckEmpty) {
      const suitToFollow = this.table.playerCard.suit;
      const hasSuit = player.hand.some((c) => c.suit === suitToFollow);
      if (hasSuit && card.suit !== suitToFollow) {
        return { error: "You must follow the suit!" };
      }
    }

    this.stopTimer();

    player.hand.splice(cardIndex, 1);

    if (!this.table.playerCard) {
      this.table.playerCard = card;
      this.table.firstPlayerId = userId;
      this.currentTurn = this.getOpponentId(userId);
      return { action: "next_turn" };
    } else {
      this.table.opponentCard = card;
      return this.resolveTrick();
    }
  }

  resolveTrick() {
    const p1Id = this.table.firstPlayerId;
    const p2Id = this.getOpponentId(p1Id);
    const card1 = this.table.playerCard;
    const card2 = this.table.opponentCard;

    let winnerId = p2Id;
    let p1Wins = false;

    if (card2.suit === this.trumpSuit && card1.suit !== this.trumpSuit)
      p1Wins = false;
    else if (card1.suit === this.trumpSuit && card2.suit !== this.trumpSuit)
      p1Wins = true;
    else if (card1.suit === card2.suit)
      p1Wins = card1.strength > card2.strength;
    else p1Wins = true;

    winnerId = p1Wins ? p1Id : p2Id;

    const points = card1.points + card2.points;
    this.players[winnerId].points += points;
    this.players[winnerId].tricks += 1;
    this.currentTurn = winnerId;

    if (this.deck.length > 0 || this.trumpCard) {
      this.drawCard(winnerId);
      this.drawCard(this.getOpponentId(winnerId));
    }

    const trickResult = { winnerId, points, cards: [card1, card2] };
    this.table = { playerCard: null, opponentCard: null, firstPlayerId: null };

    if (this.players[winnerId].hand.length === 0) {
      this.status = "finished";
      this.stopTimer();

      const pIds = Object.keys(this.players);
      const p1Obj = this.players[pIds[0]];
      const p2Obj = this.players[pIds[1]];

      const totalTime = (Date.now() - this.startTime) / 1000;

      let gameWinnerId = null;
      let isDraw = false;

      if (p1Obj.points > p2Obj.points) gameWinnerId = p1Obj.id;
      else if (p2Obj.points > p1Obj.points) gameWinnerId = p2Obj.id;
      else isDraw = true;

      const finalWinner = isDraw ? null : gameWinnerId;
      const finalLoser = isDraw
        ? null
        : gameWinnerId == p1Obj.id
          ? p2Obj.id
          : p1Obj.id;

      const result = {
        action: "game_ended",
        trickResult,
        winnerId: finalWinner,
        loserId: finalLoser,
        isDraw: isDraw,
        player1_id: pIds[0],
        player1_points: p1Obj.points,
        player2_id: pIds[1],
        player2_points: p2Obj.points,
        totalTime: totalTime,
      };

      if (this.onGameEnd) {
        this.onGameEnd(result);
      }
      return result;
    }

    return { action: "trick_resolved", trickResult };
  }

  getStateForPlayer(userId) {
    const oppId = this.getOpponentId(userId);
    return {
      id: this.id,
      dbId: this.dbId,
      trumpCard: this.trumpCard,
      trumpSuit: this.trumpSuit,
      deckCount: this.deck.length + (this.trumpCard ? 1 : 0),
      currentTurn: this.currentTurn,
      table: this.table,
      hand: this.players[userId].hand,
      points: this.players[userId].points,
      opponent: {
        points: this.players[oppId].points,
        cardCount: this.players[oppId].hand.length,
      },
      turnDeadline: this.turnDeadline,
    };
  }

  getOpponentId(id) {
    return Object.keys(this.players).find((pid) => pid != id);
  }
  getPoints(r) {
    const p = { 1: 11, 7: 10, 13: 4, 11: 3, 12: 2 };
    return p[r] || 0;
  }
  getStrength(r) {
    const s = {
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
    return s[r] || 0;
  }
}

export default BiscaGame;
