import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { requireMasterAdmin } from '@/lib/tenant/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-8 space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

async function AdminDashboard() {
  await connection();
  await requireMasterAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold mb-4">Admin</h1>
        <p className="text-muted-foreground">
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY to enable the admin dashboard.
        </p>
      </div>
    );
  }

  const supabase = getSupabaseAdminClient();

  const [
    usersCount,
    orgsCount,
    recentUsers,
    recentUsage,
    recentAudit,
  ] = await Promise.all([
    supabase.from('app_users').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase
      .from('app_users')
      .select('email, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('usage_events')
      .select('event_type, model, input_tokens, output_tokens, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('audit_logs')
      .select('action, target_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AgentOps Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Master admin overview — tenant-safe server-side access only.
          </p>
        </div>
        <Link href="/" className="text-sm underline">
          Back to chat
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Users" value={usersCount.count ?? 0} />
        <StatCard label="Organizations" value={orgsCount.count ?? 0} />
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">Recent signups</h2>
        <DataTable
          headers={['Email', 'Name', 'Role', 'Joined']}
          rows={(recentUsers.data ?? []).map((u) => [
            u.email,
            u.full_name ?? '—',
            u.role,
            new Date(u.created_at).toLocaleString(),
          ])}
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Recent usage events</h2>
        <DataTable
          headers={['Event', 'Model', 'Tokens in/out', 'When']}
          rows={(recentUsage.data ?? []).map((e) => [
            e.event_type,
            e.model ?? '—',
            `${e.input_tokens}/${e.output_tokens}`,
            new Date(e.created_at).toLocaleString(),
          ])}
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Recent audit logs</h2>
        <DataTable
          headers={['Action', 'Target', 'When']}
          rows={(recentAudit.data ?? []).map((a) => [
            a.action,
            a.target_type ?? '—',
            new Date(a.created_at).toLocaleString(),
          ])}
        />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-4 text-muted-foreground"
              >
                No records yet.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
