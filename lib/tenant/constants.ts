export const MASTER_ADMIN_EMAIL = 'ceo@salesflow.one';

export const ACTIVE_ORG_COOKIE = 'agentops_active_org_id';

export const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];
