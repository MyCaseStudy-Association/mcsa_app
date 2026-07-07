import { AuthApiError } from '@/lib/auth-api';

export function getSubmitErrorMessage(error: unknown, apiBaseUrl: string) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return `Unable to reach the auth server at ${apiBaseUrl}.`;
}
