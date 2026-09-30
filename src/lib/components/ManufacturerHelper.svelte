<script lang="ts">
	import { manufacturerCsv, manufacturerSlug } from '$lib/yamlExport';
	import CopyButton from './CopyButton.svelte';

	let { names }: { names: string[] } = $props();
	const rows = $derived(
		[...new Set(names)].sort((a, b) => a.localeCompare(b)).map((name) => ({ name, slug: manufacturerSlug(name) }))
	);
	const csv = $derived(manufacturerCsv(names));
</script>

<section class="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
	<h3 class="mb-1 font-semibold">Manufacturer{rows.length > 1 ? 's' : ''}</h3>
	<p class="mb-3 text-xs text-zinc-500">
		NetBox matches the <code>manufacturer</code> field by <strong>name</strong>, so it must exist before you import. Create it
		under Devices → Manufacturers, or paste the CSV into Manufacturers → Import.
	</p>
	<div class="space-y-1.5">
		{#each rows as m (m.name)}
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				<span class="inline-flex items-center gap-1">
					<span class="text-xs text-zinc-500">name</span>
					<code class="rounded bg-zinc-100 px-1.5 dark:bg-zinc-800">{m.name}</code>
					<CopyButton text={m.name} label="manufacturer name" />
				</span>
				<span class="inline-flex items-center gap-1">
					<span class="text-xs text-zinc-500">slug</span>
					<code class="rounded bg-zinc-100 px-1.5 dark:bg-zinc-800">{m.slug}</code>
					<CopyButton text={m.slug} label="manufacturer slug" />
				</span>
			</div>
		{/each}
	</div>
	<div class="mt-3 flex items-start gap-2">
		<pre class="flex-1 overflow-x-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-950">{csv}</pre>
		<CopyButton text={csv} label="manufacturer CSV" />
	</div>
</section>
