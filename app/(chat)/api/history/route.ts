import { getChatsByUserId } from '@/lib/db/queries';
import { getEffectiveSession } from '@/lib/auth-utils';
import { resolvePersistTenant } from '@/lib/tenant/persist';

export async function GET() {
  const session = await getEffectiveSession();

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const tenant = await resolvePersistTenant();
  if (!tenant) {
    return Response.json([]);
  }

  try {
    const chats = await getChatsByUserId({
      id: tenant.appUser.id,
      organizationId: tenant.organizationId,
    });
    return Response.json(chats);
  } catch (error) {
    console.error('Failed to load chat history', error);
    return Response.json([]);
  }
}
