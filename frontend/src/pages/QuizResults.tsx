import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { QuizResults, CareerMatch } from '../types';

const TRAITS: { key: keyof QuizResults; label: string }[] = [
  { key: 'openness', label: 'Openness' },
  { key: 'conscientiousness', label: 'Conscientiousness' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Agreeableness' },
  { key: 'emotionalStability', label: 'Emotional Stability' },
];

const WORK_STYLE: Record<string, { strengths: string[]; environments: string[] }> = {
  'The Innovator': {
    strengths: ['Creative problem-solving', 'Adapting to change', 'Big-picture thinking'],
    environments: ['Startups', 'R&D teams', 'Design agencies'],
  },
  'The Achiever': {
    strengths: ['Attention to detail', 'Reliability & follow-through', 'Goal-driven focus'],
    environments: ['Finance', 'Engineering', 'Operations'],
  },
  'The Connector': {
    strengths: ['Relationship building', 'Team collaboration', 'Communication'],
    environments: ['Sales', 'HR & Recruiting', 'Management'],
  },
  'The Harmonizer': {
    strengths: ['Empathy & listening', 'Conflict resolution', 'Building trust'],
    environments: ['Healthcare', 'Education', 'Non-profits'],
  },
  'The Anchor': {
    strengths: ['Composure under pressure', 'Logical decision-making', 'Dependability'],
    environments: ['Crisis management', 'Law & Compliance', 'Project management'],
  },
};

export default function QuizResults() {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('jh-quiz-results');
    if (stored) {
      try {
        setResults(JSON.parse(stored) as QuizResults);
        animationTimer.current = setTimeout(() => setBarsAnimated(true), 300);
      } catch {
        // malformed data — stay null
      }
    }

    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, []);

  function handleRetake() {
    localStorage.removeItem('jh-quiz-results');
    navigate('/quiz');
  }

  if (!results) {
    return (
      <div className="jh-results-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--jh-gray-600)', marginBottom: '1.5rem' }}>
          No results yet — take the quiz to see your personality profile and career matches.
        </p>
        <Link to="/quiz" className="jh-btn-primary">Take the Quiz</Link>
      </div>
    );
  }

  const topMatches: CareerMatch[] = results.careerMatches?.slice(0, 5) ?? [];
  const workStyle = WORK_STYLE[results.motivationType] ?? WORK_STYLE['The Innovator'];

  return (
    <div className="jh-results-page">
      {/* Full-width motivation hero */}
      <div className="jh-motivation-card">
        <span className="jh-motivation-icon" id="jh-result-icon">{results.motivationIcon}</span>
        <h1 id="jh-result-type">{results.motivationType}</h1>
        <p id="jh-result-desc">{results.motivationDescription}</p>
      </div>

      {/* Desktop 3-column layout */}
      <div className="jh-results-layout">

        {/* Left sidebar — Work Style */}
        <aside className="jh-results-sidebar">
          <div className="jh-sidebar-card">
            <h3>Your Work Style</h3>
            <p className="jh-sidebar-section-label">Key Strengths</p>
            <ul className="jh-sidebar-list">
              {workStyle.strengths.map(s => <li key={s}>{s}</li>)}
            </ul>
            <p className="jh-sidebar-section-label">Thrives In</p>
            <ul className="jh-sidebar-list">
              {workStyle.environments.map(e => <li key={e}>{e}</li>)}
            </ul>
          </div>
        </aside>

        {/* Center — main results */}
        <div className="jh-results-main">
          <div className="jh-traits-card">
            <h3>Your Personality Profile</h3>
            {TRAITS.map(({ key, label }) => {
              const value = results[key] as number;
              return (
                <div key={key} className="jh-trait-row">
                  <div className="jh-trait-label">
                    <span>{label}</span>
                    <span className="jh-trait-value" data-trait={key}>{value}%</span>
                  </div>
                  <div className="jh-trait-bar">
                    <div
                      className="jh-trait-fill"
                      data-trait={key}
                      style={{ width: barsAnimated ? `${value}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {topMatches.length > 0 && (
            <div className="jh-traits-card" style={{ marginTop: '1.5rem' }}>
              <h3>Your Top Career Matches</h3>
              {topMatches.map((match) => (
                <div key={match.careerProfileId} className="jh-trait-row">
                  <div className="jh-trait-label">
                    <span>{match.rank}. {match.title}</span>
                    <span className="jh-trait-value">{Math.round(match.matchScore)}%</span>
                  </div>
                  <div className="jh-trait-bar">
                    <div
                      className="jh-trait-fill"
                      style={{ width: barsAnimated ? `${match.matchScore}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions for mobile (hidden on desktop, shown via sidebar on desktop) */}
          <div className="jh-results-mobile-actions" style={{ textAlign: 'center', marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/jobs" className="jh-btn-primary">Browse Matching Jobs →</Link>
            <button className="jh-btn-secondary" onClick={handleRetake}>Retake Quiz</button>
          </div>
        </div>

        {/* Right sidebar — Take Action */}
        <aside className="jh-results-sidebar">
          <div className="jh-sidebar-card">
            <h3>Take Action</h3>
            <div className="jh-sidebar-actions">
              <Link to="/jobs" className="jh-btn-primary">Browse Matching Jobs →</Link>
              <button className="jh-btn-secondary" onClick={handleRetake}>Retake Quiz</button>
            </div>
            <div className="jh-sidebar-tip">
              Your results are saved locally and will be here when you return.
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
