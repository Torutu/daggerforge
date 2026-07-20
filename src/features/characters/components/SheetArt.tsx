/**
 * Decorative SVG art for the character sheet, traced 1:1 from the vector
 * paths of the official Daggerheart character sheet PDF.
 *
 * All colors come from CSS variables scoped on .df-cs-sheet so the art follows
 * Obsidian's light/dark theme. Toggleable icons fill their silhouette with
 * `--df-cs-slot-fill`, which flips to ink when the parent has `.is-on`.
 */

const INK = "var(--df-cs-ink)";
const PAPER = "var(--df-cs-paper)";
const FAINT = "var(--df-cs-faint)";
const MID = "var(--df-cs-mid)";
const STRONG = "var(--df-cs-strong)";
const SLOT_FILL = "var(--df-cs-slot-fill, var(--df-cs-paper))";

/** Trait value shield (under each trait name). */
export function TraitShieldArt() {
	return (
		<svg className="df-cs-trait-shield-art" viewBox="2.3 8.9 44.3 46.6" aria-hidden="true">
			{/* side wings */}
			<path d="M23.2 41.8 L13.2 46.1 L3.3 36 L3.3 23.7 L23.2 23.7 Z" fill={INK} />
			<path d="M45.7 35.8 L35.7 46.1 L25.7 42 L25.7 23.7 L45.7 23.7 Z" fill={INK} />
			{/* shield body */}
			<path
				d="M6.1 48.2 L6.1 33.1 L3.3 30 L3.3 9.9 L45.6 9.9 L45.6 30.1 L42.8 33.3 L42.8 47.8 L24.5 54.5 Z"
				fill={PAPER}
				stroke={INK}
				strokeWidth="1"
			/>
			{/* inner echo line */}
			<path
				d="M6.6 13.2 L6.6 28.7 L9.4 31.8 L9.4 45.8 L21.9 50.1 L24.5 49.2 L27 50.1 L39.5 45.5 L39.5 32 L42.3 28.8 L42.3 13.2 Z"
				fill="none"
				stroke={FAINT}
				strokeWidth="0.6"
			/>
		</svg>
	);
}

/** Evasion dome shield, including the pointed label banner across the bottom. */
export function EvasionShieldArt() {
	return (
		<svg className="df-cs-evasion-art" viewBox="0.7 2.3 47.3 53.4" aria-hidden="true">
			{/* side wings */}
			<path d="M25.7 15.7 L36.4 11.1 L47.1 21.9 L47.1 35.1 L25.7 35.1 Z" fill={INK} />
			<path d="M1.6 22.1 L12.3 11.1 L23 15.5 L23 35.1 L1.6 35.1 Z" fill={INK} />
			{/* banner diamond - its points peek out as the label's pointed ends */}
			<path d="M18.3 54.7 L5.2 41.7 L24.3 22.6 L43.4 41.7 L30.4 54.7 Z" fill={STRONG} />
			{/* dome body */}
			<path
				d="M1.6 48.9 L1.6 28.3 L4.6 24.9 L4.6 22.9 C4.6 14.8 9.8 7.4 17.4 4.6 L17.8 4.5 C20 3.7 22.2 3.3 24.5 3.3 C26.7 3.3 28.9 3.6 30.9 4.4 C38.7 7.1 44 14.5 44 22.8 L44 25.1 L47 28.4 L47 48.9 Z"
				fill={PAPER}
				stroke={INK}
				strokeWidth="1"
			/>
			{/* inner echo line */}
			<path
				d="M24.5 6.6 C26.3 6.6 28.1 6.9 29.8 7.5 C36.3 9.8 40.7 15.9 40.7 22.8 L40.7 26.3 L43.7 29.7 L43.7 45.6 L5 45.6 L5 29.5 L8 26.1 L8 22.9 C8 16.1 12.2 10 18.6 7.7 L19 7.6 C20.7 6.9 22.6 6.6 24.5 6.6 Z"
				fill="none"
				stroke={FAINT}
				strokeWidth="0.6"
			/>
			{/* label bar over the diamond */}
			<rect x="4.4" y="44.7" width="40.2" height="9.4" fill={STRONG} />
		</svg>
	);
}

