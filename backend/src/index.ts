import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import tagsRouter from './routes/tags';
import sessionsRouter from './routes/sessions';
import authRouter from './routes/auth';

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/sessions', sessionsRouter);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
