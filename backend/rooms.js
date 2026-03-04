'use strict';

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;   // 5 minutes
const ROOM_TTL_MS = 30 * 60 * 1000;           // 30 minutes

/** @type {Map<string, Room>} */
const rooms = new Map();

/**
 * @typedef {Object} Player
 * @property {string} id       - Unique player id (equals their ws instance id)
 * @property {string} name
 * @property {boolean} isHost
 * @property {boolean} ready
 * @property {number} score
 */

/**
 * @typedef {Object} Room
 * @property {string} code
 * @property {'waiting'|'playing'|'finished'} status
 * @property {Player[]} players
 * @property {number} questionIndex
 * @property {number} lastActivity  - Unix timestamp (ms)
 * @property {Object|null} timer    - Active timeout handle
 */

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(hostName, hostId) {
  const code = generateCode();
  const room = {
    code,
    status: 'waiting',
    players: [
      {
        id: hostId,
        name: hostName,
        isHost: true,
        ready: false,
        score: 0,
      },
    ],
    questionIndex: 0,
    lastActivity: Date.now(),
    timer: null,
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room && room.timer) {
    clearTimeout(room.timer);
  }
  rooms.delete(code);
}

function touchRoom(code) {
  const room = rooms.get(code);
  if (room) {
    room.lastActivity = Date.now();
  }
}

function addPlayer(room, playerId, playerName) {
  if (room.players.find((p) => p.id === playerId)) return;
  room.players.push({
    id: playerId,
    name: playerName,
    isHost: false,
    ready: false,
    score: 0,
  });
  room.lastActivity = Date.now();
}

function removePlayer(room, playerId) {
  room.players = room.players.filter((p) => p.id !== playerId);
  room.lastActivity = Date.now();
}

function getRoomSnapshot(room) {
  return {
    code: room.code,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      ready: p.ready,
      score: p.score,
    })),
    questionIndex: room.questionIndex,
  };
}

// Auto-cleanup: remove stale rooms every CLEANUP_INTERVAL_MS
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      deleteRoom(code);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  touchRoom,
  addPlayer,
  removePlayer,
  getRoomSnapshot,
};