/** Armor heater shield with the label pill across the lower half. */
export function ArmorShieldArt() {
	return (
		<svg className="df-cs-armor-art" viewBox="5.1 5.8 51.1 54.9" aria-hidden="true">
			{/* side wings */}
			<path
				d="M12.9 21.9 L48.4 21.9 C49.2 22.8 49.6 23.3 50.3 24.2 L55.1 30.8 L52.2 42.5 C51.5 43.4 48.2 44 47.5 44.9 L13.8 44.9 C13.1 44 9.8 43.4 9.1 42.5 L6.2 30.8 L11 24.2 C11.7 23.3 12.1 22.8 12.9 21.9"
				fill={INK}
			/>
			{/* shield body */}
			<path
				d="M28.3 58.6 L23.7 56.3 C17.3 52.3 12.5 45.4 10.7 37.8 L7.2 23 L18.5 7.1 L19 7.5 C22.1 10.3 26.2 11.8 30.5 11.8 C34.9 11.8 38.9 10.3 42 7.5 L42.5 7.1 L53.8 23 L50.3 37.8 C48.5 45.4 43.7 52.3 37.4 56.3 L32.7 58.6 L30.5 59.7 Z"
				fill={PAPER}
				stroke={INK}
				strokeWidth="1"
			/>
			{/* inner echo line */}
			<path
				d="M25.4 52.6 C19.4 48.8 15.4 43.3 13.9 37 L10.7 23.7 L19.2 11.7 C21.6 14.5 27.8 15.7 27.8 15.7 L30.6 14.2 L33.5 15.7 C33.5 15.7 39.4 14.2 41.9 11.7 L50.3 23.7 L47.2 37 C45.7 43.3 41.6 48.8 35.7 52.6 L30.5 55.9 L25.4 52.6 Z"
				fill="none"
				stroke={FAINT}
				strokeWidth="0.6"
			/>
			{/* label pill */}
			<path
				d="M7.1 44.7 L54.2 44.7 C54.8 45.3 55.1 45.6 55.7 46.2 L55.7 52.5 C55.1 53.1 54.8 53.4 54.2 54 L7.1 54 C6.5 53.4 6.2 53.1 5.6 52.5 L5.6 46.2 C6.2 45.6 6.5 45.3 7.1 44.7"
				fill={STRONG}
			/>
		</svg>
	);
}

/** Small shield outline used for the 12 armor slots. Fills when marked. */
export function MiniShieldArt() {
	return (
		<svg className="df-cs-mini-shield-art" viewBox="3.4 4 11.5 12.7" aria-hidden="true">
			<path
				d="M9.2 16 L8.7 15.7 L7.7 15.3 C6.3 14.4 5.3 12.9 4.9 11.3 L4.2 8.3 L6.5 4.9 C6.6 4.8 6.8 4.8 6.9 4.8 C7.5 5.4 8.3 5.7 9.2 5.7 C10 5.7 10.9 5.4 11.5 4.8 C11.6 4.8 11.8 4.8 11.9 4.9 L14.2 8.3 L13.5 11.3 C13.1 12.9 12 14.4 10.7 15.3 L9.7 15.7 Z"
				fill={SLOT_FILL}
				stroke={INK}
				strokeWidth="0.7"
			/>
		</svg>
	);
}

