<script lang="ts">
	import ReadingBar from '$lib/ReadingBar.svelte';
	import ePub, { Book, Rendition } from 'epubjs';

	import { onMount } from 'svelte';
	import { contents } from '$lib/stores/contents';

	export let data;
	let sbookID = data.book !== null ? data.book : 0;
	let bookID = +sbookID;

	var currentPage: HTMLInputElement;
	let slider: HTMLInputElement;

	let sliderValue = 0;
	var rendition: Rendition;
	var displayed: any;
	let currentPageValue = 0;
	var book: Book;
	let maxPages = 100;
	let contentsShow: boolean = false;
	let title: String;
	let books = [
		'Hyperion-Dan Simmons.epub',
		'Dune-FrankHerbert.epub',
		'SpeakerforDead-OrsonScottCard.epub',
		'hans.epub',
		'Madame-GustaveFlaubert.epub',
		'moby-dick.epub'
	];

	interface ContentsItem {
		label: string;
		href: string;
	}
	let cnts: ContentsItem[] = [];
	$: {
		$contents.forEach((item: ContentsItem) => {
			cnts = [...cnts, { label: item.label, href: item.href }];
		});

		console.log('Contents: ', cnts);
	}

	function goToChapter(e: any) {
		e.preventDefault();
		let splitUrl = e.target.toString().split('/');
		console.log('splitUrl: ', splitUrl);
		let chapter = splitUrl[splitUrl.length - 1];
		console.log('Chapter: ', chapter);
		contentsShow = false;
		rendition.display(chapter);
	}

	var slide = function (pages: number) {
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
		rendition.next();
		e.preventDefault();
	};

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
			// minSpreadWidth: 800,
			spread: 'auto'
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

		var root : HTMLElement | null = document.querySelector(':root');


		
		var oldLibThemeDark = {
			body: {
				color: (root!=null) ? getComputedStyle(root).getPropertyValue('--oldlib-color') : 'white',
				'font-family': 'Segoe UI'
			}
		};

		var oldLibThemeLight = {
			body: {
				color: (root!=null) ? getComputedStyle(root).getPropertyValue('--oldlib-bg') : 'black',
				'font-family': 'Segoe UI'
			}
		};

		rendition.themes.register('dark', oldLibThemeDark);

		rendition.themes.register('light', oldLibThemeLight);

		rendition.themes.default({
			body: {
				background: 'transparent'
			},
			h2: {
				'font-size': '32px',
				color: 'purple'
			},
			p: {
				margin: '10px'
			}
		});

		rendition.themes.select('dark');
		rendition.themes.fontSize('100%');

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

					return book.locations.load(stored);
				} else {
					// Or generate the locations on the fly
					// Can pass an option number of chars to break sections by
					// default is 150 chars
					return book.locations.generate(3600);
				}
			})
			.then(function (locations) {
				let pages = locations.length || 100;
				maxPages = pages;
				slider.addEventListener('change', () => slide(pages), false);
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
</script>

<svelte:head>
	<meta name="theme-color" content="rgb(60, 58, 58)" />
</svelte:head>

<div class="container">
	<div class="contents" class:show={contentsShow}>
		<ul>
			<li class="text-end">
				<button
					class="m-4"
					aria-label="Close Contents"
					on:click={() => (contentsShow = !contentsShow)}
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
					<a href={c.href} class="font-bold text-purple-800" on:click={goToChapter}>
						{c.label.trim()}
					</a>
					<hr class="color-black" />
				</li>
			{/each}
		</ul>
	</div>
	<div class="header">
		<ReadingBar bind:contentsShow {title} />
	</div>
	<div class="viewer-arrows">
		<a id="prev" on:click={(e) => prev(e)} href="#prev" class="arrow"><span>‹</span></a>
		<div id="viewer"></div>
		<a id="next" on:click={(e) => next(e)} href="#next" class="arrow"><span>›</span></a>
	</div>

	<div id="controls">
		<input
			on:change={updatePage}
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
		background-color: #ffffff;
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
