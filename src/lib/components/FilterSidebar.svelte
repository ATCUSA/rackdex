<script lang="ts">
	import { CATEGORY_LABELS } from '$lib/category';
	import { activeFilterCount, emptyFilters, type Facets, type Filters } from '$lib/filters';
	import { SPEED_GROUPS } from '$lib/speeds';
	import { KIND_LABELS } from '$lib/types';
	import FacetList from './FacetList.svelte';
	import RangeInputs from './RangeInputs.svelte';
	import TriToggle from './TriToggle.svelte';

	let { filters = $bindable(), facets }: { filters: Filters; facets: Facets } = $props();
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h2 class="text-sm font-semibold">Filters</h2>
		{#if activeFilterCount(filters)}
			<button type="button" class="text-xs text-sky-500 hover:underline" onclick={() => (filters = emptyFilters())}>Reset all</button>
		{/if}
	</div>
	<FacetList title="Kind" options={facets.kinds} bind:selected={filters.kinds} labels={KIND_LABELS} />
	<FacetList title="Category (inferred)" options={facets.categories} bind:selected={filters.categories} labels={CATEGORY_LABELS} />
	<FacetList title="Vendor" options={facets.vendors} bind:selected={filters.vendors} searchable limit={10} />
	<FacetList title="Interface speed" options={facets.speeds} bind:selected={filters.speeds} order={SPEED_GROUPS} limit={14} />
	<FacetList title="Airflow" options={facets.airflows} bind:selected={filters.airflows} limit={6} />
	<RangeInputs label="Rack units (U)" bind:min={filters.uMin} bind:max={filters.uMax} />
	<RangeInputs label="Interface count" bind:min={filters.ifMin} bind:max={filters.ifMax} />
	<div class="space-y-2">
		<TriToggle label="Full depth" bind:value={filters.fullDepth} />
		<TriToggle label="Has image" bind:value={filters.hasImage} />
		<TriToggle label="PoE" bind:value={filters.poe} />
		<TriToggle label="Console port" bind:value={filters.console} />
		<TriToggle label="Power port" bind:value={filters.power} />
		<TriToggle label="Device/module bays" bind:value={filters.bays} />
	</div>
</div>
