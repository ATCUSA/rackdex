<script lang="ts">
	import '../app.css';
	import CartDrawer from '$lib/components/CartDrawer.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import { data } from '$lib/data.svelte';

	let { children } = $props();
	data.load();
</script>

{@render children()}
<CartDrawer />
<Toasts />
