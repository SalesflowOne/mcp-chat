'use client';

import type { User } from '@/types/user';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutTemplate,
  MessageSquarePlus,
  Plug,
  Sparkles,
} from 'lucide-react';

import { AgentOpsLogo } from '@/components/agentops-logo';
import { OrgSwitcher } from '@/components/org-switcher';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
const NAV_ITEMS = [
  { href: '/connectors', label: 'Integrations', icon: Plug },
  { href: '/spaces', label: 'Spaces', icon: LayoutTemplate },
  { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
] as const;

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={() => setOpenMobile(false)}
            className="min-w-0"
          >
            <AgentOpsLogo />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              setOpenMobile(false);
              router.push('/');
              router.refresh();
            }}
            title="New chat"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
                  >
                    <Link href={href} onClick={() => setOpenMobile(false)}>
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Recent chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarHistory user={user} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border/60 p-3">
        <OrgSwitcher />
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
