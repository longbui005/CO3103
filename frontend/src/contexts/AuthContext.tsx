import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  avatar?: string;
  company?: string;
  cvUrl?: string;
  cv?: string;  // Cloudinary URL for CV
  cv_filename?: string;  // Original filename
  phone?: string;
  gender?: string; // backend uses gender codes (e.g. 'MALE', 'FEMALE')
  dob?: string; // "YYYY-MM-DD"
  status?: string; // account status (e.g. 'ACTIVE', 'PENDING_VERIFICATION')
}

type RegisterInput = {
  username?: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  gender?: string; // send backend gender code (e.g. 'MALE')
  dob?: string; // "YYYY-MM-DD"
};

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterInput) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'jobfinder_auth';
const TOKEN_KEY = 'jobfinder_tokens';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

async function postJSON(url: string, body: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function getJSON(url: string, token?: string) {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

// Try to refresh the access token using the refresh token
async function tryRefreshToken(): Promise<string | null> {
  try {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (!tok) return null;
    const { refresh } = JSON.parse(tok);
    if (!refresh) return null;

    const res = await fetch(`${API_BASE}/api/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // Update stored tokens with new access token
    const newTokens = { access: data.access, refresh: data.refresh || refresh };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));
    return data.access;
  } catch {
    return null;
  }
}

// Wrapper for authenticated API calls with auto-refresh
async function authFetch(
  url: string,
  options: RequestInit = {},
  onLogout: () => void
): Promise<Response> {
  const tok = localStorage.getItem(TOKEN_KEY);
  let access = tok ? JSON.parse(tok).access : null;

  const doFetch = (token: string | null) => {
    const headers: any = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  let res = await doFetch(access);

  // If 401, try to refresh token and retry once
  if (res.status === 401 && access) {
    const newAccess = await tryRefreshToken();
    if (newAccess) {
      res = await doFetch(newAccess);
    } else {
      // Refresh failed - logout user
      onLogout();
    }
  }

  return res;
}

// Export utilities for use in other components
export { TOKEN_KEY, API_BASE };

// Global logout handler for use in lib/jobfinder.ts
let globalLogoutFn: (() => void) | null = null;

export function setGlobalLogout(fn: () => void) {
  globalLogoutFn = fn;
}

export function getGlobalLogout(): (() => void) | null {
  return globalLogoutFn;
}

// Get current access token (refreshing if needed)
export async function getAccessToken(): Promise<string | null> {
  const tok = localStorage.getItem(TOKEN_KEY);
  if (!tok) return null;
  
  const { access, refresh } = JSON.parse(tok);
  if (!access) return null;

  // Check if token is expired by decoding JWT
  try {
    const payload = JSON.parse(atob(access.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // If token expires in less than 30 seconds, refresh it
    if (exp - now < 30000) {
      const newAccess = await tryRefreshToken();
      return newAccess;
    }
    
    return access;
  } catch {
    // If we can't decode the token, try to use it anyway
    return access;
  }
}

// Export authFetch for use in components that need authenticated requests
export { authFetch };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize user synchronously from localStorage so page refresh preserves session
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const saveUserAndTokens = (u: User, tokens?: { access: string; refresh?: string }) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      // use username to obtain token
      const tokenResp = await postJSON(`${API_BASE}/api/users/token/`, { username, password });
      const access = tokenResp.access;
      const refresh = tokenResp.refresh;

      // fetch current user and profile, then merge
      const me = await getJSON(`${API_BASE}/api/users/me/`, access);
      try {
        const profile = await getJSON(`${API_BASE}/api/users/profiles/me/`, access);
        if (profile) {
          me.dob = profile.dob ?? me.dob;
          me.gender = profile.gender ?? me.gender;
          me.cv = profile.cv ?? me.cv;
          me.cv_filename = profile.cv_filename ?? me.cv_filename;
        }
      } catch (e) {
        // profile may not exist yet
      }
      const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
      const u: User = {
        id: String(me.id),
        email: me.email,
        username: me.username,
        first_name: me.first_name,
        last_name: me.last_name,
        role: me.role ? String(me.role).toLowerCase() as any : undefined,
        name: fullName || undefined,
        avatar: me.avatar || undefined,
        phone: me.phone,
        gender: me.gender,
        dob: me.dob,
        status: me.status?.toUpperCase(),
        cv: me.cv || undefined,
        cv_filename: me.cv_filename || undefined,
      };
      saveUserAndTokens(u, { access, refresh });
      return { success: true };
    } catch (err: any) {
      // Extract error message from response
      // postJSON throws { status, data } where data contains the response body
      const errorData = err?.data || err;
      const errorMessage = errorData?.detail || errorData?.message || 'Email hoặc mật khẩu không chính xác';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: RegisterInput): Promise<boolean> => {
    try {
      // split name
      const name = data.name.trim();
      const [first_name, ...rest] = name.split(/\s+/);
      const last_name = rest.join(' ');

      // prepare payload for backend
      const payload = {
        username: data.username || data.email, // prefer explicit username, fall back to email
        password: data.password,
        first_name: first_name || '',
        last_name: last_name || '',
        email: data.email,
        phone: data.phone || '',
        role_code: 'USER',
        status_code: 'PENDING_VERIFICATION',
      };

      await postJSON(`${API_BASE}/api/users/register/`, payload);

      // immediately obtain tokens and fetch profile
      // use the username we sent to the backend (do not send email in place of username)
      const tokenResp = await postJSON(`${API_BASE}/api/users/token/`, { username: payload.username, password: data.password });
      const access = tokenResp.access;
      const refresh = tokenResp.refresh;

      // If dob or gender provided, set profile via protected endpoint first
      if (data.dob || data.gender) {
        try {
          await fetch(`${API_BASE}/api/users/profiles/me/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access}`,
            },
            body: JSON.stringify({ dob: data.dob || null, gender: data.gender || null }),
          });
        } catch (e) {
          // ignore
        }
      }

      // fetch current user and profile, then merge
      const me = await getJSON(`${API_BASE}/api/users/me/`, access);
      try {
        const profile = await getJSON(`${API_BASE}/api/users/profiles/me/`, access);
        if (profile) {
          me.dob = profile.dob ?? me.dob;
          me.gender = profile.gender ?? me.gender;
          me.cv = profile.cv ?? me.cv;
          me.cv_filename = profile.cv_filename ?? me.cv_filename;
        }
      } catch (e) {
        // ignore
      }
      const fullNameR = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
      const u: User = {
        id: String(me.id),
        email: me.email,
        username: me.username,
        first_name: me.first_name,
        last_name: me.last_name,
        role: me.role ? String(me.role).toLowerCase() as any : undefined,
        name: fullNameR || undefined,
        avatar: me.avatar || undefined,
        phone: me.phone,
        gender: me.gender,
        dob: me.dob,
        status: me.status?.toUpperCase(),
        cv: me.cv || undefined,
        cv_filename: me.cv_filename || undefined,
      };

      saveUserAndTokens(u, { access, refresh });

      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  // Set global logout handler for lib/jobfinder.ts on mount
  useEffect(() => {
    setGlobalLogout(logout);
  }, []);

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const tok = localStorage.getItem(TOKEN_KEY);
      if (!tok) throw new Error('Not authenticated');

      // Helper to make authenticated requests with auto-refresh
      const authRequest = async (url: string, options: RequestInit) => {
        const res = await authFetch(url, options, logout);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw { status: res.status, data: errData };
        }
        return res.json().catch(() => ({}));
      };

      // update user basic fields via /api/users/me/
      const body: any = {};
      if (data.first_name !== undefined) body.first_name = data.first_name;
      if (data.last_name !== undefined) body.last_name = data.last_name;
      if (data.email !== undefined) body.email = data.email;
      if (data.phone !== undefined) body.phone = data.phone;

      if (Object.keys(body).length > 0) {
        await authRequest(`${API_BASE}/api/users/me/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      // update profile (dob/gender) via profiles/me/
      const profileBody: any = {};
      if (data.dob !== undefined) profileBody.dob = data.dob;
      if (data.gender !== undefined) {
        // frontend should provide backend gender code (e.g. 'MALE') — pass through
        profileBody.gender = data.gender as any;
      }
      if (Object.keys(profileBody).length > 0) {
        await authRequest(`${API_BASE}/api/users/profiles/me/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileBody),
        });
      }

      // refresh local user and merge profile - get fresh token from storage (may have been refreshed)
      const freshTok = localStorage.getItem(TOKEN_KEY);
      const freshAccess = freshTok ? JSON.parse(freshTok).access : null;
      
      const me = await getJSON(`${API_BASE}/api/users/me/`, freshAccess);
      try {
        const profile = await getJSON(`${API_BASE}/api/users/profiles/me/`, freshAccess);
        if (profile) {
          me.dob = profile.dob ?? me.dob;
          me.gender = profile.gender ?? me.gender;
          me.cv = profile.cv ?? me.cv;
          me.cv_filename = profile.cv_filename ?? me.cv_filename;
        }
      } catch (e) {
        // ignore
      }
      const fullNameU = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
      const u: User = {
        id: String(me.id),
        email: me.email,
        username: me.username,
        first_name: me.first_name,
        last_name: me.last_name,
        role: me.role ? String(me.role).toLowerCase() as any : undefined,
        name: fullNameU || undefined,
        avatar: me.avatar || undefined,
        phone: me.phone,
        gender: me.gender,
        dob: me.dob,
        status: me.status?.toUpperCase(),
        cv: me.cv || undefined,
        cv_filename: me.cv_filename || undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
      return true;
    } catch (err) {
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const freshTok = localStorage.getItem(TOKEN_KEY);
      const freshAccess = freshTok ? JSON.parse(freshTok).access : null;
      if (!freshAccess) return;
      
      const me = await getJSON(`${API_BASE}/api/users/me/`, freshAccess);
      try {
        const profile = await getJSON(`${API_BASE}/api/users/profiles/me/`, freshAccess);
        if (profile) {
          me.dob = profile.dob ?? me.dob;
          me.gender = profile.gender ?? me.gender;
          me.cv = profile.cv ?? me.cv;
          me.cv_filename = profile.cv_filename ?? me.cv_filename;
        }
      } catch (e) {
        // ignore
      }
      const fullNameR = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
      const u: User = {
        id: String(me.id),
        email: me.email,
        username: me.username,
        first_name: me.first_name,
        last_name: me.last_name,
        role: me.role ? String(me.role).toLowerCase() as any : undefined,
        name: fullNameR || undefined,
        avatar: me.avatar || undefined,
        phone: me.phone,
        gender: me.gender,
        dob: me.dob,
        status: me.status?.toUpperCase(),
        cv: me.cv || undefined,
        cv_filename: me.cv_filename || undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
    } catch (err: any) {
      // Nếu 401 Unauthorized → token không hợp lệ, logout
      if (err?.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
      // ignore other errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        isAuthenticated: !!user,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
