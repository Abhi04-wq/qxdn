import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/socket.js';
import { startAccrualCron, executeDailyAccrual } from './src/workers/accrualWorker.js';
import { startReleaseCron, releasePendingRewards } from './src/workers/releaseWorker.js';
import { ensureAdminFromEnv } from './src/utils/adminSeeder.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Sync Administrator Account from Environment Variables
  await ensureAdminFromEnv();

  startAccrualCron(); // Daily Staking Accrual Engine - runs daily 00:00 UTC
  startReleaseCron(); // Weekly Saturday Release Engine - runs Saturdays 00:05 UTC

  // Safe Startup Catch-Up for Daily Accrual:
  // Runs daily accrual automatically when server boots or wakes up on Render.
  // Idempotent: Skips stakes already credited today.
  try {
    const summary = await executeDailyAccrual(undefined, 'startup-catchup');
    console.log(`[Startup] Staking accrual check: ${summary.message}`);
  } catch (err) {
    console.error('[Startup] Accrual check failed:', err.message);
  }

  // Safe Startup Catch-Up for Saturday Release:
  // If server boots or wakes up on Saturday (UTC day 6), immediately release any pending weekly rewards.
  // Idempotent: Only updates status: 'pending' -> 'confirmed'.
  const now = new Date();
  if (now.getUTCDay() === 6) {
    try {
      const releaseSummary = await releasePendingRewards('startup-saturday');
      console.log(`[Startup] Saturday release check: ${releaseSummary.message}`);
    } catch (err) {
      console.error('[Startup] Saturday release catch-up failed:', err.message);
    }
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`QNDX API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'}) with WebSocket real-time`);
  });
});
