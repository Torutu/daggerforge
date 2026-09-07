// Review aid, not a substitute for comparing rules with the English source.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");

function files(dir, suffix) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory()
			? files(full, suffix)
			: suffix.test(full)
				? [full]
				: [];
	});
}

function suspiciousText(value) {
	// Multiword phrases avoid flagging names such as Hope & Fear or Storm.
	const reasons = [];
	if (
		/\b(?:you (?:can|may|must|have)|the target|on a (?:success|failure)|until (?:your|their)|spend a hope|mark a stress|once per (?:scene|session|rest))\b/i.test(
			value,
		)
	)
		reasons.push("English rule phrase");
	if (
		/\b(?:[Vv]erwenden|[Mm]arkieren|[Gg]eben|[Mm]achen|[Bb]itten|[Hh]andeln) Sie\b/.test(
			value,
		)
	)
		reasons.push("inconsistent formal imperative");
	if (/ZXQ|\uFFFD|\(Deutscher\)/.test(value))
		reasons.push("damaged text or translation artifact");
	return reasons;
}

function audit() {
	const findings = [];
	const add = (file, location, reason, text) =>
		findings.push({
			file: path.relative(root, file),
			location,
			reason,
			text,
		});
	for (const dir of ["src/data/srd/locales/de", "src/data/locales/de"]) {
		for (const file of files(path.join(root, dir), /\.json$/)) {
			function visit(value, location) {
				if (typeof value === "string") {
					for (const reason of suspiciousText(value))
						add(file, location, reason, value);
				} else if (value && typeof value === "object") {
					for (const [key, child] of Object.entries(value))
						visit(child, `${location}.${key}`);
				}
			}
			visit(JSON.parse(fs.readFileSync(file, "utf8")), "$");
		}
	}
	const names = new Set([
		"DaggerForge",
		"Daggerheart",
		"Daggerheart © Darrington Press 2025",
	]);
	const uiSources = ["src/features", "src/utils"].flatMap((dir) =>
		files(path.join(root, dir), /\.tsx?$/),
	);
	uiSources.push(path.join(root, "src/data/levelUpGuide.ts"));
	for (const file of uiSources) {
		const source = ts.createSourceFile(
			file,
			fs.readFileSync(file, "utf8"),
			ts.ScriptTarget.Latest,
			true,
		);
		function visit(node) {
			let value;
			if (ts.isJsxText(node))
				value = node.text.replace(/\s+/g, " ").trim();
			if (ts.isStringLiteral(node)) {
				const parent = node.parent;
				if (
					ts.isJsxAttribute(parent) &&
					/^(title|placeholder|aria-label|label|alt|hint|actionLabel)$/.test(
						parent.name.text,
					)
				)
					value = node.text;
				if (
					ts.isPropertyAssignment(parent) &&
					/^(text|label|title|placeholder|message|confirmLabel|cancelLabel)$/.test(
						parent.name.getText(source),
					)
				)
					value = node.text;
				if (
					ts.isCallExpression(parent) &&
					/\.(setName|setDesc|setTitle|setTooltip|setButtonText|setPlaceholder|setText)$/.test(
						parent.expression.getText(source),
					)
				)
					value = node.text;
			}
			if (
				value &&
				/[a-zA-Z]/.test(value) &&
				!names.has(value) &&
				!/^wizard\.step\./.test(value)
			) {
				add(
					file,
					source.getLineAndCharacterOfPosition(node.getStart(source))
						.line + 1,
					"unlocalized static UI text",
					value,
				);
			}
			ts.forEachChild(node, visit);
		}
		visit(source);
	}
	return findings;
}

if (require.main === module) {
	const findings = audit();
	if (process.argv.includes("--json"))
		console.log(JSON.stringify(findings, null, 2));
	else {
		for (const f of findings)
			console.log(
				`${f.file}:${f.location}: ${f.reason}: ${f.text.slice(0, 180)}`,
			);
		console.log(
			`${findings.length} findings requiring review. Dynamic templates and semantic mistranslations require manual review.`,
		);
	}
	process.exitCode = findings.length ? 1 : 0;
}
module.exports = { suspiciousText, audit };
