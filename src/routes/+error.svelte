<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head><title>{notFound ? 'Not found' : 'Error'} · RackDex</title></svelte:head>

<div class="flex min-h-dvh flex-col">
	<Header showSearch={false} />
	<main class="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
		<p class="font-mono text-sm text-zinc-500">{page.status}</p>
		<h1 class="text-2xl font-semibold">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
		<p class="text-sm text-zinc-500">
			{notFound
				? "There's nothing at this address. The device you're after is probably one search away."
				: (page.error?.message ?? 'An unexpected error occurred.')}
		</p>
		<a href="/" class="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">Back to search</a>
	</main>
	<div class="mx-auto w-full max-w-3xl px-4 pb-6"><Footer /></div>
</div>
