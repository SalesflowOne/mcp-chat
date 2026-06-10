export const isProductionEnvironment = process.env.NODE_ENV === "production";

export const isAuthDisabled = process.env.DISABLE_AUTH === "true";
export const isPersistenceDisabled = process.env.DISABLE_PERSISTENCE === "true";
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const BANNER_THEMES = {
  warning: {
    container:
      "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
  },
  info: {
    container:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    icon: "text-blue-600 dark:text-blue-400",
  },
} as const;

export const APP_NAME = "AgentOps";
export const APP_TAGLINE = "Run your entire stack from one agent";
export const APP_DESCRIPTION =
  "AgentOps helps operators and business owners connect their tools, automate workflows, and ship websites — powered by Pipedream Connect.";

export const BASE_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://agentops.one";
export const BASE_TITLE = `${APP_NAME} — Operator OS`;
export const BASE_DESCRIPTION = APP_DESCRIPTION;

export const BASE_METADATA = {
  metadataBase: new URL(BASE_SITE_URL),
  title: BASE_TITLE,
  description: BASE_DESCRIPTION,
  openGraph: {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    url: BASE_SITE_URL,
    siteName: APP_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    images: [
      {
        url: "/twitter-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
};

/** Curated connector slugs for onboarding and quick-connect */
export const STARTER_CONNECTOR_SLUGS = [
  "slack",
  "stripe",
  "notion",
  "google_calendar",
  "gmail",
  "github",
  "hubspot",
  "pipedrive",
  "airtable",
  "google_sheets",
] as const;
