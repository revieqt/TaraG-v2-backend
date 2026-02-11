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
import authRouter from './modules/auth/auth.routes';
import weatherRouter from './modules/weather/weather.routes';
import userRouter from './routes/user';
import safetyRouter from './modules/safety/safety.routes';
import routesRouter from './routes/routes';
import alertRouter from './routes/alert';
import announcementRouter from './modules/announcements/announcements.route';
import systemRouter from './modules/system/system.routes';

// Routes
app.use('/api/auth', authRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/users', userRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/routes', routesRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/system-health', systemRouter);

app.get('/', (_req, res) => {
  res.send('TaraG Backend is Running');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
