<script lang="ts">
	import { Star } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { SITE_REPO_URL } from '#lib/github';
	import { defaultStorage, fetchStars } from '#lib/stars';
	import GitHubMark from './GitHubMark.svelte';

	let stars = $state<number | null>(null);
	const compact = new Intl.NumberFormat(undefined, { notation: 'compact' });

	onMount(() => {
		fetchStars({ storage: defaultStorage() }).then((n) => (stars = n));
	});
</script>

<a
	href={SITE_REPO_URL}
	target="_blank"
	rel="noopener"
	data-testid="repo-link"
	title="RackDex on GitHub: source, issues, and a star if you find it useful"
	aria-label={stars === null ? 'RackDex on GitHub' : `RackDex on GitHub, ${stars} stars`}
	class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm whitespace-nowrap hover:bg-zinc-200 sm:px-2.5 dark:border-zinc-700 dark:hover:bg-zinc-800"
>
	<GitHubMark class="size-4" />
	<span class="hidden items-center gap-1 sm:inline-flex"><Star class="size-3.5" /> Star</span>
	{#if stars !== null}
		<span data-testid="star-count" class="border-l border-zinc-300 pl-1.5 tabular-nums dark:border-zinc-700">{compact.format(stars)}</span>
	{/if}
</a>
