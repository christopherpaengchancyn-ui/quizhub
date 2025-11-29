// server.js
const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// Serve static files from root directory (for Render deployment)
app.use(express.static(path.join(__dirname)));

// Serve node_modules for socket.io client (if needed)
app.use("/socket.io", express.static(path.join(__dirname, "node_modules/socket.io/client-dist")));

// Quiz questions
const QUESTIONS = require("./questions.js");

// Scoring constants (same as client)
const SCORING = {
  BASE_POINTS: 100,
  SPEED_BONUS_MAX: 100,
  STREAK_BONUS: 25,
  SURVIVAL_BONUS: 50
};

// Global leaderboard (in-memory, persists during server runtime)
// Format: { "category_mode": [ { name, avatar, score, correct, total, date } ] }
let globalLeaderboard = {};

// Active rooms - now supports categories and game modes
let rooms = {};
/*
rooms[roomKey] = {
   players: { socketId : {name, score, streak, avatar} },
   questions: [],
   started: false,
   category: string,
   gameMode: string
}
*/

// Host rooms - custom games created by hosts
let hostRooms = {};
/*
hostRooms[roomCode] = {
   hostSocketId: string,
   hostName: string,
   hostAvatar: string,
   players: [{ socketId, name, avatar }],
   questions: [],
   started: false,
   scores: { socketId: { name, avatar, score, correct } },
   finishedCount: 0
}
*/

