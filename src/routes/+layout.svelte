<script lang="ts">
	import '../app.css';
	import { browser } from '$app/env';
	import CartDrawer from '#lib/components/CartDrawer.svelte';
	import Toasts from '#lib/components/Toasts.svelte';
	import { data } from '#lib/data.svelte';

	let { children } = $props();
	if (browser) data.load();
</script>

{@render children()}
<CartDrawer />
<Toasts />
