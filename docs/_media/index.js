function createSquare() {
	const section = document.querySelector(".cover");
	const square = document.createElement("span");
	square.classList.add("star");
	const size = Math.random() * -10;

	square.style.width = `${4 + size}px`;
	square.style.height = `${4 + size}px`;

	square.style.top = `${Math.random() * innerHeight}px`;
	square.style.left = `${Math.random() * innerWidth}px`;

	section.appendChild(square);

	setTimeout(() => {
		square.remove();
	}, 40000);
}

let init = setInterval(createSquare, 150);

window.addEventListener("resize", () => {
	clearInterval(init);

	init = setInterval(createSquare, 150);
});
