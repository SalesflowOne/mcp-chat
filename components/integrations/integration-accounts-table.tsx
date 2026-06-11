'use client';

import type { Account } from '@pipedream/sdk/browser';
import { Pencil, Search, Trash2, Users } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteConnectedAccount } from '@/app/(chat)/accounts/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { appLogoUrl } from '@/lib/integrations/utils';

type IntegrationAccountsTableProps = {
  accounts: Account[];
  appName: string;
  appLogo?: string;
  addedByName: string;
};

export function IntegrationAccountsTable({
  accounts,
  appName,
  appLogo,
  addedByName,
}: IntegrationAccountsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [accountToView, setAccountToView] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      (a.name ?? '').toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const handleDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConnectedAccount(accountToDelete);
      router.refresh();
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search connected accounts"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {accounts.length} account{accounts.length === 1 ? '' : 's'} connected
      </p>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Account label</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Access</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Added by</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No accounts match your search.
                </td>
              </tr>
            ) : (
              filtered.map((account) => (
                <tr key={account.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          account.healthy !== false ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-medium">
                        {account.name || `${appName} account`}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      Team-only
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {addedByName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">{addedByName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2"
                        onClick={() => setAccountToView(account)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => account.id && setAccountToDelete(account.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!accountToView} onOpenChange={(open) => !open && setAccountToView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account details</DialogTitle>
            <DialogDescription>
              Connected {appName} account
            </DialogDescription>
          </DialogHeader>
          {accountToView && (
            <div className="space-y-3 text-sm">
              {appLogo && (
                <div className="flex size-12 items-center justify-center rounded-lg border bg-white p-2">
                  <Image src={appLogo} alt="" width={32} height={32} className="size-8 object-contain" />
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Label</p>
                <p className="font-medium">{accountToView.name || 'Unnamed account'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {accountToView.healthy !== false ? 'Healthy' : 'Needs attention'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Connected</p>
                <p className="font-medium">
                  {accountToView.createdAt
                    ? new Date(accountToView.createdAt).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (accountToView.id) {
                      setAccountToView(null);
                      setAccountToDelete(accountToView.id);
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect account</AlertDialogTitle>
            <AlertDialogDescription>
              AgentOps will no longer be able to use this {appName} account. You can reconnect
              anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Disconnecting…' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
