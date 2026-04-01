import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import quizRouter from './routes/quiz';
import jobsRouter from './routes/jobs';
import recruitRouter from './routes/recruit';
import applicantRouter from './routes/applicant';
import recruiterJobsRouter from './routes/recruiterJobs';
import statsRouter from './routes/stats';
import statsOkr1Router from './routes/statsOkr1';
import { authenticate, requireActive, requireRole } from './middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Comma-separated list in CORS_ORIGIN, or defaults below (local + production deploys).
const defaultCorsOrigins = [
  'http://localhost:5173',
  'https://job-harmony.information-systems.net',
  'http://100.125.157.109:8083',
].join(',');
const allowedOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigins)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Public routes
app.use('/api/quiz', quizRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applicant', applicantRouter);
app.use('/api/stats', statsRouter);
app.use('/api/stats', statsOkr1Router);

// Protected routes
app.use('/api/recruit', authenticate, requireActive, requireRole('recruiter'), recruitRouter);
app.use('/api/recruiter/jobs', authenticate, requireActive, requireRole('recruiter'), recruiterJobsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`JobHarmony backend running on http://localhost:${PORT}`);
});
