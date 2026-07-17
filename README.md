# Home Front

A WW2 industrial idle game inspired by grand strategy war games. Build the British war economy: resources → production lines → equipment → divisions, wings and fleets → theatre victories.

Prototyped with Claude, developed with Claude Code. See CLAUDE.md for design and backlog.

## Develop

```
npm install
npm run dev      # local dev server at http://localhost:5173/
npm test         # run the unit + render tests (Vitest)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Deploy

Live site: https://dmoreland.github.io/Homefront/

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`): every push to `main` builds the app and publishes `dist/` to GitHub Pages. You can also trigger it manually from the Actions tab (workflow_dispatch).

**One-time repo setup** (Settings → Pages): set **Source** to **GitHub Actions**. The workflow handles the rest.

The production build serves from the `/Homefront/` base path (the repo name); local dev and preview stay at `/`. This is configured in `vite.config.js`.

## License

Released under the [MIT License](LICENSE.md).
