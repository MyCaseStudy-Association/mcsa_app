import Constants from 'expo-constants';
import { fetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'mcsa.access-token';
const REFRESH_TOKEN_KEY = 'mcsa.refresh-token';
const USER_KEY = 'mcsa.user';
const DEFAULT_API_PORT = '6000';
const DEFAULT_WEB_API_PORT = '6001';

type JsonRecord = Record<string, unknown>;

export type AuthUser = {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = AuthTokens & {
  user?: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
};

type RequestOptions = {
  accessToken?: string;
  body?: unknown;
  method?: 'GET' | 'POST';
};

type ApiResponse<T> = {
  data: T;
  ok: boolean;
  status: number;
};

export class AuthApiError extends Error {
  code?: string;
  details?: unknown;
  status: number;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const AUTH_API_BASE_URL = getApiBaseUrl();

export async function login(payload: LoginPayload) {
  const response = await apiRequest<unknown>('/auth/login', {
    method: 'POST',
    body: payload,
  });
  const session = normalizeAuthSession(response);
  await saveAuthSession(session);
  return session;
}

export async function register(payload: RegisterPayload) {
  const response = await apiRequest<unknown>('/auth/register', {
    method: 'POST',
    body: payload,
  });
  const session = normalizeAuthSession(response);
  await saveAuthSession(session);
  return session;
}

export async function getCurrentUser(accessToken?: string) {
  const token = accessToken ?? (await getStoredAccessToken());

  if (!token) {
    return null;
  }

  const response = await apiRequest<unknown>('/auth/me', {
    accessToken: token,
    method: 'GET',
  });

  return normalizeUser(response);
}

export async function refreshAuthSession(refreshToken?: string) {
  const token = refreshToken ?? (await getStoredRefreshToken());

  if (!token) {
    throw new AuthApiError('No refresh token is available.', 401, 'NO_REFRESH_TOKEN');
  }

  const response = await apiRequest<unknown>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: token },
  });
  const session = normalizeAuthSession(response, token);
  await saveAuthSession(session);
  return session;
}

export async function logout(refreshToken?: string) {
  const token = refreshToken ?? (await getStoredRefreshToken());

  try {
    if (token) {
      await apiRequest<unknown>('/auth/logout', {
        method: 'POST',
        body: { refreshToken: token },
      });
    }
  } finally {
    await clearAuthSession();
  }
}

export async function getStoredAuthSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken, userJson] = await Promise.all([
    getStoredAccessToken(),
    getStoredRefreshToken(),
    readStorage(USER_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user: parseStoredUser(userJson),
  };
}

export async function saveAuthSession(session: AuthSession) {
  await Promise.all([
    writeStorage(ACCESS_TOKEN_KEY, session.accessToken),
    writeStorage(REFRESH_TOKEN_KEY, session.refreshToken),
    session.user ? writeStorage(USER_KEY, JSON.stringify(session.user)) : deleteStorage(USER_KEY),
  ]);
}

export async function clearAuthSession() {
  await Promise.all([
    deleteStorage(ACCESS_TOKEN_KEY),
    deleteStorage(REFRESH_TOKEN_KEY),
    deleteStorage(USER_KEY),
  ]);
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchRequest<T>(path, options);

  if (!response.ok) {
    throw createApiError(response.status, response.data);
  }

  return response.data;
}

async function fetchRequest<T>(path: string, options: RequestOptions): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const url = buildApiUrl(path);
  const response = await fetch(url, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    method: options.method ?? 'GET',
  }).catch((error: unknown) => {
    throw new AuthApiError(`Unable to reach the auth server at ${AUTH_API_BASE_URL}.`, 0, 'NETWORK_ERROR', error);
  });
  const data = await parseResponseBody(response);

  return {
    data: data as T,
    ok: response.ok,
    status: response.status,
  };
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  return parseResponseText(text);
}

function parseResponseText(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function createApiError(status: number, data: unknown) {
  const message = findString(data, ['message', 'error']) ?? `Request failed with status ${status}.`;
  const code = findString(data, ['code']);
  return new AuthApiError(message, status, code ?? undefined, data);
}

function normalizeAuthSession(data: unknown, fallbackRefreshToken?: string): AuthSession {
  const candidates = flattenCandidates(data);
  const accessToken = findFirstString(candidates, ['accessToken', 'access_token', 'token']);
  const refreshToken =
    findFirstString(candidates, ['refreshToken', 'refresh_token']) ?? fallbackRefreshToken;
  const user = normalizeUser(data) ?? undefined;

  if (!accessToken || !refreshToken) {
    throw new AuthApiError(
      'The auth server did not return the expected access and refresh tokens.',
      500,
      'INVALID_AUTH_RESPONSE',
      data
    );
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

function normalizeUser(data: unknown): AuthUser | null {
  if (!isRecord(data)) {
    return null;
  }

  if (isRecord(data.user)) {
    return data.user as AuthUser;
  }

  if (isRecord(data.data)) {
    if (isRecord(data.data.user)) {
      return data.data.user as AuthUser;
    }

    if (looksLikeUser(data.data)) {
      return data.data as AuthUser;
    }
  }

  if (looksLikeUser(data)) {
    return data as AuthUser;
  }

  return null;
}

function looksLikeUser(value: JsonRecord) {
  return typeof value.email === 'string' || typeof value.name === 'string' || value.id != null;
}

function flattenCandidates(data: unknown): JsonRecord[] {
  if (!isRecord(data)) {
    return [];
  }

  const candidates = [data];

  for (const key of ['data', 'tokens', 'auth', 'session']) {
    const value = data[key];

    if (isRecord(value)) {
      candidates.push(value);
    }
  }

  if (isRecord(data.data)) {
    for (const key of ['tokens', 'auth', 'session']) {
      const value = data.data[key];

      if (isRecord(value)) {
        candidates.push(value);
      }
    }
  }

  return candidates;
}

function findFirstString(candidates: JsonRecord[], keys: string[]) {
  for (const candidate of candidates) {
    const value = findString(candidate, keys);

    if (value) {
      return value;
    }
  }

  return null;
}

function findString(data: unknown, keys: string[]) {
  if (!isRecord(data)) {
    return null;
  }

  for (const key of keys) {
    const value = data[key];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

function parseStoredUser(userJson: string | null) {
  if (!userJson) {
    return undefined;
  }

  try {
    const user = JSON.parse(userJson) as unknown;
    return normalizeUser(user) ?? undefined;
  } catch {
    return undefined;
  }
}

async function getStoredAccessToken() {
  return readStorage(ACCESS_TOKEN_KEY);
}

async function getStoredRefreshToken() {
  return readStorage(REFRESH_TOKEN_KEY);
}

async function readStorage(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }

  return SecureStore.getItemAsync(key);
}

async function writeStorage(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
  }
}

async function deleteStorage(key: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(key);
  }
}

function getWebStorage() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage;
}

function buildApiUrl(path: string) {
  return `${AUTH_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_WEB_API_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${DEFAULT_API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

function trimTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
