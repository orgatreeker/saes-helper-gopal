# Financial Audit Tool

Production-ready React + Vite app for internal client-call financial audits.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Netlify deploy (ZIP upload)

1. Build locally first (`npm install && npm run build`) and confirm `dist/` is generated.
2. Zip the full project root **including**:
   - `package.json`
   - `index.html`
   - `src/`
   - `netlify.toml`
3. In Netlify, either:
   - drag-and-drop the `dist/` folder for static upload, **or**
   - connect/upload the source and use build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

## Important checks before Netlify upload

- Do not upload only a single component file (for example only `App.jsx`).
- Ensure `publish` is set to `dist`.
- Keep SPA redirect in `netlify.toml` so all routes resolve to `index.html`.
