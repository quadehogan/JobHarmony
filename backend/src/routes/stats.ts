import { Router, Request, Response } from 'express';
import { supabase } from '../db/database';

const router = Router();

router.get('/users-with-quiz-scores', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('dimension_scores')
      .select('quiz_sessions!inner(user_id)')
      .not('quiz_sessions.user_id', 'is', null);

    if (error) {
      console.error('Failed to count users with quiz scores:', error);
      res.status(500).json({ message: 'Failed to load stats' });
      return;
    }

    const userIds = new Set(
      (data as any[]).map((row) => row.quiz_sessions?.user_id).filter(Boolean)
    );
    res.json({ count: userIds.size });
  } catch (err) {
    console.error('Failed to count users with quiz scores:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

export default router;
