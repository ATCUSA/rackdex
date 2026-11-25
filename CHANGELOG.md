# Changelog

All notable changes to RackDex are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Deploy as a static-assets Cloudflare Worker (`wrangler.jsonc`).
- Friendly "Page not found" page for unknown URLs.
- RackDex logo, favicons (SVG/ICO/Apple/Android), web app manifest and social preview image.
- `robots.txt` and `sitemap.xml` so search engines can find the site.
- Daily workflow that rebuilds and deploys when the device type library changes.
- Link to the RackDex repo in the header (with its star count) and footer.
- `data/meta.json` with the library commit, date and counts, used by the README's "library synced" badge.
- CI and "library synced" badges in the README.
- `_headers` file: long-lived caching for hashed `_app/immutable` assets, plus basic security headers
  (`nosniff`, referrer policy, permissions policy, no framing).
- Content Security Policy on every page: scripts only from the site itself (SvelteKit's inline scripts and the
  theme script are allowed by hash), network and images limited to the site and GitHub, no plugins. An e2e test
  fails on any CSP violation.
- Sort results by best match, name, height or interface count (kept in the URL as `sort=`). With a query, close
  matches stay on top and loose fuzzy ones follow under an "Other matches" divider, so sorting by size doesn't bury
  the type you searched for.
- "New" and "Updated" badges on types that changed in the library since the site was built, with a note in the
  detail panel saying you're seeing the live version.
- "Interfaces by type" table in the detail panel: how many of each NetBox interface type, its speed, and how many
  are PoE sources or management-only. It's read from the YAML the panel already fetches, so the index doesn't grow.
- Cookieless Cloudflare Web Analytics on the hosted site, injected by Cloudflare at the edge. The CSP allows its
  beacon script and reporting endpoint, and the README's privacy section says what it does and doesn't collect.

### Changed

- Upgrade to SvelteKit 3 and adapter-static 4. Config moved from `svelte.config.js` into `vite.config.ts`, and `$lib`
  imports are now `#lib`.
- Update dependencies (SvelteKit 3.2, Vite 8.3.8, Playwright 1.65, Vitest 5.1, Tailwind 4.3.5, Lucide 1.73), which
  clears all `pnpm audit` advisories.
- README: refresh library size figures (16k+ types, 450+ vendors, ~8 MB index).
- The detail panel and selection drawer are now proper modal dialogs: they take focus when opened, keep Tab
  inside, and return focus to where you were when closed.
- `pnpm check` builds the index first if it's missing, so it works on a fresh clone.
- The daily refresh workflow reads the deployed commit from `meta.json` instead of the full index, and runs
  `pnpm check` before deploying.

- Pages are prerendered to real HTML (server rendering at build time) instead of an empty shell, so search engines
  and link previews see the content. Each page has its own title, description and canonical URL, and the home page
  has structured data (schema.org `WebApplication`) and an intro for crawlers and no-JS visitors.
- Header navigation (Search, About); the About page gains an FAQ.

### Fixed

- When the 15-minute update cache has expired and GitHub can't be reached or rate-limits you, RackDex keeps showing the
  last successfully fetched upstream changes instead of falling back to the older deployed data.
- PR preview builds on Cloudflare Workers Builds (added the `previews` block that `wrangler preview` requires).

## [0.1.0] - 2026-09-30

First public release.

### Added

- Fuzzy search across every device, module and rack type in the NetBox Device Type Library (~13,000 types), running
  in a Web Worker.
- Filters: kind, vendor, inferred category, rack units, interface count and speed, airflow, PoE (PSE),
  console/power ports, device/module bays and elevation images, with live counts.
- Detail panel with specs, component counts, front/rear elevation images and highlighted YAML.
- Copy and download YAML for NetBox import; multi-select with a combined multi-document export per kind.
- Manufacturer helper with exact name, slug and CSV for NetBox's manufacturer import.
- Live upstream updates from one GitHub compare call per visit (cached 15 minutes), with a graceful fallback.
- Shareable URLs for search, filters and the open panel.
- Dark theme by default, with a light toggle.
- About page and footer crediting the devicetype-library maintainers and contributors.
