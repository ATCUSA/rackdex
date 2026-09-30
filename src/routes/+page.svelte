<script lang="ts">
	import { LoaderCircle, SlidersHorizontal, X } from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import DetailPanel from '$lib/components/DetailPanel.svelte';
	import FilterSidebar from '$lib/components/FilterSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import ResultsList from '$lib/components/ResultsList.svelte';
	import { data } from '$lib/data.svelte';
	import { activeFilterCount, emptyFacets, type Facets, type Filters } from '$lib/filters';
	import { REPO_URL } from '$lib/github';
	import { SearchClient } from '$lib/searchClient';
	import type { IndexRecord } from '$lib/types';
	import { fromParams, toParams } from '$lib/urlState';

	const initial = fromParams(page.url.searchParams);
	let query = $state(initial.q);
	let filters = $state<Filters>(initial.filters);
	let openId = $state<string | undefined>(initial.open);
	let resultIds = $state.raw<string[]>([]);
	let facets = $state.raw<Facets>(emptyFacets());
	let searching = $state(true);
	let showFilters = $state(false);
	let engineVersion = $state(0);
	let searchError = $state<string | null>(null);

	const client = new SearchClient();
	client.onerror = () => (searchError = 'Search engine failed to start');
	onDestroy(() => client.destroy());

	// (Re)build the search engine whenever the index changes (baked, then live).
	$effect(() => {
		const idx = data.index;
		if (!idx) return;
		client.init(idx.records).then(() => engineVersion++);
	});

	// Run the search on any query/filter change (debounced).
	$effect(() => {
		if (engineVersion === 0) return;
		const q = query;
		const f = JSON.parse(JSON.stringify(filters)) as Filters;
		searching = true;
		const t = setTimeout(async () => {
			const res = await client.query(q, f);
			if (!res) return;
			resultIds = res.ids;
			facets = res.facets;
			searching = false;
		}, 60);
		return () => clearTimeout(t);
	});

	// Mirror state into the URL (shareable links).
	$effect(() => {
		const qs = toParams({ q: query, filters, open: openId }).toString();
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

<svelte:head><title>RackDex — NetBox device type search</title></svelte:head>

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
				<span data-testid="result-count" class="inline-flex items-center gap-1.5">
					{#if searching}<LoaderCircle class="size-3.5 animate-spin" />{/if}
					{results.length.toLocaleString()} of {(data.index?.records.length ?? 0).toLocaleString()} types
				</span>
				<a href={REPO_URL} target="_blank" rel="noopener" class="ml-auto truncate text-xs hover:text-sky-500">
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
					<p class="m-6 inline-flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle class="size-4 animate-spin" /> Loading index…</p>
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
