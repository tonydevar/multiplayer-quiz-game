'use strict';

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  touchRoom,
  getRoomSnapshot,
} = require('./rooms');

const questions = require('./questions.json');

const PORT = process.env.PORT || 3001;
const TIME_LIMIT = 15;          // seconds per question
const RESULTS_PAUSE_MS = 3000;  // pause between questions

// ─── Express app ────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// POST /api/rooms — create a new room
app.post('/api/rooms', (req, res) => {
  const { hostName } = req.body;
  if (!hostName || typeof hostName !== 'string' || !hostName.trim()) {
    return res.status(400).json({ error: 'hostName is required' });
  }

  // We don't have a ws id yet at REST time, use a placeholder; the host will
  // identify themselves via player:join on the WebSocket.
  const room = createRoom(hostName.trim(), null);
  return res.status(201).json({ code: room.code });
});

// GET /api/rooms/:code — get room info
app.get('/api/rooms/:code', (req, res) => {
  const room = getRoom(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json(getRoomSnapshot(room));
});

// ─── HTTP + WebSocket server ─────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

let wsIdCounter = 0;

function send(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcast(room, type, payload) {
  for (const client of wss.clients) {
    if (client.roomCode === room.code) {
      send(client, type, payload);
    }
  }
}

function broadcastRoomState(room) {
  broadcast(room, 'room:state', getRoomSnapshot(room));
}

// ─── Game engine ─────────────────────────────────────────────────────────────

function startQuestion(room) {
  const q = questions[room.questionIndex];
  if (!q) {
    endGame(room);
    return;
  }

  // Clear any previous per-round answers
  room.answers = {};
  room.questionStartTime = Date.now();

  broadcast(room, 'question:new', {
    index: room.questionIndex,
    question: q.question,
    choices: q.choices,
    timeLimit: TIME_LIMIT,
  });

  // Schedule timeout
  if (room.timer) clearTimeout(room.timer);
  room.timer = setTimeout(() => {
    resolveRound(room);
  }, TIME_LIMIT * 1000);
}

function resolveRound(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  const q = questions[room.questionIndex];
  const correctAnswer = q.answer;
  const now = Date.now();
  const elapsed = now - (room.questionStartTime || now);

  // Score players
  const scores = {};
  for (const player of room.players) {
    const submission = room.answers && room.answers[player.id];
    let gained = 0;
    if (submission && submission.answer === correctAnswer) {
      // Base score
      gained += 100;
      // Speed bonus: up to +100 based on how quickly they answered
      const timeTaken = Math.max(0, submission.timestamp - room.questionStartTime);
      const speedRatio = Math.max(0, 1 - timeTaken / (TIME_LIMIT * 1000));
      gained += Math.round(speedRatio * 100);
    }
    player.score += gained;
    scores[player.id] = { name: player.name, gained, total: player.score };
  }

  broadcast(room, 'round:results', { correctAnswer, scores });
  touchRoom(room.code);

  // Advance to next question after pause
  room.timer = setTimeout(() => {
    room.timer = null;
    room.questionIndex += 1;
    if (room.questionIndex >= questions.length) {
      endGame(room);
    } else {
      startQuestion(room);
    }
  }, RESULTS_PAUSE_MS);
}

function endGame(room) {
  room.status = 'finished';
  touchRoom(room.code);

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const finalScores = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
  }));
  const winner = finalScores.length > 0 ? finalScores[0] : null;

  broadcast(room, 'game:end', { finalScores, winner });
  broadcastRoomState(room);
}

// ─── WebSocket message handler ────────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.id = String(++wsIdCounter);
  ws.roomCode = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      send(ws, 'error', { message: 'Invalid JSON' });
      return;
    }

    const { type, payload = {} } = msg;

    // ── player:join ──────────────────────────────────────────────────────────
    if (type === 'player:join') {
      const { code, name } = payload;
      if (!code || !name) {
        send(ws, 'error', { message: 'code and name are required' });
        return;
      }

      const roomCode = code.toUpperCase();
      const room = getRoom(roomCode);
      if (!room) {
        send(ws, 'error', { message: 'Room not found' });
        return;
      }
      if (room.status !== 'waiting') {
        send(ws, 'error', { message: 'Game already in progress' });
        return;
      }

      // If this is the host (first player with no id yet), claim that slot
      const hostSlot = room.players.find((p) => p.isHost && p.id === null);
      if (hostSlot) {
        hostSlot.id = ws.id;
        hostSlot.name = name.trim();
      } else {
        addPlayer(room, ws.id, name.trim());
      }

      ws.roomCode = roomCode;
      ws.playerId = ws.id;
      touchRoom(roomCode);
      broadcastRoomState(room);
      return;
    }

    // All subsequent messages require an active room
    const room = ws.roomCode ? getRoom(ws.roomCode) : null;
    if (!room) {
      send(ws, 'error', { message: 'Not in a room' });
      return;
    }

    touchRoom(room.code);

    // ── player:ready ─────────────────────────────────────────────────────────
    if (type === 'player:ready') {
      const player = room.players.find((p) => p.id === ws.playerId);
      if (!player) {
        send(ws, 'error', { message: 'Player not found' });
        return;
      }
      player.ready = payload.ready !== false; // default true
      broadcastRoomState(room);
      return;
    }

    // ── game:start ────────────────────────────────────────────────────────────
    if (type === 'game:start') {
      const player = room.players.find((p) => p.id === ws.playerId);
      if (!player || !player.isHost) {
        send(ws, 'error', { message: 'Only the host can start the game' });
        return;
      }
      if (room.status !== 'waiting') {
        send(ws, 'error', { message: 'Game is not in waiting state' });
        return;
      }
      if (room.players.length < 1) {
        send(ws, 'error', { message: 'Need at least one player' });
        return;
      }

      room.status = 'playing';
      room.questionIndex = 0;
      room.answers = {};
      broadcastRoomState(room);
      startQuestion(room);
      return;
    }

    // ── answer:submit ─────────────────────────────────────────────────────────
    if (type === 'answer:submit') {
      if (room.status !== 'playing') {
        send(ws, 'error', { message: 'Game is not in playing state' });
        return;
      }
      const { questionIndex, answer } = payload;
      if (questionIndex !== room.questionIndex) {
        send(ws, 'error', { message: 'Answer for wrong question' });
        return;
      }
      if (!room.answers) room.answers = {};
      // Only record first submission per player
      if (!room.answers[ws.playerId]) {
        room.answers[ws.playerId] = { answer, timestamp: Date.now() };
      }

      // If all players have answered, resolve early
      const answered = Object.keys(room.answers).length;
      if (answered >= room.players.length) {
        resolveRound(room);
      }
      return;
    }

    send(ws, 'error', { message: `Unknown message type: ${type}` });
  });

  ws.on('close', () => {
    if (!ws.roomCode) return;
    const room = getRoom(ws.roomCode);
    if (!room) return;

    removePlayer(room, ws.playerId);

    if (room.players.length === 0) {
      // Last player left — clean up the room
      if (room.timer) clearTimeout(room.timer);
      return;
    }

    // If the host left, promote next player
    if (!room.players.find((p) => p.isHost)) {
      room.players[0].isHost = true;
    }

    broadcastRoomState(room);
  });

  ws.on('error', () => {});
});

// ─── Start listening ──────────────────────────────────────────────────────────
server.listen(PORT, () => {
  process.stdout.write(`Quiz server listening on port ${PORT}\n`);
});
