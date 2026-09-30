# Contributing to RackDex

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Ground rules

- Don't be a jerk.
- Don't do anything malicious or destructive: no malware, no sneaky code, no spam, no attacks on the site or its users.
- Follow the testing and pull request workflow below. Changes that skip it won't be merged.

That's it. Contributions or comments that break these rules get closed or removed.

## Where does my issue go?

| Problem | Where to report it |
|---|---|
| A device, module or rack type is **missing, wrong or outdated** | Upstream, at [netbox-community/devicetype-library](https://github.com/netbox-community/devicetype-library). RackDex only displays that data, and fixes there show up here automatically. |
| The **RackDex app** misbehaves (search, filters, copy/download, layout…) | An issue in this repo, using the *Bug report* template |
| An **idea** for RackDex | An issue in this repo, using the *Feature request* template |
| A **security** problem | Privately, as described in [SECURITY.md](SECURITY.md). Please don't open a public issue. |

## Development setup

You'll need **Node 22+** and **[pnpm](https://pnpm.io) 11**.

```bash
pnpm install
pnpm dev            # first run downloads the library YAML (~60 MB) and builds the index
```

The library checkout is cached in `.cache/` and the generated index lives at `static/data/index.json`. Neither is
committed. Run `pnpm index` any time you want fresh data.

### Checks

Run all of these before opening a pull request. CI runs the same ones.

```bash
pnpm check          # svelte-check (types + Svelte diagnostics): 0 errors, 0 warnings
pnpm test           # unit tests (Vitest)
pnpm test:e2e       # browser tests (Playwright); first time: pnpm exec playwright install chromium
```

The Playwright tests stub GitHub, so they are deterministic and don't use your API rate limit.

## Project layout

```
scripts/              build-time indexer: sparse-clone the library, parse YAML, write index.json
src/lib/              framework-free logic: parse, search, filters, URL state, live updates, YAML export
src/lib/*.svelte.ts   app state (data, selection, theme, toasts) using Svelte 5 runes
src/lib/components/   UI components
src/routes/           pages: / (search) and /about
e2e/                  Playwright tests
docs/                 screenshots
```

Most logic lives in plain TypeScript modules in `src/lib/` with unit tests next to them, such as `parse.ts` and
`parse.test.ts`. If you're changing how types are parsed, categorised or filtered, start there.

## Pull request workflow

1. **Open an issue first** for anything bigger than a small fix, so we can agree on the approach before you write it.
2. **Fork the repo and create a branch** from `main` (e.g. `fix/copy-button`, `feat/poe-budget-filter`).
3. **Make your change, with tests.** Logic changes need unit tests. New user-facing behaviour needs a Playwright test.
4. **Run all the checks** (`pnpm check`, `pnpm test`, `pnpm test:e2e`) and make sure they pass locally.
5. **Open a pull request** against `main` and fill in the template.
6. **CI must be green.** GitHub Actions runs the same checks on every PR. Red CI means no merge.
7. **Review.** Address feedback by pushing more commits to the same branch. The PR gets merged once it's approved and
   green.

## Pull request guidelines

- **Keep PRs focused.** One fix or feature per PR is easiest to review.
- **Add or update tests** for logic changes, and add a Playwright test for new user-facing behaviour.
- **Match the existing style:** Svelte 5 runes only (`$state`, `$derived`, `$props`; no `svelte/store` or
  `export let`), Tailwind for styling, and Lucide for icons. `.editorconfig` covers the formatting basics.
- **Mind the constraints:**
  - The site must stay fully static.
  - The browser may make at most one `api.github.com` request per page load.
  - Never copy YAML or images into `build/` (Cloudflare limits a deployment to 20,000 files).
  - Anything that shows an inferred category must say it is inferred.
- **Credit stays.** The attribution to the devicetype-library maintainers and contributors must not be removed.
- Update `CHANGELOG.md` under **Unreleased** if your change is user-visible.

## Licensing

RackDex's code is [MIT licensed](LICENSE). By contributing, you agree that your contributions are released under the
same license.
