/**
 * Model Router - Maps Query Types to Models, Prompts, and Settings
 * 
 * This module handles model selection and prompt engineering based on query classification.
 */

import { QueryType } from './classifier.ts';
// QueryType now includes 'research' | 'vision' — imported automatically

export interface ModelSelection {
    model: string;
    tier: string;
    routingReason: string;
    systemPrompt: string;
    temperature: number;
    maxTokens?: number;
    provider: 'groq' | 'openai';
}

const CITATION_INSTRUCTIONS = `

CITATION REQUIREMENTS:
- For every fact, definition, or statistic, provide a reliable reference
- Do NOT use inline citations (like [1]) in the answer text. Keep the text clean.
- Include a "References" section at the end of your answer.
- Format references as: Author(s), "Title," Source, Year, URL/DOI
- Only cite sources that are verifiable and authoritative.
`;

const METADATA_INSTRUCTIONS = `
---
Based on the answer provided, generate structured reference metadata.

Instructions:
1. Reliability Status:
   - "Verified Analytical" (if step-by-step logic used)
   - "Conceptually Verified" (if explanation-based)
   - "Fact-Based Response" (if short recall)

2. Curriculum Coverage:
   - Identify Subject > Topic > Subtopic

3. Key Concepts Covered:
   - List 3–6 important concepts.

4. Suggested Reference Type:
   - Mention standard textbook category (e.g., NCERT Physics, Undergraduate Mechanics).

Output format:
---
Reliability Status: <value>

Curriculum Coverage:
<Subject > Topic > Subtopic>

Key Concepts Covered:
- Concept 1
- Concept 2

Suggested Reference Type:
<Reference category>
---`;

/**
 * FAST RECALL PROMPT
 */
const RECALL_PROMPT = `You are a high-speed factual recall engine.
Instructions:
- Answer in 1–3 concise sentences.
- Provide only the definition or direct fact.
- Do NOT add examples unless absolutely necessary.
- Do NOT provide extended explanations.
- If unsure, say "I am not certain."

Your goal is speed, precision, and minimal verbosity.

${CITATION_INSTRUCTIONS}

${METADATA_INSTRUCTIONS}`;

/**
 * EXPLANATION PROMPT
 */
const EXPLANATION_PROMPT = `You are a conceptual explanation assistant.
Instructions:
- Explain clearly and logically.
- Use structured formatting (paragraphs or bullet points).
- Keep the explanation intuitive and easy to understand.
- Avoid unnecessary verbosity.
- Do NOT perform deep multi-step derivations unless explicitly requested.

Your goal is clarity, structure, and conceptual understanding.

${CITATION_INSTRUCTIONS}

${METADATA_INSTRUCTIONS}`;

/**
 * DEEP REASONING PROMPT
 */
const DEEP_REASONING_PROMPT = `You are an advanced analytical reasoning engine.
Instructions:
- Think step-by-step internally before answering.
- Break the solution into clearly numbered steps.
- Show logical reasoning explicitly.
- If solving a problem, verify the final answer before concluding.
- If comparing, provide structured comparisons (tables or bullet lists).
- Maintain precision and correctness.

Do not skip reasoning steps.
Your goal is depth, correctness, and structured analytical thinking.

After generating the answer, review it carefully.
If any logical or mathematical errors are found, correct them before finalizing.
Only output the corrected final answer.

${CITATION_INSTRUCTIONS}

${METADATA_INSTRUCTIONS}`;

/**
 * RESEARCH PROMPT
 * Mid-tier model (Tier 2 quality). Instructs the LLM to answer with verifiable
 * sources and a clear citation list. Follows the same citation/metadata format.
 */
const RESEARCH_PROMPT = `You are a research assistant specialising in academic summarisation.
Instructions:
- Provide a concise, well-structured answer based on established knowledge.
- After the main answer, include a "References" section with 2–4 credible sources.
- Format references as: Author(s) / Organisation, "Title", Source, Year, URL (if available).
- Do NOT fabricate sources. If unsure, say the source may need verification.
- Clearly separate factual claims from interpretations.
- Keep the answer focused and under 600 words.

Your goal is a research-quality, sourced answer that a student can cite.

${CITATION_INSTRUCTIONS}

${METADATA_INSTRUCTIONS}`;

