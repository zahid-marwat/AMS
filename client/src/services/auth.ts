import { jwtDecode } from 'jwt-decode';
import { api } from './api';
import type { AuthUser } from '@/types';

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

type JwtPayload = {
  exp: number;
  sub: string;
};

const ACCESS_TOKEN_KEY = 'ams:accessToken';
const USER_KEY = 'ams:user';

function persistSession({ accessToken, user }: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function readCachedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch (error) {
    console.warn('Unable to parse cached user, clearing session', error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const nowSeconds = Date.now() / 1000;
    return decoded.exp > nowSeconds;
  } catch (error) {
    console.warn('Failed to decode JWT', error);
    return false;
  }
}

async function refreshAccessToken() {
  const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  return data.accessToken;
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    persistSession(data);
    return data.user;
  },

  logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const cachedUser = readCachedUser();
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (cachedUser && isTokenValid(accessToken)) {
      return cachedUser;
    }

    if (!accessToken) {
      return null;
    }

    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      if (accessToken) {
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      }
      return data;
    } catch (error) {
      if (accessToken && !isTokenValid(accessToken)) {
        try {
          await refreshAccessToken();
          const { data } = await api.get<AuthUser>('/auth/me');
          localStorage.setItem(USER_KEY, JSON.stringify(data));
          return data;
        } catch (refreshError) {
          console.warn('Session refresh failed', refreshError);
          authService.logout();
        }
      }
      return null;
    }
  },
};
