import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from "path";
import { createServer } from 'http';
import mongoose from "mongoose";

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use('/api/public', express.static(path.join(__dirname, "../public")));
app.use('/uploads', express.static(path.join(__dirname, "../uploads")));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tarag";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import routes
import authRoutes from './routes/auth';
import weatherRoutes from './routes/weather';
import userRoutes from './routes/user';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/users', userRoutes);

app.get('/', (_req, res) => {
  res.send('TaraG Backend is Running');
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'TaraG Backend is healthy'
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
