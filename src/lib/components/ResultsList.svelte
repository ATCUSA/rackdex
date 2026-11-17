<script lang="ts">
	import type { IndexRecord } from '#lib/types';
	import ResultRow from './ResultRow.svelte';

	let {
		records,
		onopen,
		selectedId,
		dividerAt
	}: {
		records: IndexRecord[];
		onopen: (r: IndexRecord) => void;
		selectedId?: string;
		/** Index of the first loose match after a sort's close matches; draws a divider before it. */
		dividerAt?: number;
	} = $props();

	const ROW = 60;
	const DIVIDER = 32;
	const OVERSCAN = 8;
	let viewport: HTMLDivElement | undefined = $state();
	let scrollTop = $state(0);
	let height = $state(800);

	// Rows are a fixed height except for one optional divider, which shifts every row from dividerAt on.
	const k = $derived(dividerAt !== undefined && dividerAt > 0 && dividerAt < records.length ? dividerAt : undefined);
	const indexAt = (y: number) => (k === undefined || y < k * ROW ? Math.floor(y / ROW) : Math.max(k, Math.floor((y - DIVIDER) / ROW)));
	const start = $derived(Math.max(0, indexAt(scrollTop) - OVERSCAN));
	const end = $derived(Math.min(records.length, indexAt(scrollTop + height) + 1 + OVERSCAN));
	const visible = $derived(records.slice(start, end));
	const offset = $derived(start * ROW + (k !== undefined && start > k ? DIVIDER : 0));
	const total = $derived(records.length * ROW + (k !== undefined ? DIVIDER : 0));

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
	<div class="relative" style:height="{total}px">
		<div style:transform="translateY({offset}px)">
			{#each visible as r, i (r.id)}
				{#if start + i === k}
					<div
						role="separator"
						aria-label="Other matches"
						data-testid="results-divider"
						style:height="{DIVIDER}px"
						class="flex items-end border-b border-zinc-200 bg-zinc-100/60 px-4 pb-1.5 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900/60"
					>
						Other matches
					</div>
				{/if}
				<ResultRow record={r} {onopen} selected={r.id === selectedId} height={ROW} />
			{/each}
		</div>
	</div>
</div>
