<script module lang="ts">
	import hljs from 'highlight.js/lib/core';
	import yamlLang from 'highlight.js/lib/languages/yaml';
	hljs.registerLanguage('yaml', yamlLang);
</script>

<script lang="ts">
	let { code }: { code: string } = $props();
	// highlight.js escapes the input, so the output is safe to inject.
	const html = $derived(hljs.highlight(code, { language: 'yaml' }).value);
</script>

<pre class="yaml max-h-[32rem] overflow-auto rounded-lg bg-zinc-100 p-4 text-xs leading-relaxed dark:bg-zinc-950"><code>{@html html}</code></pre>
