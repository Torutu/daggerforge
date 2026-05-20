/**
 * Makes an Obsidian modal draggable by its title bar.
 * Uses transform: translate so the initial centering is preserved.
 * Supports both mouse (desktop) and touch (mobile).
 */
export function makeDraggable(modalEl: HTMLElement, handle: HTMLElement): void {
	let ax = 0, ay = 0;
	let sx = 0, sy = 0;

	handle.addClass("df-draggable-handle");

	const isInteractive = (t: EventTarget | null) =>
		(t as HTMLElement)?.closest("button, input, select, textarea, a, label, .modal-close-button") !== null;

	const apply = (dx: number, dy: number) => {
		modalEl.style.transform = `translate(${ax + dx}px, ${ay + dy}px)`;
	};

	// ── Mouse ────────────────────────────────────────────────────────────────
	const onMouseMove = (e: MouseEvent) => apply(e.clientX - sx, e.clientY - sy);
	const onMouseUp   = (e: MouseEvent) => {
		ax += e.clientX - sx;
		ay += e.clientY - sy;
		handle.removeClass("df-dragging-handle");
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup",   onMouseUp);
	};

	handle.addEventListener("mousedown", (e: MouseEvent) => {
		if (e.button !== 0 || isInteractive(e.target)) return;
		sx = e.clientX;
		sy = e.clientY;
		handle.addClass("df-dragging-handle");
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup",   onMouseUp);
		e.preventDefault();
	});

	// ── Touch ────────────────────────────────────────────────────────────────
	const onTouchMove = (e: TouchEvent) => {
		const t = e.touches[0];
		apply(t.clientX - sx, t.clientY - sy);
		e.preventDefault();
	};
	const onTouchEnd = (e: TouchEvent) => {
		const t = e.changedTouches[0];
		ax += t.clientX - sx;
		ay += t.clientY - sy;
		document.removeEventListener("touchmove", onTouchMove);
		document.removeEventListener("touchend",  onTouchEnd);
	};

	handle.addEventListener("touchstart", (e: TouchEvent) => {
		if (isInteractive(e.target)) return;
		const t = e.touches[0];
		sx = t.clientX;
		sy = t.clientY;
		document.addEventListener("touchmove", onTouchMove, { passive: false });
		document.addEventListener("touchend",  onTouchEnd);
		e.preventDefault();
	}, { passive: false });
}
