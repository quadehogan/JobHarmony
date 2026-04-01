import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Job, JobsApiResponse } from '../types';
import JobCard from '../components/JobCard';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'jh-saved-jobs';

function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export default function SavedJobs() {
  const { user } = useAuth();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(getSavedIds());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const r = await apiClient('/api/jobs');
        if (!r.ok) {
          throw new Error(`Failed to load jobs (${r.status})`);
        }
        const d = (await r.json()) as Partial<JobsApiResponse>;
        if (!cancelled) setAllJobs(d.jobs ?? []);
      } catch (e) {
        if (!cancelled) {
          setAllJobs([]);
          setError(e instanceof Error ? e.message : 'Failed to load jobs');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSaveToggle = useCallback(() => {
    setSavedIds(getSavedIds());
  }, []);

  const savedJobs = allJobs.filter((job) => savedIds.includes(String(job.id)));

  return (
    <div className="jh-jobs-container" id="jh-saved-page">
      <div className="jh-section-header" style={{ marginBottom: '2rem' }}>
        <h2>Saved Jobs</h2>
        <p>Jobs you've bookmarked for later.</p>
      </div>

      {error && (
        <div className="jh-empty-state" style={{ marginBottom: '1.5rem' }}>
          <h3>Couldn’t load jobs</h3>
          <p>{error}</p>
        </div>
      )}

      <div id="jh-saved-job-list">
        {savedJobs.map((job) => (
          <JobCard key={job.id} job={job} onSaveToggle={handleSaveToggle} />
        ))}
      </div>

      {savedJobs.length === 0 && (
        <div className="jh-empty-state" id="jh-saved-empty">
          <span className="jh-empty-icon">🔖</span>
          <h3>No Saved Jobs Yet</h3>
          <p>Browse job listings and save the ones that interest you.</p>
          <Link to="/jobs" className="jh-btn-primary">Browse Jobs</Link>
        </div>
      )}
    </div>
  );
}
