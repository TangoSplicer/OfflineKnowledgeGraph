export const clampEvidenceConfidence = (value: number | undefined) => Math.max(1, Math.min(5, Math.round(value ?? 3)));
export const evidenceConfidenceLabel = (value: number | undefined) => ["Tentative", "Emerging", "Grounded", "Well supported", "High confidence"][clampEvidenceConfidence(value) - 1];
export const evidenceConfidenceColor = (value: number | undefined) => ["#FF9EAE", "#FFB86B", "#BEB8FF", "#48D6E8", "#63D2A3"][clampEvidenceConfidence(value) - 1];
export const confidenceDots = (value: number | undefined) => [1, 2, 3, 4, 5].map((dot) => dot <= clampEvidenceConfidence(value));
