<script lang="ts">
	import { data } from '#lib/data.svelte';
	import { commitUrl, REPO_URL, SITE_REPO_URL } from '#lib/github';

	const link = 'text-sky-600 hover:underline dark:text-sky-400';
</script>

<footer data-testid="credits" class="space-y-1.5 text-xs text-zinc-500">
	<p>
		All device, module and rack definitions come from
		<a class={link} href={REPO_URL} target="_blank" rel="noopener">netbox-community/devicetype-library</a>, maintained by the
		NetBox community and
		<a class={link} href={`${REPO_URL}/graphs/contributors`} target="_blank" rel="noopener">its contributors</a>. Thank you!
	</p>
	<p>
		Unofficial viewer — not affiliated with NetBox Labs. RackDex is free and open source:
		<a class={link} href={SITE_REPO_URL} target="_blank" rel="noopener">source on GitHub</a> ·
		<a class={link} href="/about">About</a>
	</p>
	{#if data.index}
		<p>
			Index built from
			<a class={link} href={commitUrl(data.index.meta.sha)} target="_blank" rel="noopener"><code>{data.index.meta.sha.slice(0, 7)}</code></a>
			({new Date(data.index.meta.date).toLocaleDateString()})
		</p>
	{/if}
</footer>
