import { redirect } from 'next/navigation';

export default async function SignInRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;
  const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  redirect(`/login${query}`);
}
