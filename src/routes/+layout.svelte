<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { browser } from '$app/environment';
	let { children } = $props();

</script>

{@render children()}
