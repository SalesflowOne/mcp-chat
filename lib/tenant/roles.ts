export type OrgRole = "owner" | "admin" | "editor" | "viewer";

const ROLE_RANK: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function normalizeOrgRole(role: string | null | undefined): OrgRole {
  const r = (role ?? "viewer").toLowerCase();
  if (r === "owner" || r === "org:admin" || r === "admin") return r === "owner" ? "owner" : "admin";
  if (r === "editor" || r === "org:member" || r === "member") return "editor";
  return "viewer";
}

export function hasMinRole(
  userRole: string | null | undefined,
  required: OrgRole,
): boolean {
  const normalized = normalizeOrgRole(userRole);
  return ROLE_RANK[normalized] >= ROLE_RANK[required];
}

export function canManageConnectors(role: string | null | undefined): boolean {
  return hasMinRole(role, "editor");
}

export function canCreateSpaces(role: string | null | undefined): boolean {
  return hasMinRole(role, "editor");
}

export function canDeploySpaces(role: string | null | undefined): boolean {
  return hasMinRole(role, "admin");
}
