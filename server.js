import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import next from 'next';

// Setup Next.js
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const __dirname = dirname(fileURLToPath(import.meta.url));

nextApp.prepare().then(() => {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinGame', ({ gameCode, playerId }) => {
      console.log(`Player ${playerId} joining game ${gameCode}`);
      socket.join(gameCode);
      
      // Your game logic here
    });

    socket.on('makeMove', ({ gameCode, index, playerId, symbol }) => {
      console.log(`Move in game ${gameCode}: player ${playerId} at ${index}`);
      io.to(gameCode).emit('gameMove', { index, playerId, symbol });
    });

    socket.on('startGame', ({ gameCode }) => {
      console.log(`Starting game ${gameCode}`);
      io.to(gameCode).emit('gameStarted', { status: 'playing' });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Handle all requests with Next.js
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  // Start server
  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});