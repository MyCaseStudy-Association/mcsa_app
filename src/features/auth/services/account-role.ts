/** Mobile is a contributor client. Missing roles fail closed until /auth/me verifies the account. */
export function isContributorRole(role: unknown): role is 'user' {
  return role === 'user';
}
