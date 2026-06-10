'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterCreateOrganizationUrl="/"
      afterLeaveOrganizationUrl="/"
      afterSelectOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: 'w-full',
          organizationSwitcherTrigger:
            'w-full justify-between rounded-lg border bg-background px-2 py-1.5 text-sm',
        },
      }}
    />
  );
}
