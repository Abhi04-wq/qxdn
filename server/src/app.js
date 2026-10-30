import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import stakingRoutes from './routes/stakingRoutes.js';
import testRoutes from './routes/testRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

app.get('/', (req, res) => res.json({ name: 'QNDX API', status: 'running' }));
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', referralRoutes);
app.use('/api', walletRoutes);
app.use('/api', stakingRoutes);
app.use('/api', testRoutes);
app.use('/api', ticketRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
