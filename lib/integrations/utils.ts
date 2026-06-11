import type { Account, App } from '@pipedream/sdk/browser';

export function getAppSlug(
  app: Partial<App> & { name_slug?: string },
): string {
  return app.name_slug ?? app.nameSlug ?? '';
}

export function getAccountAppSlug(account: Account): string {
  if (!account.app) return '';
  return getAppSlug(account.app as App & { name_slug?: string });
}

export function countAccountsBySlug(accounts: Account[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const account of accounts) {
    const slug = getAccountAppSlug(account);
    if (slug) {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }
  return counts;
}

export function filterAccountsBySlug(
  accounts: Account[],
  slug: string,
): Account[] {
  return accounts.filter((account) => getAccountAppSlug(account) === slug);
}

export function appLogoUrl(app: Partial<App> & { id?: string }): string {
  if (app.imgSrc) return app.imgSrc;
  if (app.id) return `https://pipedream.com/s.v0/${app.id}/logo/48`;
  return '';
}
