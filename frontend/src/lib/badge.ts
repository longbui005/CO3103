type AnyJob = Record<string, any>;

const colorMap: Record<string, string> = {
  // work formats
  'onsite': 'bg-primary/10 text-primary',
  'on-site': 'bg-primary/10 text-primary',
  'onsite_work': 'bg-primary/10 text-primary',
  'remote': 'bg-success/10 text-success',
  'hybrid': 'bg-accent/10 text-accent',
  // job types
  'full-time': 'bg-primary/10 text-primary',
  'part-time': 'bg-warning/10 text-warning',
};

function normalizeKey(k?: string) {
  if (!k) return '';
  return k.toString().trim().toLowerCase();
}

export function resolveWorkFormatLabel(job: AnyJob) {
  // prefer API-provided display fields
  return job.display_work_format || job.displayWorkFormat || job.type || job.work_format || '';
}

export function resolveJobTypeLabel(job: AnyJob) {
  return job.display_job_type || job.displayJobType || job.category || job.job_type || '';
}

export function badgeColorForKey(keyish?: string) {
  const key = normalizeKey(keyish);
  return colorMap[key] || 'bg-muted text-muted-foreground';
}

// Given a job object, return color for its work format (or job type fallback)
export function badgeColorForJob(job: AnyJob) {
  const k = job.work_format || job.type || job.job_type || '';
  return badgeColorForKey(k);
}

export default {
  resolveWorkFormatLabel,
  resolveJobTypeLabel,
  badgeColorForKey,
  badgeColorForJob,
};
