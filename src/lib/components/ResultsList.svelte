<script lang="ts">
	import type { IndexRecord } from '#lib/types';
	import ResultRow from './ResultRow.svelte';

	let {
		records,
		onopen,
		selectedId
	}: { records: IndexRecord[]; onopen: (r: IndexRecord) => void; selectedId?: string } = $props();

	const ROW = 60;
	const OVERSCAN = 8;
	let viewport: HTMLDivElement | undefined = $state();
	let scrollTop = $state(0);
	let height = $state(800);

	const start = $derived(Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN));
	const end = $derived(Math.min(records.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN));
	const visible = $derived(records.slice(start, end));

	// Jump back to the top only when the result set actually changes — not merely when the
	// `records` array is a new reference (e.g. the live index swapping in the same ids), which
	// would otherwise yank the scroll position out from under the user. A cheap signature
	// (length + first/last id) stands in for a full id-list comparison.
	const signature = $derived(records.length ? `${records.length}:${records[0].id}:${records.at(-1)!.id}` : '0');
	let lastSignature: string | undefined;
	$effect(() => {
		if (signature === lastSignature) return;
		lastSignature = signature;
		if (viewport) viewport.scrollTop = 0;
		scrollTop = 0;
	});
</script>

<div
	bind:this={viewport}
	bind:clientHeight={height}
	onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}
	class="h-full overflow-y-auto"
	role="list"
	aria-label="Results"
>
	<div class="relative" style:height="{records.length * ROW}px">
		<div style:transform="translateY({start * ROW}px)">
			{#each visible as r (r.id)}
				<ResultRow record={r} {onopen} selected={r.id === selectedId} height={ROW} />
			{/each}
		</div>
	</div>
</div>