/**
 * VISION PROMPT (MVP — text description mode)
 * Routes image-generation queries to a text LLM that produces a detailed
 * visual description. Labelled as "Vision Tier (Simulated for MVP)".
 * Estimated compute cost shown for comparative cost-optimisation analysis.
 */
const VISION_PROMPT = `You are a visual design assistant.
The user wants an image. Since this is a text-based MVP, produce a richly detailed
visual description that an artist or diffusion model could use to generate the image.

Instructions:
- Begin with: "[Image Description]"
- Describe the scene, subjects, style, lighting, colours, and composition in detail.
- Use vivid and precise language.
- Keep the description under 200 words.
- Do NOT add metadata sections or references — only the visual description.`;

/**
 * Selects the appropriate model and prompt based on query type.
 */
export function selectModel(type: QueryType): ModelSelection {
    switch (type) {
        case 'recall':
            return {
                model: Deno.env.get('FAST_RECALL_MODEL') || 'llama-3.1-8b-instant',
                tier: 'Fast Recall (Tier 1)',
                routingReason: 'Factual recall query. Using fast, efficient model for quick response.',
                systemPrompt: RECALL_PROMPT,
                temperature: 0.2,
                maxTokens: 150, // Low max tokens as requested
                provider: 'groq'
            };

        case 'explanation':
            return {
                model: Deno.env.get('EXPLANATION_MODEL') || 'llama-3.3-70b-versatile',
                tier: 'Explanation (Tier 2)',
                routingReason: 'Conceptual explanation query. Using balanced model for clear teaching.',
                systemPrompt: EXPLANATION_PROMPT,
                temperature: 0.4,
                maxTokens: 1024, // Medium token limit
                provider: 'groq'
            };

        case 'deep_reasoning':
            // User requested OpenAI for deep reasoning
            return {
                model: Deno.env.get('DEEP_REASONING_MODEL') || 'gpt-4o',
                tier: 'Deep Reasoning (Tier 3)',
                routingReason: 'Complex analytical query. Using an advanced reasoning model for in-depth analysis.',
                systemPrompt: DEEP_REASONING_PROMPT,
                temperature: 0.2, // Low temp for precision
                maxTokens: 4096, // Higher max tokens
                provider: 'openai'
            };

        case 'research':
            return {
                model: Deno.env.get('RESEARCH_MODEL') || 'llama-3.3-70b-versatile',
                tier: 'Research (Tier 2)',
                routingReason: 'Research-intent query. Using mid-tier model with source-citation prompt for a referenced answer.',
                systemPrompt: RESEARCH_PROMPT,
                temperature: 0.3,
                maxTokens: 1200,
                provider: 'groq'
            };

        case 'vision':
            return {
                model: Deno.env.get('VISION_MODEL') || 'llama-3.3-70b-versatile',
                tier: 'Vision (Simulated MVP)',
                routingReason: 'Image-generation query detected. Generating a detailed visual description (MVP mode — no external image API required).',
                systemPrompt: VISION_PROMPT,
                temperature: 0.7,   // Higher temp for creative image descriptions
                maxTokens: 400,
                provider: 'groq'
            };

        default:
            return {
                model: Deno.env.get('EXPLANATION_MODEL') || 'llama-3.3-70b-versatile',
                tier: 'Explanation (Tier 2)',
                routingReason: 'Default routing to balanced explanation model.',
                systemPrompt: EXPLANATION_PROMPT,
                temperature: 0.4,
                provider: 'groq'
            };
    }
}

/**
 * Get estimated cost savings based on model tier
 */
export function getCostSaved(type: QueryType): string {
    switch (type) {
        case 'recall': return '$0.03';
        case 'explanation': return '$0.01';
        case 'deep_reasoning': return '$0.00';
        // Research uses mid-tier model — same savings profile as explanation
        case 'research': return '$0.01';
        // Vision: estimated equivalent compute cost vs a premium image baseline
        case 'vision': return '$0.02 (estimated)';
        default: return '$0.01';
    }
}
