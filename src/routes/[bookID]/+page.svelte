<script lang="ts">
	// https://github.com/pgaskin/ePubViewer
	import { run } from 'svelte/legacy';
	import { fly, slide, fade, crossfade, draw, scale, blur } from 'svelte/transition';

	import ReadingBar from '$lib/ReadingBar.svelte';
	import ePub, { Book, Rendition } from 'epubjs';

	import { onMount } from 'svelte';
	import { contents } from '$lib/stores/contents';
	import { backIn, backOut, expoIn, expoOut, quadIn, quadOut } from 'svelte/easing';
	import type { RenditionOptions } from 'epubjs/types/rendition.js';

	let { data } = $props();
	let sbookID = data.book !== null ? data.book : 0;
	let bookID = +sbookID;
	let overlay = $state(1);
	var currentPage: HTMLInputElement;
	let slider: HTMLInputElement;
	let root: HTMLElement | null = $state(null);
	let sliderValue = $state(0);
	var rendition: Rendition;
	var displayed: any;
	let currentPageValue = 0;
	var book: Book;
	let maxPages = $state(100);
	let contentsShow: boolean = $state(false);
	let title: String = $state('');
	let books = [
		'Hyperion-Dan Simmons.epub',
		'Dune-FrankHerbert.epub',
		'SpeakerforDead-OrsonScottCard.epub',
		'hans.epub',
		'Madame-GustaveFlaubert.epub',
		'moby-dick.epub'
	];
	let currentTheme: 'dark' | 'light' = $state('dark');
	let bg = $state('--dark');
	let color = $state('--light');
	type Theme = {
		body?: {
			color?: string;
			'font-family'?: string;
		};
		p?: {
			color?: string;
			'text-align'?: string;
		};
	} | null;

	let DarkRules : Theme = {
		body: {
			'font-family': 'Segoe UI',
			color: 'rgb(230, 224, 198)'
		},
		p: {
			'text-align': 'left !important',
			// color: 'rgb(60,58,58)'
		}
	};

	let LightRules : Theme = {
		body: {
			'font-family': 'Segoe UI',
			color: 'rgb(60, 58, 58)'
		},
		p: {
			'text-align': 'left !important',
			// color: 'rgb(60,58,58)'
		}
	};

	interface ContentsItem {
		label: string;
		href: string;
	}
	let cnts: ContentsItem[] = $state([]);
	run(() => {
		$contents.forEach((item: ContentsItem) => {
			cnts = [...cnts, { label: item.label, href: item.href }];
		});

		console.log('Contents: ', cnts);
	});

	function goToChapter(e: any) {
		e.preventDefault();
		let splitUrl = e.target.toString().split('/');
		console.log('splitUrl: ', splitUrl);
		let chapter = splitUrl[splitUrl.length - 1];
		console.log('Chapter: ', chapter);
		contentsShow = false;
		rendition.display(chapter);
	}

	let isChanging: boolean = $state(false);

	var slid = function (pages: number) {
		var cfi = book.locations.cfiFromPercentage(sliderValue / pages);
		rendition.display(cfi);
	};
	var mouseDown = false;

	// Load the opf
	const prev = (e: any) => {
		rendition.prev();
		e.preventDefault();
	};

	const next = (e: any) => {
		isChanging = true;
		rendition.next();
		e.preventDefault();
		setTimeout(restoreChanging, 100);
	};

	function restoreChanging() {
		isChanging = false;
	}

	const updatePage = () => {
		var cfi = book.locations.cfiFromPercentage(sliderValue / maxPages);
		rendition.display(cfi);
	};
	// console.log(JSON.stringify(data));
	onMount(() => {
		book = ePub(books[+bookID]);
		rendition = book.renderTo('viewer', {
			width: '100%',
			height: '100%',
			manager: 'default',
			// layout: "reflowable",
			minSpreadWidth: 800,
			spread: 'auto',
			// resizeOnOrientationChange: false,
			// allowScriptedContent: true
		});
		displayed = rendition.display();

		book.loaded.metadata.then((meta) => {
			title = meta.title;
		});

		var keyListener = function (e: KeyboardEvent) {
			// Left Key
			if (e.key == 'ArrowLeft') {
				rendition.prev();
			}

			// Right Key
			if (e.key == 'ArrowRight') {
				rendition.next();
			}
		};

		root = document.querySelector('body');

		rendition.themes.default({
			body: {
				background: 'transparent'
			},
			h2: {
				'font-size': '32px',
				color: 'purple'
			},
			p: {
				margin: '10px 0 !important',
				'text-align': 'left'
			}
		});

		rendition.themes.register('main', DarkRules);
		rendition.themes.select('main');

		$effect(() => {
			let rules = currentTheme === 'dark' ? DarkRules : LightRules;
			rendition.themes.register('main', rules);
			rendition.themes.select('main');
		});

		rendition.on('keyup', keyListener);
		document.addEventListener('keyup', keyListener, false);

		book.ready
			.then(function (data: any) {
				// Set contents
				contents.set(data[4].toc);

				// Load in stored locations from json or local storage
				var key = book.key() + '-locations';
				var stored = localStorage.getItem(key);
				if (stored) {
					const lastLocation = localStorage.getItem(book.key() + '-lastLocation');

					if (lastLocation !== null) {
						console.log('Last Location: ', lastLocation);
						rendition.display(lastLocation);
					}
					overlay = 0;
					return book.locations.load(stored);
				} else {
					// Or generate the locations on the fly
					// Can pass an option number of chars to break sections by
					// default is 150 chars
					overlay = 0;
					return book.locations.generate(3600);
				}
			})
			.then(function (locations) {
				let pages = locations.length || 100;
				maxPages = pages;
				slider.addEventListener('change', () => slid(pages), false);
				slider.addEventListener(
					'mousedown',
					function () {
						mouseDown = true;
					},
					false
				);
				slider.addEventListener(
					'mouseup',
					function () {
						mouseDown = false;
					},
					false
				);

				// Wait for book to be rendered to get current page
				displayed.then(function () {
					// Get the current CFI
					var currentLocation: any = rendition.currentLocation();
					// Get the Percentage (or location) from that CFI
					var currentPageNumber =
						book.locations.percentageFromCfi(currentLocation.start.cfi) * pages;
					sliderValue = currentPageNumber;
					currentPageValue = currentPageNumber;
				});

				slider.addEventListener(
					'change',
					function () {
						var cfi = book.locations.cfiFromPercentage(sliderValue / pages);
						rendition.display(cfi);
					},
					false
				);

				// Listen for location changed event, get percentage from CFI
				rendition.on('relocated', function (location: any) {
					var percent = book.locations.percentageFromCfi(location.start.cfi);
					var percentage = Math.floor(percent * pages);
					if (!mouseDown) {
						sliderValue = percentage;
						localStorage.setItem(book.key() + '-lastLocation', location.start.cfi);
					}
					// currentPage.value = percentage;
					console.log(location);
				});

				// Save out the generated locations to JSON
				localStorage.setItem(book.key() + '-locations', book.locations.save());
			});
	});

	async function toggleTheme(root: HTMLElement | null) {
		// root.style.setProperty('--oldlib-color', 'red');
		if (currentTheme == 'dark') {
			currentTheme = 'light';
			bg = 'var(--light)';
			color = 'var(--dark)';
			root?.style.setProperty('background-color', 'var(--light)');
		} else if (currentTheme == 'light') {
			currentTheme = 'dark';
			bg = 'var(--dark)';
			color = 'var(--light)';
			root?.style.setProperty('background-color', 'var(--dark)');
		}
	}