/** Level crest badge (top-right of the header). */
export function LevelBadgeArt() {
	return (
		<svg className="df-cs-level-art" viewBox="0.1 11.1 56.1 54.6" aria-hidden="true">
			{/* side nub pill behind the crest */}
			<path
				d="M12.1 29.8 L49.2 29.8 C49.8 30.4 50.2 30.7 50.8 31.4 L50.8 42.9 C50.2 43.5 49.8 43.9 49.2 44.5 L12.1 44.5 C11.5 43.9 11.2 43.5 10.5 42.9 L10.5 31.4 C11.2 30.7 11.5 30.4 12.1 29.8"
				fill={INK}
			/>
			{/* crest body */}
			<path
				d="M30.7 64.7 C17 64.7 9.6 48.4 9.5 48.2 L9.1 47.2 L10 46.6 C11.1 46 13.1 43.4 13.6 37.3 C14 31.9 10.3 28 10.3 28 L10 27.6 L10 18.9 L11.1 18.9 C20.8 18.9 29.9 12.8 30 12.7 L30.7 12.2 L31.3 12.7 C31.4 12.8 40.5 18.9 50.2 18.9 L51.4 18.9 L51.4 27.6 L51 28 C51 28 47.3 32 47.7 37.3 C48.3 43.4 50.2 46 51.3 46.6 L52.2 47.2 L51.8 48.2 C51.7 48.4 44.4 64.7 30.7 64.7"
				fill={PAPER}
				stroke={INK}
				strokeWidth="1"
			/>
			{/* inner echo line */}
			<path
				d="M30.7 61.4 C21.3 61.4 15.2 51.8 13.3 48.2 C15.2 46.1 16.5 42.4 16.9 37.6 C17.4 32.1 14.5 27.9 13.3 26.3 L13.3 22.1 C21 21.5 27.8 17.9 30.7 16.2 C33.5 17.9 40.4 21.5 48 22.1 L48 26.3 C46.8 27.9 44 32.1 44.4 37.6 C44.8 42.4 46.1 46.1 48.1 48.2 C46.1 51.8 40 61.4 30.7 61.4 Z"
				fill="none"
				stroke={FAINT}
				strokeWidth="0.6"
			/>
			{/* LEVEL pill */}
			<path
				d="M7.2 51.3 L54.2 51.3 C54.8 51.9 55.1 52.3 55.7 52.9 L55.7 59.1 C55.1 59.7 54.8 60.1 54.2 60.7 L7.2 60.7 C6.5 60.1 6.2 59.7 5.6 59.1 L5.6 52.9 C6.2 52.3 6.5 51.9 7.2 51.3"
				fill={STRONG}
			/>
		</svg>
	);
}

/** Gold: handful - a coin seen from above with stacked echoes. */
export function GoldHandfulArt() {
	return (
		<svg className="df-cs-gold-art" viewBox="2.5 2.6 10.5 8.4" aria-hidden="true">
			<path
				d="M10.5 6.8 C10.5 8.9 8.8 10.5 6.8 10.5 C4.7 10.5 3 8.9 3 6.8 C3 4.7 4.7 3.1 6.8 3.1 C8.8 3.1 10.5 4.7 10.5 6.8 Z"
				fill={SLOT_FILL}
				stroke={MID}
				strokeWidth="0.7"
			/>
			<path
				d="M7.3 3.1 C9.1 3.4 10.5 4.9 10.5 6.8 C10.5 8.7 9.1 10.2 7.3 10.5 M8.3 3.1 C10.1 3.4 11.5 4.9 11.5 6.8 C11.5 8.7 10.1 10.2 8.3 10.5 M8.8 3.1 C10.9 3.1 12.5 4.7 12.5 6.8 C12.5 8.9 10.9 10.5 8.8 10.5"
				fill="none"
				stroke={MID}
				strokeWidth="0.7"
			/>
		</svg>
	);
}

