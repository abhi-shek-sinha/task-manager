import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import { startCronJobs } from './utils/cronJobs';

dotenv.config();

for (const key of ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header include health checks and same-origin tools.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
};

// Connect to Database & Start Cron Jobs
connectDB().then(() => {
  startCronJobs();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.send({ status: 'Server running smoothly' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
