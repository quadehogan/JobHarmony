import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Applicant, RecruitApiResponse } from '../types';
import ApplicantCard from '../components/ApplicantCard';

export default function Recruit() {
  const [data, setData] = useState<RecruitApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="jh-recruit-container">
      <div className="jh-recruit-header">
        <div className="jh-section-header">
          <h2>Recruit Talent</h2>
          <p>Find candidates whose personality and skills align with your openings.</p>
        </div>
        <Link to="/recruit/jobs/new" className="jh-btn-primary">+ Add Job</Link>
      </div>

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