function getRoomKey(category, gameMode) {
  return `${category}_${gameMode}`;
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Join room with category and game mode
  socket.on("joinRoom", ({ name, category, gameMode, avatar }) => {
    const roomKey = getRoomKey(category || 'Easy', gameMode || 'classic');
    socket.join(roomKey);

    if (!rooms[roomKey]) {
      rooms[roomKey] = {
        players: {},
        questions: [],
        started: false,
        category: category || 'Easy',
        gameMode: gameMode || 'classic'
      };
    }

    rooms[roomKey].players[socket.id] = {
      name,
      score: 0,
      streak: 0,
      points: 0,
      avatar: avatar || '😎'
    };

    // Notify all players in room about player count
    const playerCount = Object.keys(rooms[roomKey].players).length;
    io.to(roomKey).emit("playerCount", playerCount);

    // If 2+ players, start quiz
    if (playerCount >= 2 && !rooms[roomKey].started) {
      rooms[roomKey].started = true;

      // Get questions from category
      const categoryQuestions = QUESTIONS[rooms[roomKey].category] || QUESTIONS['Easy'];
      rooms[roomKey].questions = categoryQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

      io.to(roomKey).emit("startQuiz", {
        questions: rooms[roomKey].questions,
        gameMode: rooms[roomKey].gameMode,
        category: rooms[roomKey].category
      });
    }
  });

  // Handle answer with scoring
  socket.on("answer", ({ roomKey, correct, timeTaken }) => {
    if (!rooms[roomKey] || !rooms[roomKey].players[socket.id]) return;

    const player = rooms[roomKey].players[socket.id];
    const gameMode = rooms[roomKey].gameMode;

    if (correct) {
      player.streak++;

      // Calculate points
      let points = SCORING.BASE_POINTS;
      const timeRemaining = 30 - timeTaken;

      if (timeRemaining >= 25) points += SCORING.SPEED_BONUS_MAX;
      else if (timeRemaining >= 20) points += 75;
      else if (timeRemaining >= 15) points += 50;
      else if (timeRemaining >= 10) points += 25;

      points += (player.streak * SCORING.STREAK_BONUS);
      if (gameMode === 'survival') points += SCORING.SURVIVAL_BONUS;
      if (gameMode === 'speed') points += Math.floor(timeRemaining * 5);

      player.points += points;
      player.score++;
    } else {
      player.streak = 0;

      // Survival mode - notify player is out
      if (gameMode === 'survival') {
        socket.emit("gameOver", { points: player.points, score: player.score });
      }
    }

    // Broadcast live scores
    const liveScores = Object.values(rooms[roomKey].players)
      .map(p => ({ name: p.name, points: p.points, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.points - a.points);
    io.to(roomKey).emit("liveScores", liveScores);
  });

  socket.on("finish", ({ roomKey }) => {
    if (!rooms[roomKey]) return;

    const result = Object.values(rooms[roomKey].players)
      .map(p => ({ name: p.name, points: p.points, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.points - a.points);

    io.to(roomKey).emit("matchResult", result);

    // Reset room after a delay
    setTimeout(() => {
      if (rooms[roomKey]) {
        rooms[roomKey].started = false;
        rooms[roomKey].questions = [];
        Object.values(rooms[roomKey].players).forEach(p => {
          p.score = 0;
          p.points = 0;
          p.streak = 0;
        });
      }
    }, 5000);
  });

  // ==================== HOST ROOM EVENTS ====================

  // Host creates a room
  socket.on("createHostRoom", ({ roomCode, hostName, hostAvatar }) => {
    hostRooms[roomCode] = {
      hostSocketId: socket.id,
      hostName,
      hostAvatar,
      players: [],
      questions: [],
      started: false,
      scores: {},
      finishedCount: 0
    };
    socket.join(`host_${roomCode}`);
    console.log(`Host room created: ${roomCode} by ${hostName}`);
  });

  // Host updates questions
  socket.on("updateHostQuestions", ({ roomCode, questions }) => {
    if (hostRooms[roomCode] && hostRooms[roomCode].hostSocketId === socket.id) {
      hostRooms[roomCode].questions = questions;
      // Notify players in lobby about question count
      io.to(`host_${roomCode}`).emit("hostQuestionsUpdated", { questionCount: questions.length });
    }
  });

  // Player joins host room
  socket.on("joinHostRoom", ({ roomCode, playerName, playerAvatar }) => {
    const room = hostRooms[roomCode];
    if (!room) {
      socket.emit("hostRoomError", { message: "Room not found. Check the code and try again." });
      return;
    }
    if (room.started) {
      socket.emit("gameAlreadyStarted");
      return;
    }

    socket.join(`host_${roomCode}`);
    room.players.push({ socketId: socket.id, name: playerName, avatar: playerAvatar });
    room.scores[socket.id] = { name: playerName, avatar: playerAvatar, score: 0, correct: 0 };

    socket.emit("joinedHostRoom", { roomCode });

    // Notify host and other players
    io.to(`host_${roomCode}`).emit("playerJoinedHostRoom", {
      players: room.players.map(p => ({ name: p.name, avatar: p.avatar }))
    });
  });

  // Player rejoins/refreshes lobby
  socket.on("rejoinHostRoom", ({ roomCode, playerName, playerAvatar }) => {
    const room = hostRooms[roomCode];
    if (!room) return;

    socket.join(`host_${roomCode}`);

    // Check if player already exists
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (!existingPlayer) {
      room.players.push({ socketId: socket.id, name: playerName, avatar: playerAvatar });
      room.scores[socket.id] = { name: playerName, avatar: playerAvatar, score: 0, correct: 0 };
    } else {
      existingPlayer.socketId = socket.id;
      room.scores[socket.id] = room.scores[existingPlayer.socketId] || { name: playerName, avatar: playerAvatar, score: 0, correct: 0 };
    }

    // Send room info
    socket.emit("hostRoomInfo", {
      hostName: room.hostName,
      hostAvatar: room.hostAvatar,
      questionCount: room.questions.length,
      players: room.players.map(p => ({ name: p.name, avatar: p.avatar }))
    });
  });

  // Player leaves host room
  socket.on("leaveHostRoom", ({ roomCode }) => {
    const room = hostRooms[roomCode];
    if (!room) return;

    room.players = room.players.filter(p => p.socketId !== socket.id);
    delete room.scores[socket.id];
    socket.leave(`host_${roomCode}`);

    io.to(`host_${roomCode}`).emit("playerLeftHostRoom", {
      players: room.players.map(p => ({ name: p.name, avatar: p.avatar }))
    });
  });

  // Host starts the game
  socket.on("startHostGame", ({ roomCode, questions }) => {
    const room = hostRooms[roomCode];
    if (!room || room.hostSocketId !== socket.id) return;

    room.started = true;
    room.questions = questions;
    room.finishedCount = 0;

    // Reset scores
    Object.keys(room.scores).forEach(sid => {
      room.scores[sid].score = 0;
      room.scores[sid].correct = 0;
    });

    // Notify all players to start
    io.to(`host_${roomCode}`).emit("hostGameStarted", { questions });
    console.log(`Host game started: ${roomCode} with ${questions.length} questions`);
  });

  // Host reconnects to view game
  socket.on("hostReconnect", ({ roomCode }) => {
    const room = hostRooms[roomCode];
    if (!room) return;
    socket.join(`host_${roomCode}`);
    room.hostSocketId = socket.id;
  });

  // Player submits answer in host game
  socket.on("hostGameAnswer", ({ roomCode, score, correct }) => {
    const room = hostRooms[roomCode];
    if (!room || !room.scores[socket.id]) return;

    room.scores[socket.id].score = score;
    room.scores[socket.id].correct = correct;

    // Broadcast live scores
    io.to(`host_${roomCode}`).emit("hostLiveScores", { scores: room.scores });
  });

  // Player finishes host game
  socket.on("hostGameFinished", ({ roomCode, score, correct, total }) => {
    const room = hostRooms[roomCode];
    if (!room) return;

    room.scores[socket.id].score = score;
    room.scores[socket.id].correct = correct;
    room.finishedCount++;

    io.to(`host_${roomCode}`).emit("playerFinished", { finishedCount: room.finishedCount });
    io.to(`host_${roomCode}`).emit("hostLiveScores", { scores: room.scores });

    // If all players finished, send final results
    if (room.finishedCount >= room.players.length) {
      const results = Object.values(room.scores).sort((a, b) => b.score - a.score);
      io.to(`host_${roomCode}`).emit("hostGameResults", { results });
      io.to(`host_${roomCode}`).emit("hostGameComplete");
    }
  });

  // Host ends game
  socket.on("hostEndGame", ({ roomCode }) => {
    const room = hostRooms[roomCode];
    if (!room) return;

    io.to(`host_${roomCode}`).emit("hostLeft");
    delete hostRooms[roomCode];
  });

  // ==================== GLOBAL LEADERBOARD EVENTS ====================

  // Submit score to global leaderboard
  socket.on("submitScore", ({ category, mode, name, avatar, score, correct, total }) => {
    const key = `${category}_${mode}`;
    if (!globalLeaderboard[key]) {
      globalLeaderboard[key] = [];
    }

    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Add new score entry
    globalLeaderboard[key].push({ name, avatar, score, correct, total, date });

    // Sort by score descending and keep top 50
    globalLeaderboard[key].sort((a, b) => b.score - a.score);
    globalLeaderboard[key] = globalLeaderboard[key].slice(0, 50);

    // Broadcast updated leaderboard to all connected clients
    io.emit("leaderboardUpdated", { key, leaderboard: globalLeaderboard[key] });

    console.log(`Score submitted: ${name} scored ${score} in ${key}`);
  });

  // Get leaderboard for a category/mode
  socket.on("getLeaderboard", ({ category, mode }) => {
    const key = `${category}_${mode}`;
    const leaderboard = globalLeaderboard[key] || [];
    socket.emit("leaderboardData", { key, leaderboard });
  });

  // Get all leaderboards
  socket.on("getAllLeaderboards", () => {
    socket.emit("allLeaderboardsData", globalLeaderboard);
  });

  // ==================== DISCONNECT ====================

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    // Handle regular room disconnect
    for (const roomKey in rooms) {
      if (rooms[roomKey].players[socket.id]) {
        delete rooms[roomKey].players[socket.id];

        // Notify remaining players
        const playerCount = Object.keys(rooms[roomKey].players).length;
        io.to(roomKey).emit("playerCount", playerCount);

        // Clean up empty rooms
        if (playerCount === 0) {
          delete rooms[roomKey];
        }
      }
    }

    // Handle host room disconnect
    for (const roomCode in hostRooms) {
      const room = hostRooms[roomCode];

      // If host disconnects
      if (room.hostSocketId === socket.id) {
        io.to(`host_${roomCode}`).emit("hostLeft");
        delete hostRooms[roomCode];
        continue;
      }

      // If player disconnects
      const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIdx !== -1) {
        room.players.splice(playerIdx, 1);
        delete room.scores[socket.id];
        io.to(`host_${roomCode}`).emit("playerLeftHostRoom", {
          players: room.players.map(p => ({ name: p.name, avatar: p.avatar }))
        });
      }
    }
  });

});

http.listen(PORT, () => console.log("🚀 QuizHub Server running on port " + PORT));
