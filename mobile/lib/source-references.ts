export function normalizeSourceUrls(values: string[] | undefined): string[] {
  const candidates = (values ?? []).flatMap((value) => value.split(/[\n,]+/)).map((value) => value.trim()).filter(Boolean);
  const accepted: string[] = [];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if ((parsed.protocol === "https:" || parsed.protocol === "http:") && !accepted.includes(parsed.toString())) accepted.push(parsed.toString());
    } catch { /* Ignore invalid local input until it is corrected. */ }
  }
  return accepted.slice(0, 12);
}

export const sourceUrlsFromText = (value: string) => normalizeSourceUrls(value.split(/[\n,]+/));
export const sourceUrlsToText = (urls: string[] | undefined) => normalizeSourceUrls(urls).join("\n");
export const sourceHost = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
export const normalizeSourceAnnotation = (value: string | undefined) => (value ?? "").trim().slice(0, 900);
export const normalizeSourceQuote = (value: string | undefined) => (value ?? "").trim().slice(0, 1_200);
