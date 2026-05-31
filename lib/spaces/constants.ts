export const SPACE_PREVIEW_KIND = 'static_html' as const;

export const MAX_SPACE_FILE_BYTES = 512_000;

export const MAX_SPACE_FILES = 50;

export const ALLOWED_SPACE_PATH = /^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/;

export const DEFAULT_SPACE_FILES: Array<{ path: string; content: string; mime_type: string }> = [
  {
    path: 'index.html',
    mime_type: 'text/html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Space</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="container">
    <h1>Your Space</h1>
    <p>Ask the agent to build a landing page, dashboard, or simple app.</p>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    path: 'styles.css',
    mime_type: 'text/css',
    content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  min-height: 100vh;
}
.container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  text-align: center;
}
h1 { font-size: 2.25rem; margin-bottom: 1rem; }
p { color: #94a3b8; line-height: 1.6; }`,
  },
  {
    path: 'script.js',
    mime_type: 'text/javascript',
    content: `// Agent-generated interactions go here`,
  },
];
