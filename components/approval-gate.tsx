'use client';

import { UseChatHelpers } from '@ai-sdk/react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ApprovalGateProps = {
  toolName: string;
  message?: string;
  append: UseChatHelpers['append'];
  onDismiss?: () => void;
};

export function ApprovalGate({
  toolName,
  message,
  append,
  onDismiss,
}: ApprovalGateProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
        <AlertTriangle className="size-4" />
        Approval required
      </div>
      <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
        {message ??
          `The agent wants to run "${toolName}" which may change external systems.`}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            append({
              role: 'user',
              content: 'Approved. Proceed with the action.',
            });
            onDismiss?.();
          }}
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            append({
              role: 'user',
              content: 'Cancel. Do not run that action.',
            });
            onDismiss?.();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
