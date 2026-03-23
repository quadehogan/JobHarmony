import { Router, Request, Response } from 'express';
import { supabase } from '../db/database';
import { Job } from '../types';
import { getJobs as getSeedJobs } from '../data/seedData';

const router = Router();
let fallbackJobs: Job[] = getSeedJobs();

function splitCsv(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapJobRow(row: any): Job {
  return {
    id: row.Id,
    title: row.Title,
    company: row.Company,
    logoEmoji: row.LogoEmoji,
    location: row.Location,
    salary: row.Salary,
    type: row.Type,
    description: row.Description ?? undefined,
    personalityType: row.PersonalityType ?? undefined,
    fitScore: row.FitScore ?? 0,
    fitLevel: row.FitLevel ?? '',
    fitReason: row.FitReason ?? '',
    tags: splitCsv(row.Tags),
    postedDaysAgo: row.PostedDaysAgo ?? 0,
  };
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((tag) => normalizeText(tag))
      .filter(Boolean);
  }

  return splitCsv(value);
}

function buildJobFilters(jobs: Job[]) {
  return {
    allTags: [...new Set(jobs.flatMap((j) => j.tags))],
    allTypes: [...new Set(jobs.map((j) => j.type))],
    allLocations: [...new Set(jobs.map((j) => j.location))],
  };
}

function buildFitReason(personalityType?: string): string {
  return personalityType
    ? `This role is aimed at candidates who align with a ${personalityType} work style.`
    : 'This recruiter-posted role is ready for applicants. Take the quiz to see how well it fits your profile.';
}

router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('Jobs').select('*').order('Id', { ascending: true });
  let jobs: Job[] = [];

  if (error || !data) {
    // Keep the app usable locally even if Supabase is misconfigured.
    console.error('Failed to load jobs from Supabase:', error);
    jobs = fallbackJobs;
  } else {
    jobs = data.map(mapJobRow);
  }

  const { allTags, allTypes, allLocations } = buildJobFilters(jobs);

  res.json({
    jobs,
    allTags,
    allTypes,
    allLocations,
    source: error ? 'seed' : 'supabase',
  });
});

router.post('/', async (req: Request, res: Response) => {
  const title = normalizeText(req.body?.title);
  const company = normalizeText(req.body?.company);
  const logoEmoji = normalizeText(req.body?.logoEmoji) || '💼';
  const location = normalizeText(req.body?.location);
  const salary = normalizeText(req.body?.salary);
  const type = normalizeText(req.body?.type);
  const description = normalizeText(req.body?.description) || undefined;
  const personalityType = normalizeText(req.body?.personalityType) || undefined;
  const tags = normalizeTags(req.body?.tags);

  if (!title || !company || !location || !salary || !type) {
    res.status(400).json({
      message: 'title, company, location, salary, and type are required',
    });
    return;
  }

  const fitReason = buildFitReason(personalityType);

  const { data, error } = await supabase
    .from('Jobs')
    .insert({
      Title: title,
      Company: company,
      LogoEmoji: logoEmoji,
      Location: location,
      Salary: salary,
      Type: type,
      Description: description ?? null,
      PersonalityType: personalityType ?? null,
      FitScore: 75,
      FitLevel: 'Good',
      FitReason: fitReason,
      Tags: tags.join(', '),
      PostedDaysAgo: 0,
    })
    .select('*')
    .single();

  if (!error && data) {
    res.status(201).json({
      job: mapJobRow(data),
      source: 'supabase',
    });
    return;
  }

  console.error('Failed to create job in Supabase, using in-memory fallback:', error);

  const nextId = fallbackJobs.reduce((max, job) => Math.max(max, job.id), 0) + 1;
  const createdJob: Job = {
    id: nextId,
    title,
    company,
    logoEmoji,
    location,
    salary,
    type,
    description,
    personalityType,
    fitScore: 75,
    fitLevel: 'Good',
    fitReason,
    tags,
    postedDaysAgo: 0,
  };

  fallbackJobs = [createdJob, ...fallbackJobs];

  res.status(201).json({
    job: createdJob,
    source: 'memory',
  });
});

export default router;
