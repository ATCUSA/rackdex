<div align="center">

# 🗄️ RackDex

**Gotta rack 'em all.**

A fast search engine for the
[NetBox Device Type Library](https://github.com/netbox-community/devicetype-library).
Find any switch, router, PDU, patch panel, line card or rack, then copy import-ready YAML into NetBox in one click.

`~13,000 types` · `fuzzy search` · `live upstream data` · `zero backend`

</div>

---

## Why

The devicetype-library is the best source of NetBox hardware definitions, but in practice using it means scrolling
through 10,000+ files on GitHub, hunting for the right part number, opening the raw file and hoping you copied the
manufacturer name exactly right. RackDex turns that into typing `c9300 48p` and pressing **Copy**.

## Features

| | |
|---|---|
| 🔎 **Fuzzy search** | Search by model, part number, vendor or slug. It tolerates typos, and multi-word queries (`juniper ex4300 48`) match all words. Press `/` to focus. |
| 🎛️ **Real filters** | Filter by vendor, kind (device / module / rack), inferred category, U height, interface count and speed (1G → 800G), airflow, PoE (PSE), console and power ports, bays, and whether a type has elevation images. Counts update as you filter. |
| 📋 **One-click YAML** | Copy or download the exact upstream file, then paste it into *Devices → Device Types → Import*. |
| 🧺 **Bulk import** | Add types to a selection and export them as one multi-document YAML per kind (device, module and rack types import on different NetBox pages). |
| 🏭 **Manufacturer helper** | NetBox matches manufacturers by **name**, so RackDex gives you the exact name, the slug and a ready-to-paste CSV for *Manufacturers → Import*. |
| 🖼️ **Elevation images** | Front and rear rack images, straight from the library. |
| 📡 **Live data, no CI** | Each visit makes one GitHub API call to see what changed upstream since the site was built, and applies it in your browser. |
| 🔗 **Shareable links** | Every search, filter and open panel is saved in the URL. |
| 🌙 **Dark by default** | With a light mode for the brave. |

## How it works

```
 build time                                  in your browser
┌───────────────────────────────┐ index.json ┌──────────────────────────────────┐
│ sparse-clone YAML only (60 MB)│ ─────────▶ │ Web Worker: Fuse.js + filters    │
│ parse 13k types → 6 MB index  │            │ 1 GitHub compare call → live Δ   │
│ skips 900 MB of images        │            │ YAML + images fetched from GitHub│
└───────────────────────────────┘            └──────────────────────────────────┘
```

- **SvelteKit + Svelte 5** static site, **Tailwind v4**, **Lucide** icons
- Search runs in a **Web Worker**, so typing stays smooth over ~13k records
- The **live delta** is cached for 15 minutes in IndexedDB. If GitHub rate-limits the check, RackDex quietly uses the deployed data and shows a "rebuild recommended" badge.
- No per-type pages or copied files: the whole deploy is about **21 files**, well under Cloudflare Pages' limits

> Categories (switch, PDU, patch panel, …) are **inferred** from each type's components, because the library doesn't define them. Treat them as a helpful hint rather than an authoritative label.

## Quick start

```bash
pnpm install
pnpm dev          # first run builds the index, then http://localhost:5173
```

| Command | What it does |
|---|---|
| `pnpm index` | Refresh the index from upstream `master` (`DTL_REF=<branch-or-sha>` for another ref) |
| `pnpm build` | Index, then build the static site into `build/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm check` | Type check (svelte-check) |
| `pnpm test:e2e` | Browser tests (Playwright; needs `static/data/index.json`) |

Requires Node 22+ and pnpm 11. The library checkout is cached in `.cache/`.

## Deploy to Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm build` |
| Output directory | `build` |
| Environment variables | `NODE_VERSION=22`, `PNPM_VERSION=11.17.0` |

You don't need scheduled rebuilds, because the browser applies upstream changes live. Redeploy now and then to refresh
the baseline. Check the first deploy by hand to confirm Pages picked up the pinned pnpm version.

## Credits

RackDex is only a search interface. **Every definition in it is the work of the maintainers and
[contributors](https://github.com/netbox-community/devicetype-library/graphs/contributors) of the
[netbox-community/devicetype-library](https://github.com/netbox-community/devicetype-library)**, released under
[CC0-1.0](https://github.com/netbox-community/devicetype-library/blob/master/LICENSE.txt). If a type is missing or wrong,
please [contribute upstream](https://github.com/netbox-community/devicetype-library/blob/master/CONTRIBUTING.md), where it
helps everyone.

RackDex is an unofficial community tool and is not affiliated with or endorsed by NetBox Labs. NetBox is a trademark of
NetBox Labs.

---

<sub>Design notes live in <code>docs/superpowers/specs/</code>.</sub>
