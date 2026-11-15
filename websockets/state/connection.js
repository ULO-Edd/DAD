const users = new Map();

export const addUser = (socketId, userData) => {
  users.set(socketId, userData);
};

export const getUser = (socketId) => {
  return users.get(socketId);
};

export const removeUser = (socketId) => {
  users.delete(socketId);
};

export const getUserCount = () => {
  return users.size;
};
