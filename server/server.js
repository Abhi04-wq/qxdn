import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { startAccrualCron } from './src/workers/accrualWorker.js';
import { startReleaseCron } from './src/workers/releaseWorker.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startAccrualCron(); // Daily Staking Accrual Engine - runs daily 00:00 UTC
  startReleaseCron(); // Weekly Saturday Release Engine - runs Saturdays 00:05 UTC
  app.listen(PORT, () => {
    console.log(`QNDX API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});
