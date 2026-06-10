import type { UIMessage } from 'ai';

export function userApprovedDestructiveActions(
  messages: Array<UIMessage>,
): boolean {
  const userMessages = messages.filter((m) => m.role === 'user');
  const last = userMessages[userMessages.length - 1];
  if (!last) return false;

  const text = last.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .toLowerCase();

  if (!text) return false;

  return /\b(approve|approved|proceed|go ahead|yes do it)\b/.test(text);
}