/** Gold: money bag. */
export function GoldBagArt() {
	return (
		<svg className="df-cs-gold-art" viewBox="2.6 4 10.9 13.6" aria-hidden="true">
			<path
				d="M8.2 17 C7.8 17 7.3 17 7 17 C6.9 17 6.8 17 6.8 17 C6.2 16.9 5.5 16.9 4.9 16.7 C4.1 16.5 3.7 16.2 3.4 15.6 C3.1 14.7 3.2 13.7 3.6 12.5 C4 11.6 4.6 10.7 5.3 9.9 C5.5 9.7 5.7 9.5 5.9 9.3 C6.3 9 6.6 8.7 6.9 8.5 C7 8.5 7 8.4 6.9 8.3 L5.7 6.8 C5.6 6.7 5.5 6.6 5.5 6.4 C5.5 5.9 6.3 5.5 6.5 5.4 C6.5 5.3 6.5 5.1 6.5 5 C6.9 4.6 7.8 4.5 8.2 4.5 C8.7 4.5 9.6 4.6 10 5 C10 5 10 5.1 10 5.2 L9.9 5.5 C10 5.5 10.1 5.6 10.2 5.7 C10.4 5.8 10.5 6 10.6 6.3 C10.6 6.5 10.5 6.7 10.4 6.9 L9.2 8.2 C9.1 8.3 9.1 8.4 9.2 8.5 C10.3 9.2 11.6 10.9 12 11.6 C12.3 12.2 12.6 12.7 12.8 13.3 C13 14.3 12.9 15.2 12.6 15.8 C12.2 16.3 11.7 16.7 11 16.8 C10.1 17 8.7 17 8.2 17 Z"
				fill={SLOT_FILL}
				stroke={MID}
				strokeWidth="0.7"
			/>
		</svg>
	);
}

/** Gold: treasure chest. */
export function GoldChestArt() {
	return (
		<svg className="df-cs-gold-art df-cs-gold-chest-art" viewBox="1.5 2.3 15.3 15.2" aria-hidden="true">
			{/* chest body silhouette */}
			<path
				d="M14.7 2.8 L3.6 2.8 C3.3 2.8 2.9 3 2.8 3.3 C2.4 3.9 2 5 2 6.8 L2 7.3 C2 7.5 2.1 7.6 2.2 7.8 C2.1 7.9 2 8.1 2 8.2 L2 16.3 C2 16.7 2.4 17 2.7 17 L15.6 17 C16 17 16.3 16.7 16.3 16.3 L16.3 8.2 C16.3 8.1 16.2 7.9 16.1 7.8 C16.2 7.6 16.3 7.5 16.3 7.3 L16.3 6.8 C16.3 5 15.9 3.9 15.6 3.3 C15.4 3 15.1 2.8 14.7 2.8"
				fill={SLOT_FILL}
				stroke={MID}
				strokeWidth="0.7"
			/>
			{/* lid slats and lock */}
			<path d="M3.5 12.5 L14.9 12.5 L14.9 13.9 L3.5 13.9 Z" fill={MID} />
			<path
				d="M10.4 10.4 C10.4 10.6 10.1 10.9 9.9 10.9 L8.5 10.9 C8.2 10.9 8 10.6 8 10.4 L8 8 L10.4 8 Z"
				fill={MID}
			/>
			<path
				d="M10.8 10.6 L14.9 10.6 L14.9 12 L3.5 12 L3.5 10.6 L7.5 10.6 C7.6 11 8 11.3 8.5 11.3 L9.9 11.3 C10.3 11.3 10.7 11 10.8 10.6"
				fill={MID}
			/>
			<path d="M14.3 15.6 L4.1 15.6 C3.9 15.4 3.7 15.2 3.5 15 L3.5 14.4 L14.9 14.4 L14.9 15 C14.6 15.2 14.4 15.4 14.3 15.6" fill={MID} />
			<path d="M14.9 6.6 L3.5 6.6 C3.5 6.1 3.5 5.6 3.6 5.2 L14.7 5.2 C14.8 5.6 14.9 6.1 14.9 6.6" fill={MID} />
			<path d="M3.7 4.7 C3.8 4.2 4 3.7 4.3 3.3 L14 3.3 C14.3 3.7 14.5 4.2 14.6 4.7 Z" fill={MID} />
		</svg>
	);
}

