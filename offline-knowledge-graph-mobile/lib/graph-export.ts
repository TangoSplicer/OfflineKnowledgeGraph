import type { Concept, Connection } from "./knowledge-data";

export type GraphExportOptions = {
  title?: string;
  subtitle?: string;
  focusId?: string;
};

type Point = { x: number; y: number };

const POSITIONS: Record<string, Point> = {
  "adaptive-systems": { x: 0.5, y: 0.52 },
  "feedback-loops": { x: 0.78, y: 0.27 },
  "cognitive-load": { x: 0.2, y: 0.7 },
  "boundary-conditions": { x: 0.74, y: 0.76 },
  "donella-meadows": { x: 0.17, y: 0.24 },
};

const fallbackPosition = (index: number): Point => ({ x: 0.18 + ((index * 0.23) % 0.64), y: 0.23 + ((index * 0.31) % 0.54) });
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;

export function graphExportPositions(concepts: Concept[], width = 1200, height = 760) {
  return new Map(concepts.map((concept, index) => {
    const normalized = POSITIONS[concept.id] ?? fallbackPosition(index);
    return [concept.id, { x: normalized.x * width, y: normalized.y * height }];
  }));
}

export function buildGraphSvg(concepts: Concept[], connections: Connection[], options: GraphExportOptions = {}) {
  const width = 1200;
  const height = 760;
  const positions = graphExportPositions(concepts, width, height);
  const focusId = options.focusId ?? "adaptive-systems";
  const edges = connections.map((connection) => {
    const source = positions.get(connection.sourceId);
    const target = positions.get(connection.targetId);
    if (!source || !target) return "";
    const highlighted = Boolean(connection.note);
    return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="${highlighted ? "#48D6E8" : "#7184B3"}" stroke-width="${highlighted ? 4 : 2}" opacity="${0.25 + connection.strength * 0.12}" data-relationship="${escapeXml(connection.relationship)}" data-note="${escapeXml(connection.note)}" />`;
  }).join("");
  const nodes = concepts.map((concept) => {
    const point = positions.get(concept.id);
    if (!point) return "";
    const radius = concept.id === focusId ? 66 : 43;
    return `<g data-concept-id="${escapeXml(concept.id)}"><circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${escapeXml(concept.color)}" stroke="${concept.id === focusId ? "#FFFFFF" : "#182542"}" stroke-width="${concept.id === focusId ? 4 : 3}" /><text x="${point.x}" y="${point.y + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${concept.id === focusId ? 22 : 16}" font-weight="700" fill="${concept.id === focusId ? "#FFFFFF" : "#08101D"}">${escapeXml(truncate(concept.title, 18))}</text></g>`;
  }).join("");
  const title = escapeXml(options.title ?? "Offline Knowledge Graph");
  const subtitle = escapeXml(options.subtitle ?? `${concepts.length} concepts · ${connections.length} filtered relationships`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description"><title id="title">${title}</title><desc id="description">${subtitle}</desc><rect width="${width}" height="${height}" rx="42" fill="#0B1020" /><circle cx="600" cy="390" r="250" fill="none" stroke="#2D3867" stroke-width="2" opacity="0.7" /><text x="54" y="68" fill="#48D6E8" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3">${title.toUpperCase()}</text><text x="54" y="104" fill="#AEBBD1" font-family="Arial, sans-serif" font-size="18">${subtitle}</text>${edges}${nodes}<text x="54" y="712" fill="#7887A4" font-family="Arial, sans-serif" font-size="14">Highlighted lines include relationship notes · Exported locally</text></svg>`;
}
