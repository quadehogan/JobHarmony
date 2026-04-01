import { Router, Request, Response } from 'express';
import { supabase } from '../db/database';

const router = Router();

const PAGE = 1000;

/**
 * OKR page `/okr1` — same metric definition, implemented separately from `/okr` stats.
 */
router.get('/users-with-quiz-scores-okr1', async (_req: Request, res: Response) => {
  try {
    const sessionIds = new Set<string>();
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from('dimension_scores')
        .select('session_id')
        .range(from, from + PAGE - 1);

      if (error) throw error;
      if (!data?.length) break;

      for (const row of data) {
        const sid = row.session_id as string | undefined;
        if (sid) sessionIds.add(sid);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }

    if (sessionIds.size === 0) {
      res.json({ count: 0 });
      return;
    }

    const userIds = new Set<string>();
    const ids = [...sessionIds];

    for (let i = 0; i < ids.length; i += PAGE) {
      const chunk = ids.slice(i, i + PAGE);
      const { data: sessions, error: qsErr } = await supabase
        .from('quiz_sessions')
        .select('user_id')
        .in('id', chunk)
        .not('user_id', 'is', null);

      if (qsErr) throw qsErr;
      for (const row of sessions ?? []) {
        const uid = row.user_id as string | null;
        if (uid) userIds.add(uid);
      }
    }

    res.json({ count: userIds.size });
  } catch (err) {
    console.error('[stats /okr1] Failed to count users with quiz scores:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

export default router;