/** Open-palm hand icon used for weapon burden marks. */
export function HandArt() {
	return (
		<svg className="df-cs-hand-art" viewBox="0.9 -0.1 17 21.4" aria-hidden="true">
			<path
				d="M6.8 19.1 L5.1 17.6 C4.6 17.2 4.2 16.6 4 16 L2.7 11.9 L1.9 6.4 C1.9 5.9 2.2 5.4 2.7 5.2 L3.5 5 L3.3 3.8 C3.2 3.2 3.5 2.7 4 2.5 L5.3 2.2 L5.2 1.9 L5.3 1.7 C5.4 1.5 5.6 1.4 5.8 1.3 L6.9 1 C7 0.9 7.1 0.9 7.2 0.9 C7.6 0.9 8 1.1 8.1 1.5 L8.3 2.1 L9.3 1.8 C9.4 1.7 9.5 1.7 9.7 1.7 C10.1 1.7 10.5 2 10.7 2.4 L13.7 10.1 L14.5 8.3 C14.7 8 15 7.9 15.1 7.9 C15.2 7.8 15.3 7.8 15.4 7.8 C15.6 7.8 15.7 7.8 15.9 7.9 L16.4 8.3 C16.8 8.5 17 9 16.9 9.4 L15.1 15.1 C15 15.5 14.8 15.9 14.5 16.3 L13.9 17 L14.2 18.1 L7.2 20.2 Z"
				fill={SLOT_FILL}
				stroke={INK}
				strokeWidth="0.8"
			/>
			{/* finger separations */}
			<path
				d="M3.4 5.5 L4.6 10.2 L5.2 10 L3.9 4.9 M5.2 2.7 L7 9.5 L7.6 9.3 L5.7 2.2 M7.7 1.7 L9.9 8.6 L10.5 8.4 L8.7 2.5 M13.3 10.5 C13.4 10.7 13.5 10.7 13.6 10.8 C13.8 10.8 13.9 10.7 13.9 10.6 L14.9 8.5"
				fill="none"
				stroke={INK}
				strokeWidth="0.6"
			/>
		</svg>
	);
}

/** Hope slot - a rounded diamond that fills with ink when marked. */
export function HopeDiamondArt() {
	return (
		<svg className="df-cs-hope-diamond-art" viewBox="0.4 1.4 14.7 15" aria-hidden="true">
			<path
				d="M14.3 9.8 L8.6 15.4 C8.1 15.9 7.4 15.9 6.9 15.4 L1.2 9.8 C0.8 9.3 0.8 8.5 1.2 8 L6.9 2.4 C7.4 1.9 8.1 1.9 8.6 2.4 L14.3 8 C14.7 8.5 14.7 9.3 14.3 9.8"
				fill={SLOT_FILL}
			/>
		</svg>
	);
}

/** Small arrow between damage-threshold blocks. */
export function ThresholdArrowArt() {
	return (
		<svg className="df-cs-threshold-arrow-art" viewBox="77.4 5.7 8 15.1" aria-hidden="true">
			<path d="M77.8 20.4 L77.8 6.1 L84.9 13.3 Z" fill={PAPER} />
			<path d="M78.1 17.1 L78.1 9.5 L81.9 13.3 Z" fill={INK} />
		</svg>
	);
}

/** Grey stepped wedge at the right end of each experience row. */
export function ExperienceCapArt() {
	return (
		<svg className="df-cs-exp-cap-art" viewBox="4.3 2.7 41.8 5.5" preserveAspectRatio="none" aria-hidden="true">
			<path
				d="M42.4 2.7 L38.7 6.3 L16.8 6.3 C15.3 4.9 14.2 3.8 13.1 2.7 L9.8 2.7 L4.3 8.2 L46.1 8.2 L46.1 2.7 Z"
				fill={MID}
			/>
		</svg>
	);
}
