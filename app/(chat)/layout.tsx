import { cookies } from 'next/headers';
import { Suspense } from 'react';
import Script from 'next/script';

import { AppSidebar } from '@/components/app-sidebar';
import { ActiveSpaceProvider } from '@/hooks/use-active-space';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SessionProvider } from '@/components/session-provider';
import { SignedOutHeader } from '@/components/signed-out-header';
import { isAuthDisabled, isPersistenceDisabled } from '@/lib/constants';
import { getEffectiveSession } from '@/lib/auth-utils';
import { createGuestSession } from '@/lib/utils';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <Suspense fallback={<div className="flex h-dvh w-full" />}>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </>
  );
}

async function LayoutContent({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const session = await getEffectiveSession();
  const guestSession = isAuthDisabled ? createGuestSession() : undefined;
  const isSignedIn = !!session?.user;

  return (
    <SessionProvider
      isAuthDisabled={isAuthDisabled}
      isPersistenceDisabled={isPersistenceDisabled}
      guestSession={guestSession}
      serverSession={session}
    >
      <ActiveSpaceProvider>
      <SidebarProvider defaultOpen={!isCollapsed}>
        {isSignedIn ? (
          <>
            <AppSidebar user={session!.user} />
            <SidebarInset>{children}</SidebarInset>
          </>
        ) : (
          <div className="flex flex-col h-dvh w-full overflow-hidden">
            <SignedOutHeader />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        )}
      </SidebarProvider>
      </ActiveSpaceProvider>
    </SessionProvider>
  );
}
