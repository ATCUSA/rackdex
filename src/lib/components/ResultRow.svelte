<script lang="ts">
	import { Check, Image as ImageIcon, Plus } from '@lucide/svelte';
	import { cart } from '$lib/cart.svelte';
	import { CATEGORY_LABELS } from '$lib/category';
	import { KIND_LABELS, type IndexRecord } from '$lib/types';

	let {
		record: r,
		onopen,
		selected = false,
		height
	}: { record: IndexRecord; onopen: (r: IndexRecord) => void; selected?: boolean; height: number } = $props();

	const inCart = $derived(cart.has(r.id));
	const topSpeed = $derived(r.speeds.filter((s) => s !== 'Wireless' && s !== 'Other').at(-1));
	const specs = $derived(
		[
			r.uHeight !== undefined ? `${r.uHeight}U` : null,
			r.counts.interfaces ? `${r.counts.interfaces} ifaces` : null,
			topSpeed ? `up to ${topSpeed}` : null,
			r.poe ? 'PoE' : null
		].filter(Boolean)
	);
	const chip = $derived(r.kind === 'device' ? CATEGORY_LABELS[r.category ?? 'other'] : KIND_LABELS[r.kind]);
</script>

<div
	role="listitem"
	style:height="{height}px"
	class={[
		'flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800',
		selected ? 'bg-sky-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
	]}
>
	<button
		type="button"
		onclick={() => cart.toggle(r.id)}
		aria-label={inCart ? 'Remove from selection' : 'Add to selection'}
		aria-pressed={inCart}
		class={[
			'grid size-6 shrink-0 place-items-center rounded border',
			inCart ? 'border-sky-500 bg-sky-500 text-white' : 'border-zinc-300 text-zinc-400 hover:border-sky-500 dark:border-zinc-700'
		]}
	>
		{#if inCart}<Check class="size-4" />{:else}<Plus class="size-4" />{/if}
	</button>
	<button type="button" onclick={() => onopen(r)} class="flex min-w-0 flex-1 items-center gap-3 text-left">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">
				{r.model}
				{#if r.partNumber && r.partNumber !== r.model}
					<span class="ml-2 text-xs font-normal text-zinc-500">{r.partNumber}</span>
				{/if}
			</div>
			<div class="truncate text-xs text-zinc-500">{[r.vendor, ...specs].join(' · ')}</div>
		</div>
		<span class="hidden shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 sm:inline dark:bg-zinc-800 dark:text-zinc-300">{chip}</span>
		{#if r.images.front || r.images.rear}
			<ImageIcon class="size-4 shrink-0 text-zinc-400" aria-label="Has elevation image" />
		{/if}
	</button>
</div>
