import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer as createViteServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const games = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinGame', ({ gameId, player }) => {
    socket.join(gameId);
    
    if (!games.has(gameId)) {
      games.set(gameId, {
        players: {},
        board: Array(9).fill(null),
        moves: [],
        currentPlayer: 'X',
        status: 'waiting'
      });
    }

    const game = games.get(gameId);
    
    if (!game.players.X) {
      game.players.X = { id: socket.id, name: player };
      socket.emit('playerAssigned', { symbol: 'X' });
    } else if (!game.players.O) {
      game.players.O = { id: socket.id, name: player };
      socket.emit('playerAssigned', { symbol: 'O' });
      game.status = 'playing';
      io.to(gameId).emit('gameStart', game);
    }

    io.to(gameId).emit('gameState', game);
  });

  socket.on('makeMove', ({ gameId, index }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = Object.entries(game.players).find(([_, p]) => p.id === socket.id);
    if (!player || player[0] !== game.currentPlayer) return;

    if (game.board[index] === null) {
      game.board[index] = game.currentPlayer;
      game.moves.push(index);

      if (game.moves.length > 7) {
        const oldestMove = game.moves.shift();
        game.board[oldestMove] = null;
      }

      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      io.to(gameId).emit('gameState', game);
    }
  });

  socket.on('disconnect', () => {
    games.forEach((game, gameId) => {
      if (game.players.X?.id === socket.id || game.players.O?.id === socket.id) {
        game.status = 'ended';
        io.to(gameId).emit('playerDisconnected');
        games.delete(gameId);
      }
    });
  });
});

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

app.use(vite.middlewares);

const port = 5173;
httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});