<script lang="ts">
	import { Check, Copy, Download, ExternalLink, LoaderCircle, Plus, X } from '@lucide/svelte';
	import { cart } from '$lib/cart.svelte';
	import { CATEGORY_LABELS } from '$lib/category';
	import { copyText, downloadText } from '$lib/clipboard';
	import { data } from '$lib/data.svelte';
	import { blobUrl, rawUrl } from '$lib/github';
	import { toast } from '$lib/toast.svelte';
	import { COMPONENT_LABELS, IMPORT_HINTS, KIND_LABELS, type ComponentKey, type IndexRecord } from '$lib/types';
	import { fetchYaml, yamlFilename } from '$lib/yamlExport';
	import ManufacturerHelper from './ManufacturerHelper.svelte';
	import YamlView from './YamlView.svelte';

	let { record: r, onclose }: { record: IndexRecord; onclose: () => void } = $props();

	// The panel is remounted per record (see {#key} in +page.svelte), so sha is fixed.
	const sha = data.sha;
	let yaml = $state<string | null>(null);
	let yamlError = $state<string | null>(null);
	let attempt = $state(0);
	let broken = $state<Record<string, boolean>>({});

	$effect(() => {
		void attempt;
		let cancelled = false;
		yaml = null;
		yamlError = null;
		fetchYaml(sha, r.id)
			.then((t) => !cancelled && (yaml = t))
			.catch((e: Error) => !cancelled && (yamlError = e.message));
		return () => (cancelled = true);
	});

	const inCart = $derived(cart.has(r.id));
	const specRows = $derived(
		(
			[
				['Kind', KIND_LABELS[r.kind]],
				['Category', r.category ? `${CATEGORY_LABELS[r.category]} (inferred)` : undefined],
				['Part number', r.partNumber],
				['Slug', r.slug],
				['Height', r.uHeight !== undefined ? `${r.uHeight}U` : undefined],
				['Full depth', r.fullDepth === undefined ? undefined : r.fullDepth ? 'Yes' : 'No'],
				['Airflow', r.airflow],
				['Weight', r.weight !== undefined ? `${r.weight} ${r.weightUnit ?? ''}`.trim() : undefined],
				['Subdevice role', r.subdeviceRole],
				['Form factor', r.formFactor],
				['Width', r.width !== undefined ? `${r.width}"` : undefined],
				['Speeds', r.speeds.join(', ') || undefined],
				['PoE', r.poe ? 'Yes' : undefined]
			] as [string, string | undefined][]
		).filter((row): row is [string, string] => row[1] !== undefined)
	);
	const components = $derived(Object.entries(r.counts) as [ComponentKey, number][]);
	const images = $derived(
		(['front', 'rear'] as const)
			.map((side) => ({ side, path: r.images[side] }))
			.filter((i): i is { side: 'front' | 'rear'; path: string } => !!i.path && !broken[i.side])
	);

	async function copy() {
		if (!yaml) return;
		if (await copyText(yaml)) toast('YAML copied');
		else toast('Copy failed — use Download instead', 'error');
	}
	function download() {
		if (yaml) downloadText(yamlFilename(r.id), yaml);
	}

	const btn =
		'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<button type="button" class="fixed inset-0 z-40 bg-black/40" aria-label="Close details" onclick={onclose}></button>
<aside
	aria-label="Device type details"
	class="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
>
	<div class="flex items-start gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
		<div class="min-w-0 flex-1">
			<p class="text-xs text-zinc-500">{r.vendor} · {KIND_LABELS[r.kind]}</p>
			<h2 class="truncate text-lg font-semibold">{r.model}</h2>
			{#if r.partNumber && r.partNumber !== r.model}<p class="text-sm text-zinc-500">{r.partNumber}</p>{/if}
		</div>
		<button type="button" class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Close" onclick={onclose}>
			<X class="size-5" />
		</button>
	</div>

	<div class="flex flex-wrap gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
		<button type="button" class={btn} disabled={!yaml} onclick={copy}><Copy class="size-4" /> Copy YAML</button>
		<button type="button" class={btn} disabled={!yaml} onclick={download}><Download class="size-4" /> Download YAML</button>
		<button type="button" class={btn} onclick={() => cart.toggle(r.id)} aria-pressed={inCart}>
			{#if inCart}<Check class="size-4 text-sky-500" /> In selection{:else}<Plus class="size-4" /> Add to selection{/if}
		</button>
		<a class={btn} href={blobUrl(sha, r.id)} target="_blank" rel="noopener"><ExternalLink class="size-4" /> View on GitHub</a>
		<p class="w-full text-xs text-zinc-500">Import: {IMPORT_HINTS[r.kind]} — paste the YAML or upload the file.</p>
	</div>

	<div class="flex-1 space-y-6 overflow-y-auto p-4">
		<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
			{#each specRows as [k, v] (k)}
				<dt class="text-zinc-500">{k}</dt>
				<dd class="break-words">{v}</dd>
			{/each}
		</dl>

		{#if components.length}
			<section>
				<h3 class="mb-2 text-sm font-semibold">Components</h3>
				<ul class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
					{#each components as [k, n] (k)}
						<li class="flex justify-between gap-2"><span class="text-zinc-500">{COMPONENT_LABELS[k]}</span><span class="tabular-nums">{n}</span></li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if images.length}
			<section>
				<h3 class="mb-2 text-sm font-semibold">Elevation images</h3>
				<div class="space-y-3">
					{#each images as img (img.side)}
						<figure>
							<img
								src={rawUrl(sha, img.path)}
								alt={`${r.model} ${img.side}`}
								loading="lazy"
								class="w-full rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
								onerror={() => (broken[img.side] = true)}
							/>
							<figcaption class="mt-1 flex items-center gap-2 text-xs text-zinc-500">
								{img.side}
								<a class="hover:text-sky-500" href={rawUrl(sha, img.path)} download target="_blank" rel="noopener">download</a>
							</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}

		<ManufacturerHelper names={[r.vendor]} />

		<section>
			<h3 class="mb-2 text-sm font-semibold">YAML</h3>
			{#if yaml}
				<YamlView code={yaml} />
			{:else if yamlError}
				<div class="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
					{yamlError}
					<button type="button" class="ml-2 text-sky-500 hover:underline" onclick={() => attempt++}>Retry</button>
				</div>
			{:else}
				<p class="inline-flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle class="size-4 animate-spin" /> Fetching from GitHub…</p>
			{/if}
		</section>

		{#if r.comments}
			<section>
				<h3 class="mb-1 text-sm font-semibold">Comments</h3>
				<p class="text-sm break-words text-zinc-600 dark:text-zinc-400">{r.comments}</p>
			</section>
		{/if}
	</div>
</aside>
