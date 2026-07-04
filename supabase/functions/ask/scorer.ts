/**
 * Score-Based Deterministic Router (Feature 3)
 *
 * Upgrades routing from simple if-else to a rule-based scoring system.
 * Rules are human-readable constants. No ML, no embeddings.
 *
 * Scoring Signals:
 *   - Vision prefixes    → absolute override (+10 to vision, prevents any other tier)
 *   - Research keywords  → high weight (+5 to research per matching keyword, max 3)
 *   - Analytical keywords → high weight (+4 to deep_reasoning)
 *   - Explanation starters → high weight (+4 to explanation)
 *   - Recall starters    → high weight (+4 to recall)
 *   - Query length       → medium weight
 *   - Reasoning depth    → high weight (step/proof/calculate/derive)
 */

import { QueryType } from './classifier.ts';

export interface RoutingScores {
    recall: number;
    explanation: number;
    deep_reasoning: number;
    research: number;
    vision: number;
}

export interface ScoringResult {
    scores: RoutingScores;
    winner: QueryType;
    reason: string;
}

// ── Absolute-override prefixes (Vision always wins) ──────────────────────────
const VISION_PREFIXES = ['generate an image', 'create an image', 'draw'];

// ── Research keyword list ────────────────────────────────────────────────────
const RESEARCH_KEYWORDS = ['research', 'paper', 'study', 'cite', 'latest'];

// ── Depth-signalling keywords (raise deep_reasoning score) ──────────────────
const DEPTH_KEYWORDS = ['step', 'proof', 'derive', 'calculate', 'prove', 'deduce'];

// ── Analytical keywords ──────────────────────────────────────────────────────
const ANALYTICAL_KEYWORDS = ['compare', 'analyze', 'analyse', 'solve', 'derive'];

/**
 * Scores a query against all tiers and returns the winning tier + reasoning.
 *
 * @param question - Raw user question
 * @returns ScoringResult with per-tier scores, winning tier, and explanation
 */
export function scoreQuery(question: string): ScoringResult {
    const normalized = question.trim().toLowerCase();
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    const scores: RoutingScores = {
        recall: 0,
        explanation: 0,
        deep_reasoning: 0,
        research: 0,
        vision: 0,
    };

    const reasons: string[] = [];

    // ── SIGNAL 1: Vision absolute override (+10, prevents all others) ─────────
    if (VISION_PREFIXES.some(prefix => normalized.startsWith(prefix))) {
        scores.vision += 10;
        reasons.push('Vision prefix detected (absolute override)');
        // Return immediately — vision always wins
        return {
            scores,
            winner: 'vision',
            reason: reasons.join('; '),
        };
    }

    // ── SIGNAL 2: Research keywords (+5 each, capped at 3 matches) ───────────
    const researchMatches = RESEARCH_KEYWORDS.filter(kw => normalized.includes(kw));
    if (researchMatches.length > 0) {
        const boost = Math.min(researchMatches.length, 3) * 5;
        scores.research += boost;
        reasons.push(`Research keywords found: [${researchMatches.join(', ')}] (+${boost})`);
    }

    // ── SIGNAL 3: Recall starters (+4) ───────────────────────────────────────
    if (normalized.startsWith('what is') || normalized.startsWith('define')) {
        scores.recall += 4;
        reasons.push('Recall starter detected (+4 recall)');
    }

    // ── SIGNAL 4: Explanation starters (+4) ──────────────────────────────────
    if (
        normalized.startsWith('explain') ||
        normalized.startsWith('why') ||
        normalized.startsWith('how')
    ) {
        scores.explanation += 4;
        reasons.push('Explanation starter detected (+4 explanation)');
    }

    // ── SIGNAL 5: Analytical keywords (+4 to deep_reasoning) ─────────────────
    const analyticalMatches = ANALYTICAL_KEYWORDS.filter(kw => normalized.includes(kw));
    if (analyticalMatches.length > 0) {
        scores.deep_reasoning += 4;
        reasons.push(`Analytical keywords: [${analyticalMatches.join(', ')}] (+4 deep_reasoning)`);
    }

    // ── SIGNAL 6: Query length (medium weight) ────────────────────────────────
    if (wordCount < 6) {
        scores.recall += 2;
        reasons.push(`Short query (${wordCount} words) (+2 recall)`);
    } else if (wordCount <= 20) {
        scores.explanation += 1;
        reasons.push(`Medium-length query (${wordCount} words) (+1 explanation)`);
    } else {
        scores.deep_reasoning += 2;
        reasons.push(`Long query (${wordCount} words) (+2 deep_reasoning)`);
    }

    // ── SIGNAL 7: Reasoning depth keywords (+2 to deep_reasoning) ────────────
    const depthMatches = DEPTH_KEYWORDS.filter(kw => normalized.includes(kw));
    if (depthMatches.length > 0) {
        scores.deep_reasoning += 2;
        reasons.push(`Depth keywords: [${depthMatches.join(', ')}] (+2 deep_reasoning)`);
    }

    // ── Determine winner (highest score wins; ties → explanation) ─────────────
    const entries = Object.entries(scores) as [QueryType, number][];
    const [winner] = entries.reduce((best, current) =>
        current[1] > best[1] ? current : best
    );

    const winnerScore = scores[winner];
    reasons.push(`Winner: "${winner}" with score ${winnerScore}`);

    return {
        scores,
        winner,
        reason: reasons.join('; '),
    };
}
