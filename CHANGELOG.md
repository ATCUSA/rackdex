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
