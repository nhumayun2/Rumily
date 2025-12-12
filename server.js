import dotenv from 'dotenv';
import 'dotenv/config';
import 'express-async-errors'; // Imports directly without assignment
import http from 'http';
import express from 'express';
import cors from 'cors';

// Local Imports (Extensions are mandatory in ES6)
import connectDB from './utils/db.js';
import { initSocket } from './utils/socket.js';
// We haven't created these folders/files yet, but we will follow this structure
import mainRouter from './route/index.js'; 
import errorHandlerMiddleware from './middleware/error-handler.js';
import notFoundMiddleware from './middleware/not-found.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
app.set('io', io);

// Global Middleware
app.use(express.json());
app.use(cors());

// Main Route
app.use('/api/v1', mainRouter);

// Error Handling Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();