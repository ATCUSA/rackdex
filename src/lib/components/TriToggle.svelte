<script lang="ts">
	let { label, value = $bindable() }: { label: string; value?: boolean } = $props();
	const opts: { v: boolean | undefined; t: string }[] = [
		{ v: undefined, t: 'Any' },
		{ v: true, t: 'Yes' },
		{ v: false, t: 'No' }
	];
</script>

<div class="flex items-center justify-between gap-2 text-sm">
	<span>{label}</span>
	<div class="flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700" role="group" aria-label={label}>
		{#each opts as o (o.t)}
			<button
				type="button"
				aria-pressed={value === o.v}
				class={['px-2 py-0.5', value === o.v ? 'bg-sky-500 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800']}
				onclick={() => (value = o.v)}>{o.t}</button
			>
		{/each}
	</div>
</div>
