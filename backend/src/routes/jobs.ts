import { Router, Request, Response } from 'express';
import { supabase } from '../db/database';
import { Job } from '../types';
import { getJobs as getSeedJobs } from '../data/seedData';
import { optionalAuth } from '../middleware';
import type { AuthenticatedRequest } from '../middleware';
import {
  buildFitReason,
  buildJobVector,
  buildUserVector,
  distanceToMatchPercent,
  scoreToFitLevel,
  weightedEuclideanDistance,
  type JobTargetVector,
} from '../services/fitScoring';

const router = Router();

function splitCsv(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function buildTargetVector(job: Job): JobTargetVector | null {
  const vector = {
    Openness: toNumber(job.targetOpenness),
    Conscientiousness: toNumber(job.targetConscientiousness),
    Extraversion: toNumber(job.targetExtraversion),
    Agreeableness: toNumber(job.targetAgreeableness),
    EmotionalStability: toNumber(job.targetEmotionalStability),
    Realistic: toNumber(job.targetRealistic),
    Investigative: toNumber(job.targetInvestigative),
    Artistic: toNumber(job.targetArtistic),
    Social: toNumber(job.targetSocial),
    Enterprising: toNumber(job.targetEnterprising),
    Conventional: toNumber(job.targetConventional),
    Autonomy: toNumber(job.targetAutonomy),
    Security: toNumber(job.targetSecurity),
    Challenge: toNumber(job.targetChallenge),
    Service: toNumber(job.targetService),
    WorkLifeBalance: toNumber(job.targetWorkLifeBalance),
    Pace: toNumber(job.targetPace),
    Collaboration: toNumber(job.targetCollaboration),
    Structure: toNumber(job.targetStructure),
  };

  const hasMissing = Object.values(vector).some((v) => typeof v !== 'number');
  if (hasMissing) return null;

  return vector as JobTargetVector;
}

async function getLatestAggregateScores(userId: string): Promise<{ dimension: string; normalizedScore: number }[] | null> {
  const { data: session, error: sessionErr } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionErr || !session?.id) return null;

  const { data: rows, error: scoresErr } = await supabase
    .from('dimension_scores')
    .select('dimension, normalized_score, subdimension')
    .eq('session_id', session.id)
    .eq('subdimension', '');

  if (scoresErr || !rows) return null;

  return rows.map((row: any) => ({
    dimension: String(row.dimension),
    normalizedScore: Number(row.normalized_score),
  }));
}

function stripJobFit(job: Job): Job {
  return { ...job, fitScore: 0, fitLevel: '', fitReason: '' };
}

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const authUserId = (req as AuthenticatedRequest).authUser?.id ?? null;
  const { data, error } = await supabase.from('Jobs').select('*').order('Id', { ascending: true });
  let jobs: Job[] = [];

  if (error || !data) {
    // Keep the app usable locally even if Supabase is misconfigured.
    console.error('Failed to load jobs from Supabase:', error);
    jobs = getSeedJobs();
  } else {
    jobs = data.map((row: any) => ({
      id: row.Id,
      title: row.Title,
      company: row.Company,
      logoEmoji: row.LogoEmoji,
      location: row.Location,
      salary: row.Salary,
      type: row.Type,
      description: row.Description ?? undefined,
      personalityType: row.PersonalityType ?? undefined,
      applyUrl: row.ApplyUrl ?? undefined,
      fitScore: row.FitScore ?? 0,
      fitLevel: row.FitLevel ?? '',
      fitReason: row.FitReason ?? '',
      tags: splitCsv(row.Tags),
      postedDaysAgo: row.PostedDaysAgo ?? 0,
      targetOpenness: row.TargetOpenness ?? undefined,
      targetConscientiousness: row.TargetConscientiousness ?? undefined,
      targetExtraversion: row.TargetExtraversion ?? undefined,
      targetAgreeableness: row.TargetAgreeableness ?? undefined,
      targetEmotionalStability: row.TargetEmotionalStability ?? undefined,
      targetRealistic: row.TargetRealistic ?? undefined,
      targetInvestigative: row.TargetInvestigative ?? undefined,
      targetArtistic: row.TargetArtistic ?? undefined,
      targetSocial: row.TargetSocial ?? undefined,
      targetEnterprising: row.TargetEnterprising ?? undefined,
      targetConventional: row.TargetConventional ?? undefined,
      targetAutonomy: row.TargetAutonomy ?? undefined,
      targetSecurity: row.TargetSecurity ?? undefined,
      targetChallenge: row.TargetChallenge ?? undefined,
      targetService: row.TargetService ?? undefined,
      targetWorkLifeBalance: row.TargetWorkLifeBalance ?? undefined,
      targetPace: row.TargetPace ?? undefined,
      targetCollaboration: row.TargetCollaboration ?? undefined,
      targetStructure: row.TargetStructure ?? undefined,
    }));
  }

  let fitPersonalized = false;
  if (authUserId) {
    const aggregateScores = await getLatestAggregateScores(authUserId);
    if (aggregateScores && aggregateScores.length > 0) {
      fitPersonalized = true;
      const userVector = buildUserVector(
        aggregateScores.map((s) => ({
          dimension: s.dimension,
          subdimension: '',
          rawScore: 0,
          normalizedScore: s.normalizedScore,
        })),
      );

      jobs = jobs
        .map((job) => {
          const targetVector = buildTargetVector(job);
          if (!targetVector) return stripJobFit(job);
          const jobVector = buildJobVector(targetVector);
          const distance = weightedEuclideanDistance(userVector, jobVector);
          const fitScore = distanceToMatchPercent(distance);
          return {
            ...job,
            fitScore,
            fitLevel: scoreToFitLevel(fitScore),
            fitReason: buildFitReason(userVector, jobVector),
          };
        })
        .sort((a, b) => b.fitScore - a.fitScore);
    }
  }

  if (!fitPersonalized) {
    jobs = jobs.map(stripJobFit);
  }

  const allTags = [...new Set(jobs.flatMap((j) => j.tags))];
  const allTypes = [...new Set(jobs.map((j) => j.type))];
  const allLocations = [...new Set(jobs.map((j) => j.location))];

  res.json({
    jobs,
    allTags,
    allTypes,
    allLocations,
    fitPersonalized,
    source: error ? 'seed' : 'supabase',
  });
});

export default router;
