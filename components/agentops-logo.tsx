import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AgentOpsLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4"
          aria-hidden
        >
          <path
            d="M12 3L4 8v8l8 5 8-5V8l-8-5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M12 12l8-5M12 12L4 7M12 12v10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
