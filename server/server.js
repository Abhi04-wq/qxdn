import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/socket.js';
import { startAccrualCron, executeDailyAccrual } from './src/workers/accrualWorker.js';
import { startReleaseCron } from './src/workers/releaseWorker.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  startAccrualCron(); // Daily Staking Accrual Engine - runs daily 00:00 UTC
  startReleaseCron(); // Weekly Saturday Release Engine - runs Saturdays 00:05 UTC

  // Safe Startup Catch-Up: Runs daily accrual automatically when server boots or wakes up on Render.
  // Idempotent: Skips stakes already credited today.
  try {
    const summary = await executeDailyAccrual(undefined, 'startup-catchup');
    console.log(`[Startup] Staking accrual check: ${summary.message}`);
  } catch (err) {
    console.error('[Startup] Accrual check failed:', err.message);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`QNDX API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'}) with WebSocket real-time`);
  });
});
