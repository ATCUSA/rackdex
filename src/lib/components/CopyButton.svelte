<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import { copyText } from '#lib/clipboard';
	import { toast } from '#lib/toast.svelte';

	let { text, label, showLabel = false }: { text: string; label: string; showLabel?: boolean } = $props();
	let done = $state(false);

	async function run() {
		if (await copyText(text)) {
			done = true;
			toast(`Copied ${label}`);
			setTimeout(() => (done = false), 1500);
		} else {
			toast('Copy failed — select the text manually', 'error');
		}
	}
</script>

<button
	type="button"
	onclick={run}
	aria-label={`Copy ${label}`}
	title={`Copy ${label}`}
	class="inline-flex shrink-0 items-center gap-1 rounded-md p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
>
	{#if done}<Check class="size-4 text-emerald-500" />{:else}<Copy class="size-4" />{/if}
	{#if showLabel}<span class="text-xs">Copy {label}</span>{/if}
</button>
