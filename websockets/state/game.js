import BiscaGame from "../classes/BiscaGame.js";

const activeGames = new Map();

export const createGame = (id, type, player1, player2) => {
  const existingGame = activeGames.get(id);
  if (existingGame) {
    console.log(
      `[Game State] Game ${id} already exists, returning existing instance`
    );
    return existingGame;
  }
  const game = new BiscaGame(id, type, player1, player2);

  game.init();

  activeGames.set(id, game);

  console.log(`[Game State] Game created: ${id} (Type: ${type})`);
  return game;
};

export const getGame = (id) => {
  return activeGames.get(id);
};

export const removeGame = (id) => {
  const game = activeGames.get(id);
  if (game) {
    game.stopTimer();
    activeGames.delete(id);
    console.log(`[Game State] Game removed: ${id}`);
  }
};

