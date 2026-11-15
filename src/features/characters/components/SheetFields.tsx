import { useLanguage as useUiLanguage } from "../../../i18n/react";
import { translate as dfTranslate } from "../../../i18n";
import React from "react";

/**
 * Small building blocks shared across character sheet sections:
 * banners, labeled inputs, and toggleable slot buttons.
 */

/** Section banner - pointed hexagon over a dark strip, as printed on the sheet. */
/** Lucide "zap", inlined like the sheet's other icons (no emoji, SSR-safe).
 *  Marks domain card recall costs. */
export function ZapIcon({ className }: { className?: string }) {
	useUiLanguage();
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.4"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={"df-cs-zap" + (className ? " " + className : "")}
			aria-hidden="true"
		>
			<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
		</svg>
	);
}

export function SectionBanner({ title }: { title: string }) {
	useUiLanguage();
	return (
		<div className="df-cs-banner">
			<span className="df-cs-banner-bar" />
			<span className="df-cs-banner-strip" />
			<span className="df-cs-banner-hex">
				<span className="df-cs-banner-hex-inner">{title}</span>
			</span>
		</div>
	);
}

/** Rounded header field with a label chip in its top-left corner. */
export function FieldBox({
	label,
	value,
	onChange,
	className,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}) {
	useUiLanguage();
	return (
		<label className={"df-cs-fieldbox" + (className ? " " + className : "")}>
			<span className="df-cs-fieldbox-label">{label}</span>
			<input
				type="text"
				className="df-cs-fieldbox-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</label>
	);
}

/** Input on a ruled line with its label printed underneath, like the sheet. */
export function LineField({
	label,
	value,
	onChange,
	className,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}) {
	useUiLanguage();
	return (
		<label className={"df-cs-linefield" + (className ? " " + className : "")}>
			<input
				type="text"
				className="df-cs-linefield-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			<span className="df-cs-linefield-label">{label}</span>
		</label>
	);
}

/** Auto-sizing textarea on the same ruled-line style. */
export function LineTextarea({
	label,
	value,
	onChange,
	rows = 2,
	className,
}: {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	rows?: number;
	className?: string;
}) {
	useUiLanguage();
	return (
		<label className={"df-cs-linefield" + (className ? " " + className : "")}>
			<textarea
				className="df-cs-linefield-textarea"
				rows={rows}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			{label ? <span className="df-cs-linefield-label">{label}</span> : null}
		</label>
	);
}

/**
 * Toggleable slot (HP box, stress box, armor shield, gold icon…).
 * Sets `.is-on` so the SVG art inside fills via --df-cs-slot-fill.
 */
export function SlotToggle({
	on,
	onToggle,
	label,
	className,
	children,
}: {
	on: boolean;
	onToggle: () => void;
	label: string;
	className?: string;
	children?: React.ReactNode;
}) {
	useUiLanguage();
	return (
		<button
			type="button"
			className={"df-cs-slot" + (on ? " is-on" : "") + (className ? " " + className : "")}
			aria-pressed={on}
			aria-label={label}
			onClick={onToggle}
		>
			{children}
		</button>
	);
}

/**
 * Tiny per-section settings toggle - a faint gear in the section's corner
 * that stays out of the printed-sheet look until hovered.
 */
export function SectionCog({ open, onToggle }: { open: boolean; onToggle: () => void }) {
	useUiLanguage();
	return (
		<button
			type="button"
			className={"df-cs-cog" + (open ? " is-open" : "")}
			aria-label={dfTranslate("ui.section.options")}
			aria-expanded={open}
			onClick={onToggle}
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		</button>
	);
}

/** Quiet inline panel holding a section's cog options. */
export function CogPanel({ children }: { children: React.ReactNode }) {
	useUiLanguage();
	return <div className="df-cs-cog-panel">{children}</div>;
}

/** Small labeled number input used inside cog panels. */
export function CogNumber({
	label,
	value,
	min,
	max,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
}) {
	useUiLanguage();
	return (
		<label className="df-cs-cog-field">
			{label}
			<input
				type="number"
				className="df-cs-cog-number"
				min={min}
				max={max}
				value={value}
				onChange={(e) => {
					const n = Number(e.target.value);
					if (Number.isInteger(n)) onChange(Math.min(max, Math.max(min, n)));
				}}
			/>
		</label>
	);
}

/** Square checkbox with a printed label (PRIMARY / SECONDARY marks). */
export function LabeledCheck({
	label,
	on,
	onToggle,
}: {
	label: string;
	on: boolean;
	onToggle: () => void;
}) {
	useUiLanguage();
	return (
		<button
			type="button"
			className={"df-cs-check" + (on ? " is-on" : "")}
			aria-pressed={on}
			onClick={onToggle}
		>
			<span className="df-cs-check-box" />
			{label}
		</button>
	);
}
