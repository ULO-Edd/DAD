const matches = new Map();

export const addMatch = (match) => {
  matches.set(parseInt(match.id), match);
  return match;
};

export const getMatch = (id) => {
  return matches.get(parseInt(id));
};

export const removeMatch = (id) => {
  matches.delete(parseInt(id));
};

export { matches };
