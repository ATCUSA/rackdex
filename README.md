# NetBox Device Type Finder

Fast, unofficial search for the
[netbox-community/devicetype-library](https://github.com/netbox-community/devicetype-library):
fuzzy search, vendor/category/spec filters, and one-click YAML for NetBox import
(single or combined), plus manufacturer name/slug/CSV helpers.

All definitions are the work of the library's maintainers and
[contributors](https://github.com/netbox-community/devicetype-library/graphs/contributors) (CC0-1.0).

## Run locally

```bash
pnpm install
pnpm dev        # builds the index on first run, then http://localhost:5173
pnpm index      # refresh the index from upstream master
```

`DTL_REF=<branch-or-sha> pnpm index` indexes a different ref. The library checkout is cached in `.cache/`.

## Deploy to Cloudflare Pages

- Framework preset: none
- Build command: `pnpm build`
- Build output directory: `build`
- Environment variables: `NODE_VERSION=22` (or newer) and `PNPM_VERSION=11.17.0` —
  Cloudflare Pages may not honour `packageManager` in `package.json`, and this repo
  requires pnpm 11 (lockfile v9, `allowBuilds` in `pnpm-workspace.yaml`).

No scheduled rebuilds are needed: the browser applies upstream changes live via one GitHub compare API call.
Redeploy occasionally to refresh the baseline (the header badge shows "Data from …" when a rebuild is recommended).

Note: the first real Cloudflare Pages deploy should be checked by hand to confirm the
pinned pnpm version is actually picked up.

## Develop

```bash
pnpm test       # unit tests (Vitest)
pnpm check      # svelte-check
pnpm test:e2e   # Playwright (requires static/data/index.json)
```

Design: `docs/superpowers/specs/2026-09-29-devicetype-finder-design.md`.
