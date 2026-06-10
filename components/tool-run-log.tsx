'use client';

import type { UIMessage } from 'ai';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { useMemo } from 'react';

import { prettifyToolName } from '@/lib/utils';

type ToolRun = {
  id: string;
  name: string;
  state: 'call' | 'result' | 'error';
  requiresApproval?: boolean;
};

function extractToolRuns(messages: UIMessage[]): ToolRun[] {
  const runs: ToolRun[] = [];

  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    for (const part of message.parts ?? []) {
      if (part.type !== 'tool-invocation') continue;
      const { toolInvocation } = part;
      const result = toolInvocation.state === 'result' ? toolInvocation.result : null;
      const requiresApproval =
        result &&
        typeof result === 'object' &&
        'requiresApproval' in result &&
        (result as { requiresApproval: boolean }).requiresApproval;

      runs.push({
        id: toolInvocation.toolCallId,
        name: toolInvocation.toolName,
        state: toolInvocation.state === 'result' ? 'result' : 'call',
        requiresApproval: Boolean(requiresApproval),
      });
    }
  }

  return runs;
}

export function ToolRunLog({
  messages,
  isStreaming,
}: {
  messages: UIMessage[];
  isStreaming: boolean;
}) {
  const runs = useMemo(() => extractToolRuns(messages), [messages]);

  if (runs.length === 0) return null;

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tool activity
      </p>
      <ul className="flex flex-wrap gap-2">
        {runs.map((run) => (
          <li
            key={run.id}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"
          >
            {run.state === 'call' && isStreaming ? (
              <Loader2 className="size-3 animate-spin text-indigo-500" />
            ) : run.requiresApproval ? (
              <XCircle className="size-3 text-amber-500" />
            ) : run.state === 'result' ? (
              <CheckCircle2 className="size-3 text-green-500" />
            ) : (
              <Circle className="size-3 text-muted-foreground" />
            )}
            <span>{prettifyToolName(run.name, run.id)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
