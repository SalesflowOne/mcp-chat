'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConnectorsHub } from '@/components/connectors-hub';
import { PlaybooksGrid } from '@/components/playbooks-grid';
import { Button } from '@/components/ui/button';
import { OPERATOR_PLAYBOOKS } from '@/lib/playbooks';

const ONBOARDING_STEPS = ['Connect', 'First task'] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);

  const finish = () => {
    toast.success('You are ready to run AgentOps');
    router.push('/');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Step {step + 1} of {ONBOARDING_STEPS.length}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {step === 0 ? 'Connect your stack' : 'Pick your first playbook'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {step === 0
            ? 'Link the tools your business runs on. You can always add more later.'
            : 'Start with a proven operator workflow — or skip to chat.'}
        </p>
      </div>

      {step === 0 ? (
        <ConnectorsHub
          compact
          onConnected={() => setConnectedCount((c) => c + 1)}
        />
      ) : (
        <PlaybooksGrid
          playbooks={OPERATOR_PLAYBOOKS.filter((p) => p.category !== 'build').slice(0, 6)}
          onSelect={() => finish()}
        />
      )}

      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep(0)}
        >
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={finish}>
            Skip for now
          </Button>
          {step === 0 ? (
            <Button type="button" onClick={() => setStep(1)}>
              {connectedCount > 0 ? 'Continue' : 'Continue without connecting'}
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              Open AgentOps
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
