export type Playbook = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  connectors: string[];
  category: "revenue" | "ops" | "comms" | "product" | "build";
};

export const OPERATOR_PLAYBOOKS: Playbook[] = [
  {
    id: "morning-briefing",
    title: "Morning briefing",
    description: "Calendar, Slack highlights, and revenue snapshot",
    prompt:
      "Give me a morning briefing: today's calendar events, important Slack messages from the last 24 hours, and yesterday's Stripe revenue summary.",
    connectors: ["google_calendar", "slack", "stripe"],
    category: "ops",
  },
  {
    id: "customer-health",
    title: "Customer health",
    description: "Recent customers and invoice status",
    prompt:
      "Tell me about my 10 most recent Stripe customers — who they are, their subscription status, and any overdue invoices.",
    connectors: ["stripe", "hubspot"],
    category: "revenue",
  },
  {
    id: "ship-changelog",
    title: "Ship changelog",
    description: "Summarize closed PRs into a release note",
    prompt:
      "Summarize the 10 most recently merged GitHub PRs and draft a product changelog I can paste into Notion.",
    connectors: ["github", "notion"],
    category: "product",
  },
  {
    id: "meeting-prep",
    title: "Meeting prep",
    description: "Attendees and context for your next meeting",
    prompt:
      "Help me prep for my next Google Calendar meeting — who is attending and what should I know about them?",
    connectors: ["google_calendar"],
    category: "ops",
  },
  {
    id: "pipeline-review",
    title: "Pipeline review",
    description: "Open deals and follow-ups in CRM",
    prompt:
      "Review my open Pipedrive deals — which need follow-up this week and what should I say?",
    connectors: ["pipedrive"],
    category: "revenue",
  },
  {
    id: "landing-page",
    title: "Build landing page",
    description: "Generate a polished site as a Space",
    prompt:
      "Create a modern landing page for my business with hero, features, pricing, and contact sections. Use a Space so I can preview it live.",
    connectors: [],
    category: "build",
  },
  {
    id: "weekly-report",
    title: "Weekly ops report",
    description: "Cross-tool summary for leadership",
    prompt:
      "Build a weekly ops report: key metrics from Stripe, support themes from Slack, and shipped work from GitHub.",
    connectors: ["stripe", "slack", "github"],
    category: "ops",
  },
  {
    id: "lead-followup",
    title: "Lead follow-up",
    description: "Draft outreach for stale CRM leads",
    prompt:
      "Find stale leads in HubSpot that haven't been contacted in 30 days and draft personalized follow-up emails.",
    connectors: ["hubspot", "gmail"],
    category: "revenue",
  },
];

export const PLAYBOOK_CATEGORIES: Record<Playbook["category"], string> = {
  revenue: "Revenue",
  ops: "Operations",
  comms: "Communications",
  product: "Product",
  build: "Build",
};
