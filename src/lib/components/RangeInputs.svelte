<script lang="ts">
	let { label, min = $bindable(), max = $bindable() }: { label: string; min?: number; max?: number } = $props();

	const toNum = (v: string) => {
		const n = v.trim() === '' ? NaN : Number(v);
		return Number.isFinite(n) ? n : undefined;
	};
	const inputClass =
		'w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900';
</script>

<div class="text-sm">
	<div class="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">{label}</div>
	<div class="flex items-center gap-2">
		<input type="number" min="0" placeholder="min" aria-label={`${label} minimum`} class={inputClass}
			value={min ?? ''} oninput={(e) => (min = toNum(e.currentTarget.value))} />
		<span class="text-zinc-500">–</span>
		<input type="number" min="0" placeholder="max" aria-label={`${label} maximum`} class={inputClass}
			value={max ?? ''} oninput={(e) => (max = toNum(e.currentTarget.value))} />
	</div>
</div>
