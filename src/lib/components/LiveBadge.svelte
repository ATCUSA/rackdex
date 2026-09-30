<script lang="ts">
	import { CircleAlert, CircleCheck, LoaderCircle, Radio } from '@lucide/svelte';
	import { data } from '$lib/data.svelte';

	const short = (s: string) => s.slice(0, 7);
	const fmt = (d: string) => new Date(d).toLocaleDateString();
	const s = $derived(data.live);
	const title = $derived(
		s.state === 'stale'
			? `${s.reason} — showing data built ${data.index ? fmt(data.index.meta.date) : ''}. Rebuild recommended.`
			: s.state === 'live'
				? `Built from ${data.index ? short(data.index.meta.sha) : ''}, ${s.changes} upstream change(s) applied live (now at ${short(s.sha)})`
				: s.state === 'current'
					? `Matches upstream master (${short(s.sha)}, ${fmt(s.date)})`
					: 'Checking GitHub for upstream changes'
	);
</script>

{#if data.index}
	<span
		{title}
		data-testid="live-badge"
		class="hidden items-center gap-1.5 rounded-full border border-zinc-300 px-2.5 py-1 text-xs whitespace-nowrap md:inline-flex dark:border-zinc-700"
	>
		{#if s.state === 'checking'}
			<LoaderCircle class="size-3.5 animate-spin" /> Checking for updates
		{:else if s.state === 'current'}
			<CircleCheck class="size-3.5 text-emerald-500" /> Up to date · {short(s.sha)}
		{:else if s.state === 'live'}
			<Radio class="size-3.5 text-sky-500" /> Live · {s.changes} update{s.changes === 1 ? '' : 's'}
		{:else}
			<CircleAlert class="size-3.5 text-amber-500" /> Data from {fmt(data.index.meta.date)}
		{/if}
	</span>
{/if}
