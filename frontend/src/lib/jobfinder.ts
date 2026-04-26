import { Job, Application } from '../contexts/JobsContext';
import { authFetch, API_BASE as AUTH_API_BASE, getGlobalLogout } from '../contexts/AuthContext';

const API_BASE = AUTH_API_BASE;

function handleLogout() {
  const globalLogout = getGlobalLogout();
  if (globalLogout) {
    globalLogout();
  } else {
    // Fallback: clear storage and redirect
    localStorage.removeItem('jobfinder_auth');
    localStorage.removeItem('jobfinder_tokens');
    window.location.href = '/auth/login';
  }
}

// Public fetch (no auth needed)
async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw await res.json();
  return res.json();
}

// Authenticated fetch with auto-refresh
async function authGetJSON(url: string) {
  const res = await authFetch(url, {}, handleLogout);
  if (!res.ok) throw await res.json();
  return res.json();
}

async function authPostJSON(url: string, body: any) {
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, handleLogout);
  if (!res.ok) throw await res.json();
  return res.json();
}

async function authPatchJSON(url: string, body: any) {
  const res = await authFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, handleLogout);
  if (!res.ok) throw await res.json();
  return res.json();
}

async function authDeleteJSON(url: string) {
  const res = await authFetch(url, { method: 'DELETE' }, handleLogout);
  if (!res.ok) throw await res.json();
}

// Public endpoints (no auth required)
export async function listForms(): Promise<Job[]> {
  const data = await fetchJSON(`${API_BASE}/api/jobfinder/forms/`);
  // map backend shape to frontend Job where necessary — keep minimal mapping
  return (data || []).map((f: any) => ({
    id: String(f.id),
    title: f.title,
    company: f.display_verified_company || f.verified_company || '',
    companyLogo: undefined,
    location: [f.address, f.city, f.country].filter(Boolean).join(', '),
    salary: f.salary_from && f.salary_to ? `${f.salary_from} - ${f.salary_to} ${f.display_salary_currency || ''}` : (f.display_salary_currency || ''),
    type: (f.work_format && f.work_format.code) || 'full-time',
    category: f.job_type && f.job_type.name ? f.job_type.name : '',
    description: f.description || '',
    requirements: (f.requirements || '').split('\n').filter(Boolean),
    benefits: (f.benefits || '').split('\n').filter(Boolean),
    postedDate: f.created_at,
    employerId: f.created_by ? String(f.created_by) : '',
    status: f.status || 'pending',
  }));
}

export async function getForm(id: string): Promise<Job> {
  const f = await fetchJSON(`${API_BASE}/api/jobfinder/forms/${id}/`);
  return {
    id: String(f.id),
    title: f.title,
    company: f.display_verified_company || f.verified_company || '',
    companyLogo: undefined,
    location: [f.address, f.city, f.country].filter(Boolean).join(', '),
    salary: f.salary_from && f.salary_to ? `${f.salary_from} - ${f.salary_to} ${f.display_salary_currency || ''}` : (f.display_salary_currency || ''),
    type: (f.work_format && f.work_format.code) || 'full-time',
    category: f.job_type && f.job_type.name ? f.job_type.name : '',
    description: f.description || '',
    requirements: (f.requirements || '').split('\n').filter(Boolean),
    benefits: (f.benefits || '').split('\n').filter(Boolean),
    postedDate: f.created_at,
    employerId: f.created_by ? String(f.created_by) : '',
    status: f.status || 'pending',
  };
}

// Authenticated endpoints (require auth, auto-refresh on 401)
export async function createForm(payload: any): Promise<Job> {
  const f = await authPostJSON(`${API_BASE}/api/jobfinder/forms/`, payload);
  return getForm(String(f.id));
}

export async function updateForm(id: string, payload: any): Promise<Job> {
  await authPatchJSON(`${API_BASE}/api/jobfinder/forms/${id}/`, payload);
  return getForm(id);
}

export async function deleteForm(id: string): Promise<void> {
  await authDeleteJSON(`${API_BASE}/api/jobfinder/forms/${id}/`);
}

// Public lookup endpoints
export async function listWorkFormats() {
  return fetchJSON(`${API_BASE}/api/jobfinder/work-formats/`);
}

export async function listJobTypes() {
  return fetchJSON(`${API_BASE}/api/jobfinder/job-types/`);
}

export async function listCurrencies() {
  return fetchJSON(`${API_BASE}/api/jobfinder/currencies/`);
}

export async function listVerifiedCompanies() {
  return fetchJSON(`${API_BASE}/api/jobfinder/verified-companies/`);
}

// Authenticated: apply to job
export async function applyToJob(jobId: string, application: { cover_letter?: string; cv_url?: string }): Promise<any> {
  return authPostJSON(`${API_BASE}/api/jobfinder/applications/`, {
    form: parseInt(jobId),
    cover_letter: application.cover_letter || '',
    cv_url: application.cv_url || '',
  });
}

// Application API functions
export interface ApplicationResponse {
  id: number;
  form: number;
  job_id: number;
  job_title: string;
  applicant: number;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_avatar: string | null;
  cover_letter: string;
  cv_url: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  updated_at: string;
}

export async function listMyApplications(): Promise<ApplicationResponse[]> {
  return authGetJSON(`${API_BASE}/api/jobfinder/applications/`);
}

export async function listApplicationsForJob(jobId: string): Promise<ApplicationResponse[]> {
  return authGetJSON(`${API_BASE}/api/jobfinder/applications/for-job/${jobId}/`);
}

export async function approveApplication(appId: string): Promise<ApplicationResponse> {
  return authPostJSON(`${API_BASE}/api/jobfinder/applications/${appId}/approve/`, {});
}

export async function rejectApplication(appId: string): Promise<ApplicationResponse> {
  return authPostJSON(`${API_BASE}/api/jobfinder/applications/${appId}/reject/`, {});
}

export async function withdrawApplication(appId: string): Promise<void> {
  return authDeleteJSON(`${API_BASE}/api/jobfinder/applications/${appId}/`);
}
