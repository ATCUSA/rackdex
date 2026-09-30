<script lang="ts">
	import '../app.css';
	import { data } from '$lib/data.svelte';

	let { children } = $props();
	data.load();
</script>

{@render children()}
