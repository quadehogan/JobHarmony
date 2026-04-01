import { Router, Request, Response } from 'express';
import { sql } from '../db/database';

const router = Router();

router.get('/users-with-quiz-scores', async (_req: Request, res: Response) => {
  try {
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(DISTINCT qs.user_id)::text AS count
      FROM quiz_sessions qs
      INNER JOIN dimension_scores ds ON ds.session_id = qs.id
      WHERE qs.user_id IS NOT NULL
    `;
    const raw = rows[0]?.count ?? '0';
    const count = Number.parseInt(raw, 10);
    res.json({ count: Number.isFinite(count) ? count : 0 });
  } catch (err) {
    console.error('Failed to count users with quiz scores:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

export default router;
