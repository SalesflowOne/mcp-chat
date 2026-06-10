import { SPACE_PREVIEW_KINDS } from '@/lib/spaces/runtime';

export const SPACE_PREVIEW_KIND = SPACE_PREVIEW_KINDS.static;

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

export const DEFAULT_VITE_REACT_FILES: Array<{
  path: string;
  content: string;
  mime_type: string;
}> = [
  {
    path: 'package.json',
    mime_type: 'application/json',
    content: JSON.stringify(
      {
        name: 'agentops-space',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^6.0.0',
        },
      },
      null,
      2,
    ),
  },
  {
    path: 'vite.config.js',
    mime_type: 'text/javascript',
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true },
})
`,
  },
  {
    path: 'index.html',
    mime_type: 'text/html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Space</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
  },
  {
    path: 'src/main.jsx',
    mime_type: 'text/javascript',
    content: `import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
  },
  {
    path: 'src/App.jsx',
    mime_type: 'text/javascript',
    content: `export default function App() {
  return (
    <main className="app">
      <h1>Your React Space</h1>
      <p>Ask the agent to build components here.</p>
    </main>
  )
}
`,
  },
  {
    path: 'src/index.css',
    mime_type: 'text/css',
    content: `* { box-sizing: border-box; margin: 0; }
body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; }
.app { max-width: 48rem; margin: 0 auto; padding: 4rem 1.5rem; text-align: center; }
h1 { font-size: 2rem; margin-bottom: 1rem; }
p { color: #94a3b8; }
`,
  },
];
