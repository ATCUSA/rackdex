<script lang="ts">
	let {
		title,
		options,
		selected = $bindable([]),
		labels = {},
		order,
		searchable = false,
		limit = 12
	}: {
		title: string;
		options: Record<string, number>;
		selected?: string[];
		labels?: Record<string, string>;
		order?: readonly string[];
		searchable?: boolean;
		limit?: number;
	} = $props();

	let filter = $state('');
	let expanded = $state(false);

	const entries = $derived.by(() => {
		const keys = [...new Set([...Object.keys(options), ...selected])];
		const f = filter.trim().toLowerCase();
		const visible = keys.filter((k) => !f || (labels[k] ?? k).toLowerCase().includes(f));
		return order
			? visible.sort((a, b) => order.indexOf(a) - order.indexOf(b))
			: visible.sort((a, b) => (options[b] ?? 0) - (options[a] ?? 0) || a.localeCompare(b));
	});
	const shown = $derived(expanded || filter ? entries : entries.slice(0, limit));

	function toggle(k: string) {
		selected = selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k];
	}
</script>

<fieldset class="space-y-1.5">
	<legend class="mb-1 flex w-full items-center justify-between text-xs font-semibold tracking-wide text-zinc-500 uppercase">
		{title}
		{#if selected.length}
			<button type="button" class="font-normal text-sky-500 normal-case hover:underline" onclick={() => (selected = [])}>clear</button>
		{/if}
	</legend>
	{#if searchable}
		<input
			bind:value={filter}
			placeholder={`Filter ${title.toLowerCase()}…`}
			class="mb-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900"
		/>
	{/if}
	{#each shown as k (k)}
		<label class="flex cursor-pointer items-center gap-2 text-sm">
			<input type="checkbox" class="accent-sky-500" checked={selected.includes(k)} onchange={() => toggle(k)} />
			<span class="flex-1 truncate">{labels[k] ?? k}</span>
			<span class="text-xs text-zinc-500 tabular-nums">{(options[k] ?? 0).toLocaleString()}</span>
		</label>
	{:else}
		<p class="text-xs text-zinc-500">No options</p>
	{/each}
	{#if !filter && entries.length > limit}
		<button type="button" class="text-xs text-sky-500 hover:underline" onclick={() => (expanded = !expanded)}>
			{expanded ? 'Show less' : `Show all ${entries.length}`}
		</button>
	{/if}
</fieldset>
