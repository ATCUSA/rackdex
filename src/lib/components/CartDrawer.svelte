<script lang="ts">
	import { Copy, Download, LoaderCircle, Trash2, X } from '@lucide/svelte';
	import { cart } from '$lib/cart.svelte';
	import { copyLater, downloadText } from '$lib/clipboard';
	import { data } from '$lib/data.svelte';
	import { toast } from '$lib/toast.svelte';
	import { IMPORT_HINTS, KIND_PLURAL, type IndexRecord, type Kind } from '$lib/types';
	import { ui } from '$lib/ui.svelte';
	import { combineYaml, fetchYaml } from '$lib/yamlExport';
	import ManufacturerHelper from './ManufacturerHelper.svelte';

	const KINDS: Kind[] = ['device', 'module', 'rack'];
	type Group = { kind: Kind; items: IndexRecord[] };

	const items = $derived(cart.ids.map((id) => data.byId.get(id)).filter((r): r is IndexRecord => r !== undefined));
	const missing = $derived(data.index ? cart.ids.filter((id) => !data.byId.has(id)) : []);
	const groups = $derived(
		KINDS.map((kind) => ({ kind, items: items.filter((r) => r.kind === kind) })).filter((g) => g.items.length)
	);
	let busy = $state<string | null>(null);

	// Prefetch each selected item's YAML as soon as it's in the cart (rather than only when
	// Copy/Download is clicked) so those actions read an already-resolved promise. Without this,
	// clicking Copy kicks off the GitHub fetch *and* the clipboard write in the same gesture, and
	// a test reading navigator.clipboard immediately after the click can race the fetch.
	const yamlCache = new Map<string, Promise<string>>();
	const cachedYaml = (sha: string, id: string) => {
		const key = `${sha}\u0000${id}`;
		let p = yamlCache.get(key);
		if (!p) {
			p = fetchYaml(sha, id);
			// A failed fetch must not poison the cache forever — evict so the next attempt
			// (e.g. after the user retries) refetches instead of replaying the same rejection.
			p.catch(() => yamlCache.delete(key));
			yamlCache.set(key, p);
		}
		return p;
	};
	$effect(() => {
		const sha = data.sha;
		// Prefetch only; failures surface (and are retried) via the Copy/Download actions
		// themselves, so swallow the rejection here to avoid an unhandled-rejection warning.
		for (const r of items) cachedYaml(sha, r.id).catch(() => {});
	});

	const combined = (g: Group) => Promise.all(g.items.map((r) => cachedYaml(data.sha, r.id))).then(combineYaml);

	async function run(key: string, fn: () => Promise<void>) {
		busy = key;
		try {
			await fn();
		} catch {
			toast('Could not fetch YAML from GitHub — try again', 'error');
		} finally {
			busy = null;
		}
	}

	const copyGroup = (g: Group) =>
		run(`copy-${g.kind}`, async () => {
			if (await copyLater(combined(g))) toast(`Copied ${g.items.length} ${KIND_PLURAL[g.kind].toLowerCase()}`);
			else toast('Copy failed — use Download instead', 'error');
		});

	const downloadGroup = (g: Group) =>
		run(`dl-${g.kind}`, async () => downloadText(`netbox-${g.kind}-types.yaml`, await combined(g)));

	const close = () => (ui.cartOpen = false);
	const btn =
		'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';
</script>

<svelte:window onkeydown={(e) => ui.cartOpen && e.key === 'Escape' && close()} />

{#if ui.cartOpen}
	<button type="button" class="fixed inset-0 z-40 bg-black/40" aria-label="Close selection" onclick={close}></button>
	<aside
		aria-label="Selection"
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
	>
		<div class="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
			<h2 class="flex-1 text-lg font-semibold">Selection ({cart.count})</h2>
			{#if cart.count}
				<button type="button" class="text-xs text-zinc-500 hover:text-red-500" onclick={() => cart.clear()}>Clear all</button>
			{/if}
			<button type="button" class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Close" onclick={close}>
				<X class="size-5" />
			</button>
		</div>

		<div class="flex-1 space-y-6 overflow-y-auto p-4">
			{#if cart.count === 0}
				<p class="text-sm text-zinc-500">Nothing selected yet. Use the + button on any result to build a combined import.</p>
			{/if}

			{#each groups as g (g.kind)}
				{@const label = KIND_PLURAL[g.kind].toLowerCase()}
				<section class="space-y-2">
					<h3 class="font-semibold">{KIND_PLURAL[g.kind]} ({g.items.length})</h3>
					<p class="text-xs text-zinc-500">Import: {IMPORT_HINTS[g.kind]}</p>
					<ul class="divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
						{#each g.items as r (r.id)}
							<li class="flex items-center gap-2 px-3 py-1.5">
								<span class="min-w-0 flex-1 truncate">{r.vendor} {r.model}</span>
								<button type="button" class="rounded p-1 text-zinc-400 hover:text-red-500" aria-label={`Remove ${r.model}`} onclick={() => cart.remove(r.id)}>
									<Trash2 class="size-4" />
								</button>
							</li>
						{/each}
					</ul>
					<div class="flex flex-wrap gap-2">
						<button type="button" class={btn} disabled={busy !== null} aria-label={`Copy combined ${label}`} onclick={() => copyGroup(g)}>
							{#if busy === `copy-${g.kind}`}<LoaderCircle class="size-4 animate-spin" />{:else}<Copy class="size-4" />{/if} Copy combined
						</button>
						<button type="button" class={btn} disabled={busy !== null} aria-label={`Download combined ${label}`} onclick={() => downloadGroup(g)}>
							{#if busy === `dl-${g.kind}`}<LoaderCircle class="size-4 animate-spin" />{:else}<Download class="size-4" />{/if} Download combined
						</button>
					</div>
				</section>
			{/each}

			{#if missing.length}
				<p class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
					{missing.length} selected type{missing.length === 1 ? ' no longer exists' : 's no longer exist'} upstream.
					<button type="button" class="ml-1 text-sky-500 hover:underline" onclick={() => missing.forEach((id) => cart.remove(id))}>Remove</button>
				</p>
			{/if}

			{#if items.length}
				<ManufacturerHelper names={items.map((r) => r.vendor)} />
			{/if}
		</div>
	</aside>
{/if}
