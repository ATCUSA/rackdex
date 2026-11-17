<script lang="ts">
	import { LoaderCircle, SlidersHorizontal, X } from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/env';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import DetailPanel from '#lib/components/DetailPanel.svelte';
	import FilterSidebar from '#lib/components/FilterSidebar.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';
	import ResultsList from '#lib/components/ResultsList.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { data } from '#lib/data.svelte';
	import { activeFilterCount, emptyFacets, emptyFilters, type Facets, type Filters } from '#lib/filters';
	import { REPO_URL } from '#lib/github';
	import { SearchClient } from '#lib/searchClient';
	import { SITE_NAME, SITE_URL } from '#lib/site';
	import { SORTS, SORT_LABELS, type Sort } from '#lib/sort';
	import type { IndexRecord } from '#lib/types';
	import { fromParams, toParams } from '#lib/urlState';

	// Query parameters don't exist at prerender time, so the prerendered HTML is always the empty search;
	// the browser picks up ?q=, filters and ?open= on hydration.
	const initial = browser ? fromParams(page.url.searchParams) : { q: '', filters: emptyFilters(), open: undefined, sort: undefined };
	let query = $state(initial.q);
	let filters = $state<Filters>(initial.filters);
	let openId = $state<string | undefined>(initial.open);
	let sort = $state<Sort>(initial.sort ?? 'best');
	let resultIds = $state.raw<string[]>([]);
	let facets = $state.raw<Facets>(emptyFacets());
	let searching = $state(true);
	let showFilters = $state(false);
	let engineVersion = $state(0);
	let searchError = $state<string | null>(null);

	const client = browser ? new SearchClient() : null;
	if (client) client.onerror = () => (searchError = 'Search engine failed to start');
	onDestroy(() => client?.destroy());

	// (Re)build the search engine whenever the index changes (baked, then live).
	$effect(() => {
		const idx = data.index;
		if (!idx || !client) return;
		client.init(idx.records).then(() => engineVersion++);
	});

	// Run the search on any query/filter change (debounced).
	$effect(() => {
		if (engineVersion === 0 || !client) return;
		const q = query;
		const f = JSON.parse(JSON.stringify(filters)) as Filters;
		const s = sort;
		searching = true;
		const t = setTimeout(async () => {
			const res = await client.query(q, f, s);
			if (!res) return;
			resultIds = res.ids;
			facets = res.facets;
			searching = false;
		}, 60);
		return () => clearTimeout(t);
	});

	// Mirror state into the URL (shareable links).
	$effect(() => {
		const qs = toParams({ q: query, filters, open: openId, sort }).toString();
		const t = setTimeout(() => {
			const url = new URL(location.href);
			url.search = qs;
			if (url.href !== location.href) replaceState(url, {});
		}, 250);
		return () => clearTimeout(t);
	});

	const results = $derived(
		resultIds.map((id) => data.byId.get(id)).filter((r): r is IndexRecord => r !== undefined)
	);
	const openRecord = $derived(openId ? data.byId.get(openId) : undefined);
	const open = (r: IndexRecord) => (openId = r.id);
</script>

<Seo
	title="RackDex — Search the NetBox Device Type Library"
	description="Search 16,000+ NetBox device, module and rack types from 450+ vendors, check specs and rack elevation images, and copy import-ready YAML in one click. Free, no account."
	path="/"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: SITE_NAME,
		url: `${SITE_URL}/`,
		description: 'Search the NetBox Device Type Library and copy import-ready YAML for NetBox.',
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Any (web browser)',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
	}}
/>

