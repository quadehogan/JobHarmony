export interface QuizQuestion {
  id: number;
  text: string;
  dimension: string;
  subdimension: string;
  section: string;
  sectionOrder: number;
  questionFormat: 'Likert' | 'Interest';
  isReverseScored: boolean;
  weight: number;
  tier: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  logoEmoji: string;
  location: string;
  salary: string;
  type: string;
  applyUrl?: string;
  fitScore: number;
  fitLevel: string;
  fitReason: string;
  tags: string[];
  postedDaysAgo: number;
}

export interface Applicant {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  bio?: string;
  resumeUrl?: string;
  resumeFitPercent: number;
  personalityFitPercent: number;
  skills: string[];
  isRecommended: boolean;
  title: string;
}

export interface CareerMatch {
  careerProfileId: number;
  title: string;
  matchScore: number;
  rank: number;
}

export interface QuizResults {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  emotionalStability: number;
  motivationType: string;
  motivationDescription: string;
  motivationIcon: string;
  careerMatches?: CareerMatch[];
}

export interface SnackbarState {
  message: string;
  visible: boolean;
  undoFn?: () => void;
}

export interface JobsApiResponse {
  jobs: Job[];
  allTags: string[];
  allTypes: string[];
  allLocations: string[];
  /** True when fit scores are computed from the signed-in user's saved quiz. */
  fitPersonalized?: boolean;
  source?: string;
}

export interface RecruitApiResponse {
  recommendedApplicants: Applicant[];
  allApplicants: Applicant[];
}

export type UserRole = 'job_seeker' | 'recruiter' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  verification_status: VerificationStatus;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
