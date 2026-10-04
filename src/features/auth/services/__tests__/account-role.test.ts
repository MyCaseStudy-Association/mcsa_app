import { isContributorRole } from '../account-role';

describe('mobile account role', () => {
  it('accepts only contributors', () => {
    expect(isContributorRole('user')).toBe(true);
  });
  it.each(['buyer', 'admin', undefined, null, '', 'USER'])('rejects %s', (role) => {
    expect(isContributorRole(role)).toBe(false);
  });
});