<div class="flex h-dvh flex-col">
	<Header bind:query />
	<div class="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
		<aside class="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 p-4 lg:flex dark:border-zinc-800">
			<FilterSidebar bind:filters {facets} />
			<div class="mt-auto pt-8"><Footer /></div>
		</aside>

		{#if showFilters}
			<div class="fixed inset-0 z-40 lg:hidden">
				<button type="button" class="absolute inset-0 bg-black/50" aria-label="Close filters" onclick={() => (showFilters = false)}></button>
				<div class="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-zinc-50 p-4 shadow-xl dark:bg-zinc-950">
					<button type="button" class="mb-3 ml-auto flex rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Close filters" onclick={() => (showFilters = false)}>
						<X class="size-5" />
					</button>
					<FilterSidebar bind:filters {facets} />
					<div class="pt-8"><Footer /></div>
				</div>
			</div>
		{/if}

		<main class="flex min-w-0 flex-1 flex-col">
			<div class="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800">
				<button type="button" class="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2 py-1 lg:hidden dark:border-zinc-700" onclick={() => (showFilters = true)}>
					<SlidersHorizontal class="size-4" /> Filters{#if activeFilterCount(filters)}&nbsp;({activeFilterCount(filters)}){/if}
				</button>
				{#if data.index}
					<span data-testid="result-count" class="inline-flex items-center gap-1.5">
						{#if searching}<LoaderCircle class="size-3.5 animate-spin" />{/if}
						{results.length.toLocaleString()} of {data.index.records.length.toLocaleString()} types
					</span>
				{/if}
				{#if data.index}
					<label class="ml-auto inline-flex shrink-0 items-center gap-1.5 text-xs">
						<span class="hidden sm:inline">Sort</span>
						<select
							bind:value={sort}
							aria-label="Sort results"
							class="rounded-md border border-zinc-300 bg-transparent px-1.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
						>
							{#each SORTS as s (s)}<option value={s}>{SORT_LABELS[s]}</option>{/each}
						</select>
					</label>
				{/if}
				<a href={REPO_URL} target="_blank" rel="noopener" class={['hidden truncate text-xs hover:text-sky-500 sm:block', !data.index && 'ml-auto']}>
					Data: netbox-community/devicetype-library
				</a>
			</div>
			<div class="min-h-0 flex-1">
				{#if data.error}
					<div class="m-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
						<p>{data.error}</p>
						<button type="button" class="mt-2 text-sky-500 hover:underline" onclick={() => data.load()}>Retry</button>
					</div>
				{:else if searchError}
					<div class="m-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
						<p>{searchError}</p>
						<button type="button" class="mt-2 text-sky-500 hover:underline" onclick={() => location.reload()}>Retry</button>
					</div>
				{:else if !data.index}
					<!-- Also the prerendered content: what crawlers and no-JS visitors see. -->
					<section class="mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
						<h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Search the NetBox Device Type Library</h1>
						<p>
							RackDex searches every device, module and rack type in the community
							<a class="text-sky-600 hover:underline dark:text-sky-400" href={REPO_URL}>NetBox Device Type Library</a>: switches,
							routers, firewalls, servers, PDUs, patch panels, line cards and other modules, and rack types from
							Cisco, Juniper, Arista, HPE, Dell, Ubiquiti, Fortinet, Palo Alto Networks, APC and hundreds more.
						</p>
						<p>
							Type a model or part number such as <code>C9300-48P</code> or <code>EX4300-48T</code>, filter by rack units,
							port speed, PoE, airflow or interface count, then copy the YAML and paste it into NetBox's device type import.
							You can also export many types at once as one multi-document YAML file.
						</p>
						<p class="inline-flex items-center gap-2 text-zinc-500">
							<LoaderCircle class="size-4 animate-spin" /> Loading the index…
						</p>
						<noscript><p>RackDex needs JavaScript to search. The library itself is on GitHub.</p></noscript>
						<p><a class="text-sky-600 hover:underline dark:text-sky-400" href="/about">How RackDex works and how to import into NetBox</a></p>
					</section>
				{:else if results.length === 0 && !searching}
					<p class="m-6 text-sm text-zinc-500">No types match. Try a shorter query or clear some filters.</p>
				{:else}
					<ResultsList records={results} onopen={open} selectedId={openId} />
				{/if}
			</div>
		</main>
	</div>
</div>

{#if openRecord}
	{#key openRecord.id}
		<DetailPanel record={openRecord} onclose={() => (openId = undefined)} />
	{/key}
{/if}
