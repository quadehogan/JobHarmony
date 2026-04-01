import { Job } from '../types';
import { useAuth } from '../context/AuthContext';
import { showSnackbar } from './Snackbar';

const STORAGE_KEY = 'jh-saved-jobs';

function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

interface JobCardProps {
  job: Job;
  onSaveToggle?: () => void;
}

export default function JobCard({ job, onSaveToggle }: JobCardProps) {
  const { user } = useAuth();
  const showMatch = Boolean(user);
  const savedIds = getSavedIds();
  const isSaved = savedIds.includes(String(job.id));

  function toggleSave() {
    const ids = getSavedIds();
    const idx = ids.indexOf(String(job.id));

    if (idx !== -1) {
      ids.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      showSnackbar('Job removed from saved', () => {
        const restored = getSavedIds();
        restored.push(String(job.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        onSaveToggle?.();
      });
    } else {
      ids.push(String(job.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      showSnackbar('Job saved!', () => {
        const restored = getSavedIds();
        const i = restored.indexOf(String(job.id));
        if (i !== -1) restored.splice(i, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        onSaveToggle?.();
      });
    }

    onSaveToggle?.();
  }

  const postedText = job.postedDaysAgo === 1 ? '1 day ago' : `${job.postedDaysAgo} days ago`;
  const hasApplyUrl = typeof job.applyUrl === 'string' && job.applyUrl.length > 0;
  const showFit = Boolean(job.fitLevel?.trim()) && job.fitScore > 0;

  return (
    <div
      className="jh-job-card"
      data-job-id={job.id}
      data-type={job.type}
      data-location={job.location}
      data-tags={job.tags.join(',')}
      data-title={job.title}
      data-company={job.company}
    >
      <div className="jh-job-header">
        <div className="jh-job-logo">{job.logoEmoji}</div>
        <div className="jh-job-info">
          <h3>{job.title}</h3>
          <div className="jh-job-company">{job.company}</div>
        </div>
        {!showMatch ? null : showFit ? (
          <div className={`jh-fit-badge ${(job.fitLevel || 'moderate').toLowerCase()}`}>{job.fitScore}%</div>
        ) : (
          <div className="jh-fit-badge-placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="jh-job-tags">
        {job.tags.map((tag) => (
          <span key={tag} className="jh-tag">{tag}</span>
        ))}
      </div>

      {showMatch && showFit ? <div className="jh-job-fit-reason">{job.fitReason}</div> : null}

      <div className="jh-job-meta">
        <span>📍 {job.location}</span>
        <span>💰 {job.salary}</span>
        <span>💼 {job.type}</span>
        <span>📅 {postedText}</span>
      </div>

      <div className="jh-job-actions">
        <a
          href={hasApplyUrl ? job.applyUrl : '#'}
          className="jh-btn-primary"
          target={hasApplyUrl ? '_blank' : undefined}
          rel={hasApplyUrl ? 'noopener noreferrer' : undefined}
          aria-disabled={!hasApplyUrl}
          onClick={(e) => {
            if (!hasApplyUrl) {
              e.preventDefault();
              showSnackbar('Application link not available for this listing yet.');
            }
          }}
        >
          Apply Now
        </a>
        <button
          className={`jh-save-btn${isSaved ? ' saved' : ''}`}
          onClick={toggleSave}
        >
          <span className="save-icon">{isSaved ? '♥' : '♡'}</span> Save
        </button>
      </div>
    </div>
  );
}
