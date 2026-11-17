<script lang="ts">
	import { SITE_URL } from '#lib/site';

	let {
		title,
		description,
		path,
		jsonLd
	}: { title: string; description: string; path: string; jsonLd?: Record<string, unknown> } = $props();

	const url = $derived(new URL(path, SITE_URL).href);
	// "<" is escaped so a value can never close the script element early.
	const ld = $derived(jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	{#if ld}
		{@html `<script type="application/ld+json">${ld}</script>`}
	{/if}
</svelte:head>
