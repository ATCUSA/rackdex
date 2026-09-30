<script lang="ts">
	import { Moon, Search, ShoppingCart, Sun } from '@lucide/svelte';
	import { cart } from '$lib/cart.svelte';
	import { theme } from '$lib/theme.svelte';
	import { ui } from '$lib/ui.svelte';
	import LiveBadge from './LiveBadge.svelte';

	let { query = $bindable(''), showSearch = true }: { query?: string; showSearch?: boolean } = $props();
	let input: HTMLInputElement | undefined = $state();

	function onKey(e: KeyboardEvent) {
		const t = e.target as HTMLElement;
		if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) {
			e.preventDefault();
			input?.focus();
		}
	}
	const iconBtn = 'relative rounded-lg p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800';
</script>

<svelte:window onkeydown={onKey} />

<header class="shrink-0 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
	<div class="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
		<a href="/" aria-label="RackDex home" class="flex shrink-0 items-center gap-2 font-semibold">
			<img src="/mark.svg" alt="" class="hidden size-7 dark:block" />
			<img src="/mark-light.svg" alt="" class="size-7 dark:hidden" />
			<span class="hidden sm:inline">Rack<span class="text-[#D18B00] dark:text-[#F3B11A]">Dex</span></span>
		</a>
		{#if showSearch}
			<label class="relative flex-1">
				<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
				<input
					bind:this={input}
					bind:value={query}
					type="search"
					aria-label="Search device types"
					placeholder="Search model, part number, vendor…  ( / )"
					class="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-zinc-700 dark:bg-zinc-900"
				/>
			</label>
		{:else}
			<div class="flex-1"></div>
		{/if}
		<LiveBadge />
		<button type="button" class={iconBtn} onclick={() => theme.toggle()} aria-label="Toggle theme">
			{#if theme.dark}<Sun class="size-5" />{:else}<Moon class="size-5" />{/if}
		</button>
		<button type="button" class={iconBtn} onclick={() => (ui.cartOpen = true)} aria-label="Open selection">
			<ShoppingCart class="size-5" />
			{#if cart.count}
				<span class="absolute -top-0.5 -right-0.5 rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">{cart.count}</span>
			{/if}
		</button>
	</div>
</header>
