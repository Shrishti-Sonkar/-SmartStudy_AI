/**
 * Query Classifier - Deterministic 5-Mode Routing
 *
 * Extended to support Research and Vision modalities.
 * Classification is purely rule-based — NO LLM calls.
 *
 * Rules (in priority order):
 *   1. Vision   — query starts with image-generation prefixes (absolute override)
 *   2. Research — query contains research-intent keywords
 *   3. Recall   — starts with "what is" / "define"
 *   4. Explanation — starts with "explain" / "why" / "how"
 *   5. Deep Reasoning — contains analytical keywords
 *   6. Default  — explanation
 */

export type QueryType = 'recall' | 'explanation' | 'deep_reasoning' | 'research' | 'vision';

// ── Absolute override prefixes for Vision modality ──────────────────────────
const VISION_PREFIXES = ['generate an image', 'create an image', 'draw'];

// ── High-weight keywords that signal Research intent ────────────────────────
const RESEARCH_KEYWORDS = ['research', 'paper', 'study', 'cite', 'latest'];

/**
 * Classifies a question into one of five query types.
 *
 * @param question - The user's question (will be normalized)
 * @returns QueryType - The determined category
 */
export function classifyQuery(question: string): QueryType {
    const normalized = question.trim().toLowerCase();

    // ── Rule 1: Vision (absolute modality override) ──────────────────────────
    if (VISION_PREFIXES.some(prefix => normalized.startsWith(prefix))) {
        return 'vision';
    }

    // ── Rule 2: Research (keyword-based, high weight) ────────────────────────
    if (RESEARCH_KEYWORDS.some(kw => normalized.includes(kw))) {
        return 'research';
    }

    // ── Rule 3: Recall — short factual / definition queries ──────────────────
    if (normalized.startsWith('what is') || normalized.startsWith('define')) {
        return 'recall';
    }

    // ── Rule 4: Explanation — conceptual understanding ───────────────────────
    if (
        normalized.startsWith('explain') ||
        normalized.startsWith('why') ||
        normalized.startsWith('how')
    ) {
        return 'explanation';
    }

    // ── Rule 5: Deep Reasoning — analytical / multi-step ────────────────────
    if (
        normalized.includes('compare') ||
        normalized.includes('analyze') ||
        normalized.includes('solve') ||
        normalized.includes('derive')
    ) {
        return 'deep_reasoning';
    }

    // ── Default: treat as explanation ────────────────────────────────────────
    return 'explanation';
}

/**
 * Get a human-readable description of the query type
 */
export function getQueryTypeDescription(type: QueryType): string {
    switch (type) {
        case 'recall':
            return 'Factual recall — short definition or fact';
        case 'explanation':
            return 'Conceptual explanation — understanding principles';
        case 'deep_reasoning':
            return 'Deep reasoning — analytical or multi-step problem';
        case 'research':
            return 'Research mode — summarised answer with source references';
        case 'vision':
            return 'Vision mode — image generation (simulated for MVP)';
        default:
            return 'Unknown query type';
    }
}
