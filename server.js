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

// Create a games Map to store game state
const games = new Map();

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
      
      // Create game if it doesn't exist
      if (!games.has(gameCode)) {
        games.set(gameCode, {
          players: {},
          board: Array(9).fill(null),
          currentPlayer: 'X',
          status: 'waiting'
        });
      }

      const game = games.get(gameCode);
      
      // Assign player to a symbol
      if (!game.players.X) {
        game.players.X = { id: socket.id, name: playerId };
        socket.emit('playerAssigned', { symbol: 'X', isHost: true });
        
        // Store player info on the socket for reconnection
        socket.data.playerSymbol = 'X';
        socket.data.gameCode = gameCode;
        socket.data.isHost = true;
        
        console.log(`Player ${playerId} assigned as X (host) with ID ${socket.id}`);
      } else if (!game.players.O && game.players.X.id !== socket.id) {
        game.players.O = { id: socket.id, name: playerId };
        socket.emit('playerAssigned', { symbol: 'O', isHost: false });
        
        // Store player info on the socket for reconnection
        socket.data.playerSymbol = 'O';
        socket.data.gameCode = gameCode;
        socket.data.isHost = false;
        
        console.log(`Player ${playerId} assigned as O with ID ${socket.id}`);
        
        // Notify all players that a new player has joined
        io.to(gameCode).emit('playerJoined', {
          players: [
            { symbol: 'X', name: game.players.X.name, isHost: true },
            { symbol: 'O', name: playerId, isHost: false }
          ]
        });
      } else if (game.players.X.id === socket.id) {
        // Returning player X
        socket.emit('playerAssigned', { symbol: 'X', isHost: true });
        socket.data.playerSymbol = 'X';
        socket.data.gameCode = gameCode;
        socket.data.isHost = true;
        console.log(`Returning host player X: ${playerId} with ID ${socket.id}`);
      } else if (game.players.O && game.players.O.id === socket.id) {
        // Returning player O
        socket.emit('playerAssigned', { symbol: 'O', isHost: false });
        socket.data.playerSymbol = 'O';
        socket.data.gameCode = gameCode;
        socket.data.isHost = false;
        console.log(`Returning guest player O: ${playerId} with ID ${socket.id}`);
      }
      
      // Send current game state to the player
      socket.emit('gameState', game);
    });

    socket.on('makeMove', ({ gameCode, index, symbol }) => {
      console.log(`Move in game ${gameCode}: player with symbol ${symbol} at ${index}`);
      
      // Get the current game
      const game = games.get(gameCode);
      
      // Validate the move
      if (!game) {
        console.log('Game not found');
        return;
      }
      
      if (game.status !== 'playing') {
        console.log('Game not in playing state, current status:', game.status);
        return;
      }
      
      if (game.currentPlayer !== symbol) {
        console.log(`Not player ${symbol}'s turn. Current player is ${game.currentPlayer}`);
        return;
      }
      
      if (game.board[index] !== null) {
        console.log('Cell already filled with:', game.board[index]);
        return;
      }
      
      // Validate symbol against socket
      let validPlayer = false;
      if (symbol === 'X' && game.players.X?.id === socket.id) {
        validPlayer = true;
      } else if (symbol === 'O' && game.players.O?.id === socket.id) {
        validPlayer = true;
      }
      
      if (!validPlayer) {
        console.log('Invalid player tried to make a move');
        return;
      }
      
      // Update the board
      game.board[index] = symbol;
      
      // Check for win condition (optional)
      
      // Switch to the other player's turn
      game.currentPlayer = symbol === 'X' ? 'O' : 'X';
      
      console.log('Updated game state after move:', {
        board: game.board,
        currentPlayer: game.currentPlayer
      });
      
      // Broadcast the updated game state to all players
      io.to(gameCode).emit('gameState', game);
    });

    socket.on('startGame', ({ gameCode }) => {
      console.log(`Starting game ${gameCode}, requested by socket ${socket.id}`);
      
      const game = games.get(gameCode);
      if (!game) {
        console.log('Game not found');
        return;
      }
      
      // Make sure the request is coming from the host
      const isHostRequest = socket.id === game.players.X?.id;
      console.log('Request from host?', isHostRequest);
      console.log('Host ID (from game):', game.players.X?.id);
      console.log('Requester ID (from socket):', socket.id);
      
      if (!isHostRequest) {
        console.log('Non-host tried to start game, ignoring');
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      // Update game status to playing
      game.status = 'playing';
      game.currentPlayer = 'X'; // X always starts
      game.board = Array(9).fill(null); // Reset board
      
      console.log('Game started! Updated state:', {
        status: game.status,
        currentPlayer: game.currentPlayer,
        board: game.board
      });
      
      // Broadcast the updated game state to all players
      io.to(gameCode).emit('gameState', game);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Check if player was in a game
      const gameCode = socket.data.gameCode;
      if (gameCode && games.has(gameCode)) {
        const game = games.get(gameCode);
        const symbol = socket.data.playerSymbol;
        
        if (symbol === 'X' && game.players.X && game.players.X.id === socket.id) {
          console.log('Host (X) disconnected');
          // Optional: You could end the game or allow reconnection
        } else if (symbol === 'O' && game.players.O && game.players.O.id === socket.id) {
          console.log('Guest (O) disconnected');
          // Optional: You could end the game or allow reconnection
        }
        
        // Notify other players
        io.to(gameCode).emit('playerDisconnected', { symbol });
      }
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