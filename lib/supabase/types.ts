export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppUserRow = {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_master_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  clerk_org_id: string | null;
  name: string;
  slug: string;
  owner_id?: string | null;
  created_by?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  clerk_user_id: string;
  clerk_org_id?: string | null;
  role: string;
  status?: string;
  created_at: string;
  updated_at?: string;
};

export type ChatThreadRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  title: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  organization_id: string;
  user_id: string | null;
  role: string;
  content: string | null;
  parts: Json;
  attachments: Json;
  metadata: Json;
  created_at: string;
};

export type UsageEventRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  event_type: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  metadata: Json;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  organization_id: string | null;
  actor_id?: string | null;
  user_id?: string | null;
  action: string;
  details?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  metadata: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      app_users: { Row: AppUserRow; Insert: Partial<AppUserRow> & Pick<AppUserRow, 'clerk_user_id' | 'email'>; Update: Partial<AppUserRow> };
      organizations: { Row: OrganizationRow; Insert: Partial<OrganizationRow> & Pick<OrganizationRow, 'name' | 'slug'>; Update: Partial<OrganizationRow> };
      organization_members: { Row: OrganizationMemberRow; Insert: Partial<OrganizationMemberRow> & Pick<OrganizationMemberRow, 'organization_id' | 'user_id' | 'clerk_user_id'>; Update: Partial<OrganizationMemberRow> };
      chat_threads: { Row: ChatThreadRow; Insert: Partial<ChatThreadRow> & Pick<ChatThreadRow, 'organization_id'>; Update: Partial<ChatThreadRow> };
      chat_messages: { Row: ChatMessageRow; Insert: Partial<ChatMessageRow> & Pick<ChatMessageRow, 'thread_id' | 'organization_id' | 'role'>; Update: Partial<ChatMessageRow> };
      connected_accounts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      usage_events: { Row: UsageEventRow; Insert: Partial<UsageEventRow> & Pick<UsageEventRow, 'organization_id' | 'event_type'>; Update: Partial<UsageEventRow> };
      audit_logs: { Row: AuditLogRow; Insert: Partial<AuditLogRow> & Pick<AuditLogRow, 'action'>; Update: Partial<AuditLogRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
