// Renders the two identical-layout profile cards (this:matters, EmDash) as SVG.
// Both cards share one template so they always have the same size and look.

const W = 440;
const H = 300;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @param {{ id: string, eyebrow: string, title: string, lines: string[],
 *           tiles: { value: string, label: string }[], link: string, accent: string }} card
 */
export function renderCard({ id, eyebrow, title, lines, tiles, link, accent }) {
	const gap = 12;
	const tileW = (W - 48 - (tiles.length - 1) * gap) / tiles.length;
	const tileSvg = tiles
		.map(
			(t, i) => `
    <g transform="translate(${24 + i * (tileW + gap)} 172)">
      <rect width="${tileW}" height="68" rx="12" fill="#fff" fill-opacity=".05" stroke="#fff" stroke-opacity=".10"/>
      <text x="14" y="32" font-size="${t.value.length > 6 ? 17 : 22}" font-weight="700" fill="#fff">${esc(t.value)}</text>
      <text x="14" y="52" font-size="12" fill="#9d97b3">${esc(t.label)}</text>
    </g>`,
		)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t">
  <title id="${id}-t">${esc(title)} — ${esc(eyebrow)}</title>
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#110c1f"/><stop offset="1" stop-color="#0c0916"/></linearGradient>
    <radialGradient id="${id}-glow"><stop offset="0" stop-color="${accent}" stop-opacity=".45"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}-c"><rect width="${W}" height="${H}" rx="18"/></clipPath>
    <style>text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif; }</style>
  </defs>
  <g clip-path="url(#${id}-c)">
    <rect width="${W}" height="${H}" fill="url(#${id}-bg)"/>
    <circle cx="${W - 30}" cy="20" r="170" fill="url(#${id}-glow)"/>
    <rect width="${W}" height="3" fill="${accent}"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#fff" stroke-opacity=".12"/>
  <text x="24" y="44" font-size="12" font-weight="600" fill="${accent}" letter-spacing="1.6">${esc(eyebrow)}</text>
  <text x="24" y="84" font-size="32" font-weight="800" fill="#fff" letter-spacing="-1">${esc(title)}</text>
  ${lines.map((l, i) => `<text x="24" y="${118 + i * 22}" font-size="15" fill="#c4bfd6">${esc(l)}</text>`).join("\n  ")}
  ${tileSvg}
  <text x="24" y="274" font-size="14" font-weight="600" fill="#fff">${esc(link)} <tspan fill="${accent}">→</tspan></text>
</svg>
`;
}

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

export const thismattersCard = () =>
	renderCard({
		id: "tm",
		eyebrow: "FOUNDER & CEO · SINCE 2023",
		title: "this:matters",
		lines: ["Swiss web & marketing agency. WordPress sites,", "WooCommerce shops and hosting on Cloudflare."],
		tiles: [
			{ value: "WordPress", label: "sites & shops" },
			{ value: "Cloudflare", label: "edge hosting" },
			{ value: "EmDash", label: "migrations" },
		],
		link: "thismatters.agency",
		accent: "#8b5cff",
	});

/** @param {{ merged: number, stars: number, forks: number }} stats */
export const emdashCard = ({ merged, stars, forks }) =>
	renderCard({
		id: "ed",
		eyebrow: "MAINTAINER · SINCE 2026",
		title: "EmDash",
		lines: ["The open-source successor to WordPress.", "TypeScript on Astro, Workers, D1 and R2."],
		tiles: [
			{ value: String(merged), label: "merged PRs" },
			{ value: compact(stars), label: "GitHub stars" },
			{ value: compact(forks), label: "forks" },
		],
		link: "emdashcms.com",
		accent: "#e83ade",
	});
