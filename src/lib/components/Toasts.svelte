<script lang="ts">
	import { toasts } from '$lib/toast.svelte';
</script>

<div class="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
	{#each toasts as t (t.id)}
		<div
			role="status"
			class={[
				'rounded-lg px-4 py-2 text-sm shadow-lg',
				t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
			]}
		>
			{t.message}
		</div>
	{/each}
</div>
