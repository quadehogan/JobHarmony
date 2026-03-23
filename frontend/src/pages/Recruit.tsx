import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Applicant, CreateJobRequest, CreateJobResponse, Job, RecruitApiResponse } from '../types';
import ApplicantCard from '../components/ApplicantCard';
import { showSnackbar } from '../components/Snackbar';

const EMPTY_JOB_FORM: CreateJobRequest = {
  title: '',
  company: '',
  logoEmoji: '💼',
  location: '',
  salary: '',
  type: 'Full-time',
  description: '',
  personalityType: '',
  tags: '',
};

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];

export default function Recruit() {
  const [data, setData] = useState<RecruitApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [jobForm, setJobForm] = useState<CreateJobRequest>(EMPTY_JOB_FORM);
  const [jobSubmitError, setJobSubmitError] = useState<string | null>(null);
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [jobSource, setJobSource] = useState<'supabase' | 'memory' | null>(null);

  useEffect(() => {
    fetch('/api/recruit')
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Failed to load applicants (${r.status})`);
        }
        return r.json() as Promise<RecruitApiResponse>;
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load applicants');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const recommended: Applicant[] = data?.recommendedApplicants ?? [];
  const all: Applicant[] = data?.allApplicants ?? [];

  function updateField<K extends keyof CreateJobRequest>(field: K, value: CreateJobRequest[K]) {
    setJobForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddJobSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJobSubmitError(null);
    setJobSubmitting(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });

      const payload = (await response.json()) as Partial<CreateJobResponse> & { message?: string };

      if (!response.ok || !payload.job || !payload.source) {
        throw new Error(payload.message ?? 'Failed to create job');
      }

      setCreatedJob(payload.job);
      setJobSource(payload.source);
      setJobForm(EMPTY_JOB_FORM);
      setIsAddJobOpen(false);
      showSnackbar('Job posted successfully!');
    } catch (err) {
      setJobSubmitError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setJobSubmitting(false);
    }
  }

  return (
    <div className="jh-recruit-container">
      <div className="jh-recruit-header">
        <div className="jh-section-header">
          <h2>Recruit Talent</h2>
          <p>Find candidates whose personality and skills align with your openings.</p>
        </div>
        <button
          className="jh-btn-primary"
          onClick={() => {
            setIsAddJobOpen((open) => !open);
            setJobSubmitError(null);
          }}
        >
          {isAddJobOpen ? 'Close Form' : '+ Add Job'}
        </button>
      </div>

      {isAddJobOpen && (
        <div className="jh-add-job-panel">
          <div className="jh-add-job-panel-head">
            <div>
              <h3>Post a new job</h3>
              <p>Add a listing that will appear in the shared jobs feed.</p>
            </div>
          </div>

          {jobSubmitError && (
            <div className="jh-auth-error" role="alert">
              {jobSubmitError}
            </div>
          )}

          <form className="jh-add-job-form" onSubmit={handleAddJobSubmit}>
            <label className="jh-field">
              <span>Job Title</span>
              <input
                type="text"
                value={jobForm.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Senior Product Designer"
                required
              />
            </label>

            <label className="jh-field">
              <span>Company</span>
              <input
                type="text"
                value={jobForm.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="JobHarmony"
                required
              />
            </label>

            <div className="jh-add-job-grid">
              <label className="jh-field">
                <span>Location</span>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Remote or Salt Lake City, UT"
                  required
                />
              </label>

              <label className="jh-field">
                <span>Salary</span>
                <input
                  type="text"
                  value={jobForm.salary}
                  onChange={(e) => updateField('salary', e.target.value)}
                  placeholder="$90k - $120k"
                  required
                />
              </label>
            </div>

            <div className="jh-add-job-grid">
              <label className="jh-field">
                <span>Job Type</span>
                <select
                  value={jobForm.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  required
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="jh-field">
                <span>Logo Emoji</span>
                <input
                  type="text"
                  value={jobForm.logoEmoji}
                  onChange={(e) => updateField('logoEmoji', e.target.value)}
                  placeholder="💼"
                  maxLength={2}
                />
                <small>Optional, but makes the job card feel more alive.</small>
              </label>
            </div>

            <label className="jh-field">
              <span>Tags</span>
              <input
                type="text"
                value={jobForm.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="React, Remote-friendly, Design Systems"
              />
              <small>Separate tags with commas.</small>
            </label>

            <label className="jh-field">
              <span>Ideal Personality Type</span>
              <input
                type="text"
                value={jobForm.personalityType}
                onChange={(e) => updateField('personalityType', e.target.value)}
                placeholder="Collaborative problem solver"
              />
            </label>

            <label className="jh-field">
              <span>Description</span>
              <textarea
                value={jobForm.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                placeholder="Describe the role, team, and what success looks like."
              />
            </label>

            <div className="jh-auth-actions">
              <button className="jh-btn-primary" type="submit" disabled={jobSubmitting}>
                {jobSubmitting ? 'Posting…' : 'Post Job'}
              </button>
              <button
                className="jh-btn-secondary"
                type="button"
                onClick={() => {
                  setJobForm(EMPTY_JOB_FORM);
                  setJobSubmitError(null);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {createdJob && (
        <div className="jh-add-job-success">
          <div>
            <strong>{createdJob.title}</strong> at <strong>{createdJob.company}</strong> was posted.
            {jobSource === 'memory' && (
              <div className="jh-add-job-note">
                Saved in local fallback mode because Supabase was unavailable.
              </div>
            )}
          </div>
          <div className="jh-add-job-success-actions">
            <Link to="/jobs" className="jh-btn-outline">View Jobs</Link>
            <button className="jh-btn-secondary" onClick={() => setIsAddJobOpen(true)}>
              Post Another
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="jh-empty-state" style={{ marginBottom: '1.5rem' }}>
          <h3>Loading recruiter dashboard</h3>
          <p>Pulling candidate recommendations now.</p>
        </div>
      )}

      {error && (
        <div className="jh-empty-state" style={{ marginBottom: '1.5rem' }}>
          <h3>Couldn’t load applicants</h3>
          <p>{error}</p>
        </div>
      )}

      {recommended.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="jh-top-candidates-heading">Top Candidates</h3>
          <div className="jh-applicant-grid">
            {recommended.map((applicant) => (
              <ApplicantCard key={applicant.id} applicant={applicant} />
            ))}
          </div>
        </div>
      )}

      {all.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1.25rem' }}>All Applicants</h3>
          <div className="jh-applicant-grid">
            {all.map((applicant) => (
              <ApplicantCard key={applicant.id} applicant={applicant} />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && recommended.length === 0 && all.length === 0 && (
        <div className="jh-empty-state">
          <h3>No applicants yet</h3>
          <p>Post a job to start building your recruiting pipeline.</p>
        </div>
      )}
    </div>
  );
}
