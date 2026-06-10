/** Tool name substrings that require explicit user approval before execution */
export const DESTRUCTIVE_TOOL_PATTERNS = [
  'send',
  'delete',
  'remove',
  'post_message',
  'create_invoice',
  'charge',
  'refund',
  'publish',
  'deploy',
  'archive',
  'cancel',
  'terminate',
] as const;

export function isDestructiveTool(toolName: string): boolean {
  const lower = toolName.toLowerCase();
  return DESTRUCTIVE_TOOL_PATTERNS.some((p) => lower.includes(p));
}

export function approvalRequiredResult(toolName: string, args: unknown) {
  return {
    requiresApproval: true,
    toolName,
    args,
    message: `This action (${toolName}) may change external systems. Reply "approve" to proceed or "cancel" to skip.`,
  };
}
