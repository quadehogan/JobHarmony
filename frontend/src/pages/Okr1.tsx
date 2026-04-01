import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const POLL_MS = 30_000;

const OKR_TEXT =
  'Revolutionize the job search experience by prioritizing psychological fit over traditional resumes';

export default function Okr1() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient('/api/stats/users-with-quiz-scores-okr1');
      if (!res.ok) {
        setError('Could not load the latest count.');
        return;
      }
      const data = (await res.json()) as { count?: number };
      if (typeof data.count === 'number' && Number.isFinite(data.count)) {
        setCount(data.count);
        setError(null);
      } else {
        setError('Unexpected response from server.');
      }
    } catch {
      setError('Could not load the latest count.');
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <>
      <section className="jh-hero">
        <h1>Our OKR</h1>
        <p className="jh-okr-statement">{OKR_TEXT}</p>
      </section>

      <section className="jh-section">
        <div className="container">
          <div className="jh-section-header">
            <h2>Progress signal</h2>
            <p>
              Logged-in members who have completed the quiz with saved scores (updates about every
              30 seconds).
            </p>
          </div>
          <div className="jh-okr-metric" aria-live="polite">
            {error && <p className="jh-okr-error">{error}</p>}
            {!error && count === null && <p className="jh-okr-loading">Loading…</p>}
            {!error && count !== null && (
              <p className="jh-okr-count">
                <span className="jh-okr-count-value">{count}</span>
                <span className="jh-okr-count-label">users with quiz scores saved</span>
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
