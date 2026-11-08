// Refreshes the dynamic parts of the profile: the two SVG cards and the
// "Right now" lists in README.md. Runs in GitHub Actions; Node 20+, no deps.
import { readFile, writeFile } from "node:fs/promises";
import { emdashCard, thismattersCard } from "./cards.mjs";

const ROOT = new URL("../", import.meta.url);
const USER = "swissky";
const GH_HEADERS = {
	Accept: "application/vnd.github+json",
	...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

const decode = (s) =>
	s
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.trim();

const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "");

const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

async function rss(url, limit) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url}: ${res.status}`);
	const xml = await res.text();
	return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit).map(([, item]) => ({
		title: tag(item, "title"),
		link: tag(item, "link"),
		date: tag(item, "pubDate"),
	}));
}

async function gh(path) {
	const res = await fetch(`https://api.github.com/${path}`, { headers: GH_HEADERS });
	if (!res.ok) throw new Error(`GitHub ${path}: ${res.status}`);
	return res.json();
}

const search = (q, extra = "") => gh(`search/issues?q=${encodeURIComponent(q)}${extra}`);

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const truncate = (s, max = 64) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// One line per entry: a fixed-width chip (date or PR number), then the linked title.
const entry = (chip, title, link, max) =>
	`<code>${escapeHtml(chip)}</code>&nbsp; <a href="${link}">${escapeHtml(truncate(title, max))}</a>`;

const sections = {
	blog: async () =>
		(await rss("https://kevinkyburz.ch/rss.xml", 4))
			.map((p) => {
				// Each post exists in English (/blog/…) and German (/de/blog/…).
				const de = p.link.replace("https://kevinkyburz.ch/blog/", "https://kevinkyburz.ch/de/blog/");
				return `${entry(shortDate(p.date), p.title, p.link, 56)} <sub><a href="${p.link}">EN</a> · <a href="${de}">DE</a></sub>`;
			})
			.join("<br />\n"),
	prs: async () => {
		const { items } = await search(`org:emdash-cms author:${USER} is:pr is:merged`, "&sort=updated&per_page=4");
		return items
			.map((pr) => entry(`#${pr.number}`, capitalize(pr.title.replace(/^\w+(\([^)]*\))?:\s*/, "")), pr.html_url))
			.join("<br />\n");
	},
};

let readme = await readFile(new URL("README.md", ROOT), "utf8");

for (const [name, render] of Object.entries(sections)) {
	try {
		const body = await render();
		readme = readme.replace(
			new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`),
			`$1\n${body}\n$2`,
		);
	} catch (err) {
		// Keep the previous content when a source is down.
		console.warn(`Skipping ${name}: ${err.message}`);
	}
}

await writeFile(new URL("README.md", ROOT), readme);
await writeFile(new URL("assets/card-thismatters.svg", ROOT), thismattersCard());

try {
	const [merged, repo] = await Promise.all([
		search(`org:emdash-cms author:${USER} is:pr is:merged`),
		gh("repos/emdash-cms/emdash"),
	]);
	await writeFile(
		new URL("assets/card-emdash.svg", ROOT),
		emdashCard({ merged: merged.total_count, stars: repo.stargazers_count, forks: repo.forks_count }),
	);
} catch (err) {
	console.warn(`Skipping EmDash card: ${err.message}`);
}
