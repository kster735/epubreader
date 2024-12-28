<script>
	export let contentsShow = false;
	export let title;

	let isVisible = false;

	function toggleShowMenu() {
		isVisible = !isVisible;
	}

	function toggleContents() {
		contentsShow = !contentsShow;
		toggleShowMenu();
	}

</script>

<div class="header">
	<nav class="navbar">
		<a href="/" class="brand"> &larr;</a>
		<div>{title}</div>
		<div class="nav-links" id="navLinks" class:show={isVisible}>
			<button
				aria-label="Contents"
				class="m-1 rounded-[0.5rem] bg-[gainsboro] px-2 py-1 font-bold duration-300"
				on:click={toggleContents}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					fill="currentColor"
					class="bi bi-list-ul"
					viewBox="0 0 16 16"
				>
					<path
						fill-rule="evenodd"
						d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
					/>
				</svg>
			</button>
		</div>
		<button
			aria-label="Navigation list - burger button"
			class="menu-btn"
			id="menuBtn"
			on:click={toggleShowMenu}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				fill="currentColor"
				class="bi bi-list"
				viewBox="0 0 16 16"
			>
				<path
					fill-rule="evenodd"
					d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
				/>
			</svg>
		</button>
	</nav>
</div>

<style>
	div.header {
		position: absolute;
		top: 0;
		/* background-color: white; */
		left: 0;
		right: 0;
		padding: 0 4px;
		box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.15);
		z-index: 200;
	}

	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 0;
	}

	.brand {
		text-decoration: none;
		font-weight: bold;
		font-size: xx-large;
	}

	.nav-links {
		display: flex;
		align-items: center;

		gap: 15px;
	}

	.nav-links a {
		text-decoration: none;
	}

	.menu-btn {
		display: none;
		border: none;
		cursor: pointer;
	}

	/* Media Query */
	@media (max-width: 564px) {
		.nav-links {
			display: none;
			flex-direction: column;
			position: absolute;
			top: 10vh;
			right: 5%;
			max-height: 80vh;
			overflow-y: scroll;
			background-color: white;
			padding: 24px;
			border: 1px solid #555;
			border-radius: 8px;
			box-shadow: 0px 15px 25px rgba(0, 0, 0, 0.25);
			z-index: 10;
		}

		.nav-links.show {
			display: flex;
		}

		.menu-btn {
			display: block;
		}
	}
</style>
