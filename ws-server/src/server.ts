import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: '../.env' });

const app = express();

// Use CORS to allow our Next.js frontend to connect
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// A simple health check endpoint to see if the server is running
app.get('/', (req, res) => {
  res.send('WebSocket Server is running!');
});

// This is where all our real-time magic will happen
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔥 A user disconnected:', socket.id);
  });

  // Example event listener
  socket.on('ping', () => {
    console.log(`Received ping from ${socket.id}. Sending pong.`);
    socket.emit('pong');
  });
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is listening on port ${PORT}`);
});