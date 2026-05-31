import type { AuthResponse, User, TestSession, StatsData, LeaderboardEntry, TrainingStatus, TestMode } from '@/../shared/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const json = await response.json();
  return (json.data ?? json) as T;
}

export const authApi = {
  register: (data: { email: string; password: string; nickname: string; region: string; ageGroup: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () =>
    apiFetch<{ user: User }>('/auth/me'),
};

export const testApi = {
  submitTest: (data: { mode: TestMode; rounds: { reactionTime: number | null; isFoul: boolean; stimulusDetail?: string }[] }) =>
    apiFetch<Partial<TestSession>>('/tests', { method: 'POST', body: JSON.stringify(data) }),

  getHistory: (params?: { mode?: TestMode; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return apiFetch<{ records: TestSession[]; total: number }>(`/tests/history${qs ? `?${qs}` : ''}`);
  },

  getStats: (mode: TestMode) =>
    apiFetch<StatsData>(`/tests/stats?mode=${mode}`),
};

export const leaderboardApi = {
  getLeaderboard: (params?: { mode?: TestMode; ageGroup?: string; region?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.ageGroup) query.set('ageGroup', params.ageGroup);
    if (params?.region) query.set('region', params.region);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiFetch<{ rankings: LeaderboardEntry[] }>(`/leaderboard${qs ? `?${qs}` : ''}`);
  },
};

export const trainingApi = {
  getTrainingStatus: () =>
    apiFetch<{ trainingStatus: TrainingStatus[]; achievements: string[]; dailyChallenge: { mode: TestMode; targetTime: number; completed: boolean } }>('/training/status'),

  completeTrainingRound: (data: { mode: TestMode; level: number; results: { reactionTime: number | null; isFoul: boolean }[] }) =>
    apiFetch<{ passed: boolean; newLevel: number; achievements: string[] }>('/training/complete', { method: 'POST', body: JSON.stringify(data) }),
};

export const exportApi = {
  getExportUrl: (params?: { mode?: TestMode; startDate?: string; endDate?: string }): string => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return `${API_BASE}/export/csv${qs ? `?${qs}` : ''}`;
  },
};