</script>

<svelte:head>
	<meta name="theme-color" content="rgb(60, 58, 58)" />
</svelte:head>

<div class="container" style:background-color={bg} style:color>
	<div class="contents" class:show={contentsShow}>
		<ul>
			<li class="text-end">
				<button
					class="m-4"
					aria-label="Close Contents"
					onclick={() => (contentsShow = !contentsShow)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						fill="currentColor"
						class="bi bi-x-square"
						viewBox="0 0 16 16"
					>
						<path
							d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"
						/>
						<path
							d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"
						/>
					</svg>
				</button>
			</li>
			{#each cnts as c}
				<li>
					<a
						href={c.href}
						class="font-medium text-indigo-200 hover:text-indigo-300 active:text-indigo-300"
						onclick={goToChapter}
					>
						{c.label.trim()}
					</a>
					<hr class="color-black" />
				</li>
			{/each}
		</ul>
	</div>
	<div class="header">
		<ReadingBar bind:contentsShow {title} {toggleTheme} {root} />
	</div>
	<div class="viewer-arrows">
		<a id="prev" onclick={(e) => prev(e)} href="#prev" class="arrow"><span>‹</span></a>

		{#if overlay == 1}
			<div id="spinner">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					height="32"
					width="32"
					viewBox="0 0 512 512"
				>
					<!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
					<path
						id="myspinner"
						d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"
					/>
				</svg>
			</div>
			<!-- {:else if overlay == 0 && !isChanging} -->
		{:else if overlay == 0}
			<!-- in:fly={{ duration: 500, x: '-100%' }} -->
			<!-- out:fly={{ delay: 200, duration: 500, x: '-100%' }} -->
			<div id="viewer"></div>
		{/if}
		<a id="next" onclick={(e) => next(e)} href="#next" class="arrow"><span>›</span></a>
	</div>

	<div id="controls">
		<input
			onchange={updatePage}
			type="number"
			bind:this={currentPage}
			id="current-percent"
			size="4"
			maxlength="3"
			bind:value={sliderValue}
		/>
		<!-- % -->
		<input
			id="range"
			type="range"
			bind:this={slider}
			min="0"
			max={'' + maxPages}
			step="1"
			bind:value={sliderValue}
		/>
		<!-- <div id="title">{sliderValue}</div> -->
	</div>
</div>

<style>
	.container {
		height: 100dvh;
		width: 100dvw;
		margin: 0 auto;
		overflow: hidden;
		/* background-color: rgb(255, 255, 255); */
	}

	.viewer-arrows {
		display: flex;
		justify-content: center;
		align-items: stretch;
	}

	#viewer {
		height: 80dvh;
		max-width: 80%;
		min-width: 80%;
		margin: 0 auto;
		z-index: 1;
		/* background-color: pink; */
	}

	#spinner {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 80dvh;
		max-width: 80%;
		min-width: 80%;
		margin: 0 auto;
		/* top: 50%;
		left: 50%; */
		/* transform: translateX(-50%) translateY(50%); */
		z-index: 1;
		animation: spin 1s infinite ease-out;
	}

	@keyframes spin {
		0% {
			transform: rotate(0);
			opacity: 0;
		}
		50% {
			opacity: 1;
			transform: rotate(220deg);
		}
		100% {
			opacity: 0;
			transform: rotate(360deg);
		}
	}

	.arrow {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 4rem;
		align-self: stretch;
		/* background-color: antiquewhite; */
		width: 100%;
	}

	.header {
		height: 10dvh;
		margin: 0 auto;
		width: 90%;
		/* background-color: rgb(231, 250, 215); */
		z-index: 100;
	}

	#controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 10vh;
		margin: 0 auto;
		width: 90%;
		font-size: smaller;
		/* background-color: azure; */
	}

	#range {
		flex: 1;
	}

	input[type='range'] {
		height: 4px;
	}

	input[type='number'] {
		width: 76px;
		text-align: center;
		border: none;
		border-radius: 0.5rem;
		background-color: rgb(43, 40, 40);
		outline: auto;
		/* padding: 1px; */
	}

	.contents {
		position: absolute;
		top: 10vh;
		right: 0;
		min-height: 100vh;
		font-size: x-large;
		display: none;
		background-color: inherit;
		color: inherit;
		width: 100%;
		padding: 25px;
		z-index: 5;
	}

	.contents ul {
		padding: 0 10%;
	}

	.show {
		display: block;
	}
</style>
