import type { Concept } from "@/lib/knowledge-data";

type SearchField = "title" | "kind" | "summary" | "note";

type IndexedConcept = {
  concept: Concept;
  normalized: Record<SearchField, string>;
};

export type ConceptSearchHit = {
  concept: Concept;
  score: number;
  matchedTerms: string[];
  matchedFields: SearchField[];
  snippet: string;
};

const FIELD_WEIGHTS: Record<SearchField, number> = {
  title: 18,
  kind: 6,
  summary: 5,
  note: 4,
};

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const termsFor = (query: string) => Array.from(new Set(normalize(query).split(" ").filter(Boolean)));

const tokenMatchScore = (content: string, term: string) => {
  const tokens = content.split(" ");
  const exact = tokens.filter((token) => token === term).length;
  const prefix = tokens.filter((token) => token !== term && token.startsWith(term)).length;
  return exact * 2 + prefix;
};

function makeSnippet(concept: Concept, fields: SearchField[], query: string) {
  const preferred = fields.includes("note") ? concept.note : fields.includes("summary") ? concept.summary : concept.summary;
  const normalizedQuery = normalize(query);
  const position = normalize(preferred).indexOf(normalizedQuery);
  if (position < 0 || preferred.length <= 112) return preferred;
  const start = Math.max(0, position - 28);
  const end = Math.min(preferred.length, position + normalizedQuery.length + 66);
  return `${start > 0 ? "…" : ""}${preferred.slice(start, end).trim()}${end < preferred.length ? "…" : ""}`;
}

export function createConceptSearchIndex(concepts: Concept[]): IndexedConcept[] {
  return concepts.map((concept) => ({
    concept,
    normalized: {
      title: normalize(concept.title),
      kind: normalize(concept.kind),
      summary: normalize(concept.summary),
      note: normalize(concept.note),
    },
  }));
}

export function searchConceptIndex(index: IndexedConcept[], query: string, limit = 20): ConceptSearchHit[] {
  const terms = termsFor(query);
  if (!terms.length) {
    return index.map(({ concept }) => ({
      concept,
      score: 0,
      matchedTerms: [],
      matchedFields: [],
      snippet: concept.summary,
    }));
  }

  const normalizedPhrase = normalize(query);
  return index
    .map(({ concept, normalized }) => {
      let score = 0;
      const matchedTerms = new Set<string>();
      const matchedFields = new Set<SearchField>();

      (Object.keys(normalized) as SearchField[]).forEach((field) => {
        const content = normalized[field];
        const phrasePosition = content.indexOf(normalizedPhrase);
        if (phrasePosition >= 0) {
          score += FIELD_WEIGHTS[field] * 3;
          matchedFields.add(field);
        }
        terms.forEach((term) => {
          const tokenScore = tokenMatchScore(content, term);
          if (tokenScore > 0) {
            score += FIELD_WEIGHTS[field] * tokenScore;
            matchedTerms.add(term);
            matchedFields.add(field);
          }
        });
      });

      const completeMatchBonus = matchedTerms.size === terms.length ? terms.length * 9 : 0;
      score += completeMatchBonus;
      const fields = Array.from(matchedFields);
      return {
        concept,
        score,
        matchedTerms: Array.from(matchedTerms),
        matchedFields: fields,
        snippet: makeSnippet(concept, fields, query),
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || b.matchedTerms.length - a.matchedTerms.length || a.concept.title.localeCompare(b.concept.title))
    .slice(0, limit);
}
