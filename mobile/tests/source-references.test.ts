import { describe, expect, it } from "vitest";

import { normalizeSourceAnnotation, normalizeSourceQuote, normalizeSourceUrls, sourceHost, sourceUrlsFromText, sourceUrlsToText } from "../lib/source-references";

describe("local source references", () => {
  it("keeps unique http sources and excludes malformed or unsupported values", () => {
    expect(normalizeSourceUrls(["https://example.com/a", "bad-link", "https://example.com/a", "ftp://example.com/file"])).toEqual(["https://example.com/a"]);
    expect(sourceUrlsFromText("https://one.example\nhttp://two.example")).toEqual(["https://one.example/", "http://two.example/"]);
  });

  it("creates readable hosts and an editable line-separated representation", () => {
    expect(sourceHost("https://www.example.com/path")).toBe("example.com");
    expect(sourceUrlsToText(["https://example.com/a", "https://two.example/"])).toContain("https://example.com/a");
  });

  it("bounds locally saved reading notes and quotations", () => {
    expect(normalizeSourceAnnotation("  A useful observation  ")).toBe("A useful observation");
    expect(normalizeSourceQuote("  A short quotation  ")).toBe("A short quotation");
  });
});
