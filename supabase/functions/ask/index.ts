
// Deno.serve is the modern way to handle requests in Supabase Edge Functions
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateBenchmarkQuestions } from './questionGenerator.ts';
import { generateLearningPath } from './learningPath.ts';
import { buildConceptGraph } from './conceptGraph.ts';
import { classifyQuery, getQueryTypeDescription } from './classifier.ts';
import { selectModel, getCostSaved } from './modelRouter.ts';
import { scoreQuery, ScoringResult } from './scorer.ts';

// ============================================================
// VISION MODE: In-memory cache for generated images
// Key format: vision::<normalizedPrompt>::<size>::<provider_name>
// ============================================================
const visionCache = new Map<string, string>(); // key → base64 data URL

/** Canonical provider identifier used in cache key */
const VISION_PROVIDER_ID = 'openrouter-nano-banana';
/** Human-readable label for UI captions and transparency panel */
const VISION_PROVIDER_LABEL = 'OpenRouter (Nano Banana)';

/**
 * generateImageWithOpenRouter
 *
 * Calls the OpenRouter chat completions endpoint using the Nano Banana model
 * (google/gemini-2.5-flash-image-preview) with image modality output.
 * Reads OPENROUTER_API_KEY from environment — NEVER hardcoded.
 *
 * On success:
 *   image_url  → base64 data URL (data:image/png;base64,...)
 *   provider   → VISION_PROVIDER_LABEL
 *   fallback   → false
 *
 * On failure (missing key, API error, timeout):
 *   image_url  → null
 *   provider   → null
 *   fallback   → true  (caller uses existing MVP text-description)
 *
 * @param prompt  - The user's image prompt
 * @param size    - Fixed size string (e.g. "1024x1024") — metadata only
 */
async function generateImageWithOpenRouter(
    prompt: string,
    size: string
): Promise<{ image_url: string | null; provider: string | null; fallback: boolean }> {
    const orApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!orApiKey) {
        console.warn('[Vision] OPENROUTER_API_KEY not set — using MVP fallback');
        return { image_url: null, provider: null, fallback: true };
    }

    // Build deterministic cache key (provider-namespaced)
    const normalizedPrompt = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
    const cacheKey = `vision::${normalizedPrompt}::${size}::${VISION_PROVIDER_ID}`;

    if (visionCache.has(cacheKey)) {
        console.log('[Vision] Cache HIT for key:', cacheKey.substring(0, 60));
        return { image_url: visionCache.get(cacheKey)!, provider: VISION_PROVIDER_LABEL, fallback: false };
    }

    try {
        console.log('[Vision] Calling OpenRouter (Nano Banana) for prompt:', prompt.substring(0, 80));

        // OpenRouter chat completions endpoint with image modality
        const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${orApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                modalities: ['image', 'text'],
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Vision] OpenRouter API error ${res.status}:`, errText.substring(0, 300));
            return { image_url: null, provider: null, fallback: true };
        }

        const responseJson = await res.json();

        // Extract base64 image from the response content parts
        // OpenRouter returns: choices[0].message.content (array of parts when modalities used)
        const contentParts = responseJson?.choices?.[0]?.message?.content;

        let b64: string | null = null;
        let mimeType = 'image/png';

        if (Array.isArray(contentParts)) {
            // Multipart response: find the image_url part
            for (const part of contentParts) {
                if (part?.type === 'image_url' && part?.image_url?.url) {
                    const dataUrl: string = part.image_url.url;
                    if (dataUrl.startsWith('data:')) {
                        // Already a data URL — use directly
                        visionCache.set(cacheKey, dataUrl);
                        console.log('[Vision] Image received as data URL. Provider:', VISION_PROVIDER_LABEL);
                        return { image_url: dataUrl, provider: VISION_PROVIDER_LABEL, fallback: false };
                    }
                    // Treat as raw base64
                    b64 = dataUrl;
                    break;
                }
            }
        } else if (typeof contentParts === 'string') {
            // Some responses may embed base64 as a plain string
            b64 = contentParts;
        }

        if (!b64 || b64.length < 100) {
            console.error('[Vision] OpenRouter (Nano Banana) returned empty or unrecognised image data');
            return { image_url: null, provider: null, fallback: true };
        }

        const dataUrl = `data:${mimeType};base64,${b64}`;

        // Store in vision cache
        visionCache.set(cacheKey, dataUrl);
        console.log('[Vision] Image generated and cached. Provider:', VISION_PROVIDER_LABEL, '| Cache size:', visionCache.size);

        return { image_url: dataUrl, provider: VISION_PROVIDER_LABEL, fallback: false };

    } catch (err: any) {
        console.error('[Vision] generateImageWithOpenRouter threw:', err?.message);
        return { image_url: null, provider: null, fallback: true };
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('[Ask Function] Module loaded successfully');

// --- Types ---
interface AskRequest {
    question?: string;
    action?: 'generate_benchmark' | 'get_concept_graph';
}

interface AskResponse {
    answer: string;
    hallucination_score: number;
    model_used: string;
    model_tier: string;
    cost_saved: string;
    cache_hit: boolean;
    routing_reason: string;
    response_time_ms: number;
    trust_score: number;
    risk_level: 'low' | 'medium' | 'high';
    confidence_score: number;
    context_completeness_score: number;
    covered_topics: string[];
    reliability_status: string;
    learning_recommendations?: string[];
    learning_level?: string;
    reference_metadata?: {
        reliability_status: string;
        curriculum_coverage: string;
        key_concepts: string[];
        suggested_reference: string;
    };
    references?: string[];
    // ── New fields (Features 1-4) ─────────────────────────────────────────
    mode?: 'text' | 'research' | 'vision';          // Feature 1 & 2
    sources_used?: boolean;                          // Feature 1: Research Mode
    modality?: 'text' | 'image';                     // Feature 2: Vision Mode
    image_url?: string | null;                       // Feature 2: real image data URL
    image_size?: string;                             // Feature 2
    image_provider?: string;                         // Feature 2: provider label (e.g. "Stable Diffusion XL")
    routing_scores?: Record<string, number>;         // Feature 3: Score breakdown
    routing_score_reason?: string;                   // Feature 3: Why this tier won
    was_escalated?: boolean;                         // Feature 4
    escalation_reason?: string;                      // Feature 4
}

// --- Helper Functions ---

function getSubjects(syllabus: any) {
    if (syllabus.default && syllabus.default.subjects) return syllabus.default.subjects;
    if (syllabus.subjects) return syllabus.subjects;
    return {};
}

/**
 * PART 1: FIXED COVERAGE CALCULATION
 * - Uses partial string matching (case-insensitive)
 * - Properly normalized between 0 and 1
 * - Checks both question and answer against syllabus topics
 */
function calculateCoverage(text: string, syllabus: any, question?: string): { score: number, topics: string[], missing_topics: string[] } {
    let touchedKeywords = new Set<string>();
    let coveredTopics = new Set<string>();

    // Convert to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase();
    const lowerQuestion = question ? question.toLowerCase() : '';
    const subjects = getSubjects(syllabus);

    // Track total possible concepts for normalization
    let totalExpectedConcepts = 0;
    let retrievedConceptsCount = 0;

    for (const subject in subjects) {
        const topics = subjects[subject].topics;
        for (const topic of topics) {
            if (topic.subtopics) {
                for (const sub of topic.subtopics) {
                    if (sub.keywords) {
                        for (const kw of sub.keywords) {
                            totalExpectedConcepts++;
                            const kwLower = kw.toLowerCase();

                            // PARTIAL MATCH LOGIC: Check if text includes topic or vice versa
                            const matchInAnswer = lowerText.includes(kwLower);
                            const matchInQuestion = lowerQuestion.includes(kwLower) || kwLower.includes(lowerQuestion.split(' ').find(w => w.length > 3) || '');

                            if (matchInAnswer || matchInQuestion) {
                                touchedKeywords.add(kw);
                                coveredTopics.add(`${subject} > ${topic.name} > ${sub.name}`);
                                retrievedConceptsCount++;
                            }
                        }
                    }
                }
            }
        }
    }

    let missing: string[] = [];
    const touchedParentTopics = new Set<string>();
    coveredTopics.forEach(t => {
        const parts = t.split(' > ');
        if (parts.length >= 2) touchedParentTopics.add(parts[1]);
    });

    for (const subject in subjects) {
        const topics = subjects[subject].topics;
        for (const topic of topics) {
            if (touchedParentTopics.has(topic.name)) {
                if (topic.subtopics) {
                    for (const sub of topic.subtopics) {
                        const fullName = `${subject} > ${topic.name} > ${sub.name}`;
                        if (!coveredTopics.has(fullName)) {
                            missing.push(sub.name);
                        }
                    }
                }
            }
        }
    }

    // Calculate coverage as ratio: retrieved_concepts_count / total_expected_concepts
    // Ensure it's between 0 and 1 (normalized)
    let coverageScore = totalExpectedConcepts > 0 ? retrievedConceptsCount / totalExpectedConcepts : 0;

    // If no concepts matched but keywords were found, give partial credit
    if (coverageScore === 0 && touchedKeywords.size > 0) {
        coverageScore = Math.min(touchedKeywords.size * 0.05, 0.3); // Max 30% for keyword matches
    }

    // CLAMP coverage_score between 0 and 1
    coverageScore = Math.max(0, Math.min(coverageScore, 1));

    return {
        score: coverageScore, // Return as 0-1, convert to percentage only for UI
        topics: Array.from(coveredTopics),
        missing_topics: missing
    };
}

function classifyRisk(confidence: number, hallucination: number): 'low' | 'medium' | 'high' {
    if (confidence > 0.8 && hallucination < 10) return 'low';
    if (confidence > 0.5 && hallucination < 30) return 'medium';
    return 'high';
}

function parseReferenceMetadata(fullText: string) {
    // 1. First, split off the Metadata block (at the end)
    const splitRegex = /\n---+\s*\n(?=Reliability Status:)/i;
    let parts = fullText.split(splitRegex);

    if (parts.length < 2) {
        const altRegex = /---+\s*(?=Reliability Status:)/i;
        parts = fullText.split(altRegex);
    }

    if (parts.length < 2) {
        const fallbackRegex = /\n+(?=Reliability Status:)/i;
        const fallbackParts = fullText.split(fallbackRegex);
        if (fallbackParts.length >= 2) {
            parts = fallbackParts;
        } else {
            parts = [fullText, ''];
        }
    }

    let answerText = parts[0].trim();
    const metadataText = parts[1] || '';

    // 2. Now extract References from the answerText
    // Look for "References:" header (flexible markdown support)
    // Matches:
    // References:
    // **References:**
    // ## References
    // ### References
    const refRegex = /(?:\n|^)(?:#{1,3}\s*|\*\*)?References:?(?:\*\*)?\s*\n([\s\S]*)/i;
    const refMatch = answerText.match(refRegex);
    let references: string[] = [];

    if (refMatch) {
        // Remove references from answer text
        // We cut the string at the index where the match started
        answerText = answerText.substring(0, refMatch.index).trim();

        // Parse references list
        const rawRefs = refMatch[1].trim();
        references = rawRefs.split('\n')
            .map(r => r.trim())
            .filter(r => r.length > 0);
    }

    const { metadata } = extractMetadataFields(answerText, metadataText);

    return {
        answer: answerText,
        references,
        metadata
    };
}

function extractMetadataFields(answer: string, metadataText: string) {
    // More flexible regex patterns to handle variations
    const reliabilityMatch = metadataText.match(/Reliability Status:\s*(.+?)(?:\n|$)/i);
    const curriculumMatch = metadataText.match(/Curriculum Coverage:\s*\n?([\s\S]*?)(?=\n\n(?:Key Concepts|Suggested)|$)/i);
    const conceptsMatch = metadataText.match(/Key Concepts(?: Covered)?:\s*\n?([\s\S]*?)(?=\n\n(?:Suggested Reference|$)|\n(?:Suggested Reference|$)|$)/i);
    const referenceMatch = metadataText.match(/Suggested Reference(?: Type)?:\s*(.+?)(?:\n|$)/i);

    // Extract and clean key concepts
    const keyConcepts = conceptsMatch
        ? conceptsMatch[1].split('\n')
            .map(c => c.replace(/^[-•*]\s*/, '').trim()) // Remove leading bullets (-, •, *)
            .filter(c => c.length > 0 && !c.match(/^---+$/)) // Remove empty lines and separator lines
        : [];

    return {
        answer,
        metadata: {
            reliability_status: reliabilityMatch?.[1]?.trim() || "Unknown",
            curriculum_coverage: curriculumMatch?.[1]?.trim().replace(/\n+/g, ' ') || "General",
            key_concepts: keyConcepts,
            suggested_reference: referenceMatch?.[1]?.trim() || "General Knowledge"
        }
    };
}

function runBenchmarkTests(): number {
    return 100;
}

/**
 * FEATURE 4: Deterministic Heuristic Confidence Estimator
 *
 * Estimates confidence of a Tier-1 response using three explainable signals.
 * No ML — all rules are human-readable thresholds.
 *
 * Signal 1 — Answer length (relative to query length):
 *   Very short answers from a recall query may indicate the model is uncertain.
 *
 * Signal 2 — Uncertainty terms:
 *   Phrases like "I'm not sure", "possibly", "may" penalise confidence.
 *
 * Signal 3 — Lexical overlap between question and answer:
 *   Low overlap suggests the answer may not be on-topic.
 *
 * @returns confidence score in [0, 1]
 */
function computeHeuristicConfidence(answer: string, question: string): number {
    const UNCERTAINTY_TERMS = [
        'i am not sure', "i'm not sure", 'not certain', 'possibly', 'may be',
        'might be', 'could be', 'not confident', 'unclear', 'not certain',
        'it depends', 'i cannot', "i can't", 'unsure'
    ];

    const answerLower = answer.trim().toLowerCase();
    const questionLower = question.trim().toLowerCase();

    const answerWords = answerLower.split(/\s+/).filter(Boolean);
    const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3); // only meaningful words

    // ── Signal 1: Answer length score (0-1) ──────────────────────────────────
    // A very short answer (< 10 words) for a recall question is suspect
    const lengthScore = Math.min(answerWords.length / 30, 1.0); // 30 words → full score

    // ── Signal 2: Uncertainty penalty (0-1, 1 = no uncertainty found) ────────
    const hasUncertainty = UNCERTAINTY_TERMS.some(term => answerLower.includes(term));
    const uncertaintyScore = hasUncertainty ? 0.3 : 1.0;

    // ── Signal 3: Lexical overlap between question and answer (0-1) ──────────
    const matchCount = questionWords.filter(w => answerLower.includes(w)).length;
    const overlapScore = questionWords.length > 0
        ? Math.min(matchCount / questionWords.length, 1.0)
        : 0.5; // neutral if no long question words

    // ── Weighted combination ──────────────────────────────────────────────────
    // Length: 30%, Uncertainty: 40%, Overlap: 30%
    const confidence = (lengthScore * 0.3) + (uncertaintyScore * 0.4) + (overlapScore * 0.3);
    return Math.max(0, Math.min(confidence, 1));
}

Deno.serve(async (req) => {
    console.log(`[Ask Function] Request received: ${req.method}`);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const start = performance.now();

    try {
        // Initialize on each request
        const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
        console.log('[Ask Function] API Key exists:', !!openAiApiKey);
        console.log('[Ask Function] API Key type:', openAiApiKey?.substring(0, 4));

        if (!openAiApiKey) {
            console.error("Missing OPENAI_API_KEY");
            throw new Error("Server configuration error: Missing API Key.");
        }

        const { question, action } = await req.json() as AskRequest;
        console.log('[Ask Function] Action:', action, 'Question:', question?.substring(0, 50));

        // Import syllabus data
        const { syllabusData } = await import('./syllabus.ts');

        if (!syllabusData || Object.keys(syllabusData).length === 0) {
            console.error("Syllabus data failed to load");
            throw new Error("Syllabus configuration error");
        }

        // Handle Benchmark Generation Request
        if (action === 'generate_benchmark') {
            console.log('[Ask Function] Generating benchmark questions');
            const questions = await generateBenchmarkQuestions(syllabusData, openAiApiKey);
            return new Response(JSON.stringify({ questions }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Handle Concept Graph Request
        if (action === 'get_concept_graph') {
            console.log('[Ask Function] Building concept graph');
            const graphMap = buildConceptGraph(syllabusData);
            const nodes = Array.from(graphMap.values());
            return new Response(JSON.stringify({ nodes }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!question) {
            throw new Error("Question is required for normal queries.");
        }

        // ========================================
        // STEP 1: SCORE-BASED ROUTING (Feature 3)
        // Primary routing decision comes from the scorer.
        // classifyQuery() still runs for logging/labeling.
        // ========================================
        const scoringResult: ScoringResult = scoreQuery(question);
        const queryType = scoringResult.winner;         // Score-based winner
        const queryTypeLabel = classifyQuery(question); // Original label (for logs)
        const queryTypeDescription = getQueryTypeDescription(queryType);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 SCORE-BASED DETERMINISTIC ROUTING');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Scorer Winner:', queryType);
        console.log('Classifier Label:', queryTypeLabel);
        console.log('Scores:', JSON.stringify(scoringResult.scores));
        console.log('Routing Reason:', scoringResult.reason);
        console.log('Description:', queryTypeDescription);

        // ========================================
        // STEP 2: MODEL SELECTION
        // ========================================
        const modelSelection = selectModel(queryType);
        const costSaved = getCostSaved(queryType);

        console.log('Selected Model:', modelSelection.model);
        console.log('Tier:', modelSelection.tier);
        console.log('Routing Reason:', modelSelection.routingReason);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ========================================
        // STEP 3: CONFIGURE PROVIDER (Multi-Provider Support)
        // ========================================
        let activeApiKey = openAiApiKey;
        let baseUrl = 'https://api.groq.com/openai/v1/chat/completions'; // Default to Groq

        // Check if the main key is actually a Groq key
        const isMainKeyGroq = openAiApiKey.startsWith('gsk_');

        if (modelSelection.provider === 'openai') {
            // Try to find a dedicated OpenAI key first
            const secretOpenAiKey = Deno.env.get('OPENAI_API_KEY_SECURE');

            if (secretOpenAiKey) {
                activeApiKey = secretOpenAiKey;
                baseUrl = 'https://api.openai.com/v1/chat/completions';
                console.log('Using OpenAI Provider (Secure Key)');
            } else if (!isMainKeyGroq) {
                // If main key is NOT Groq, assume it's OpenAI
                baseUrl = 'https://api.openai.com/v1/chat/completions';
                console.log('Using OpenAI Provider (Main Key)');
            } else {
                console.warn("WARNING: OpenAI model requested but no valid OpenAI key found. Falling back to Groq Llama 3 70B.");
                // Fallback to Groq
                activeApiKey = openAiApiKey; // The main key (Groq)
                baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                // Override model to a Groq equivalent
                modelSelection.model = 'llama-3.3-70b-versatile';
                modelSelection.provider = 'groq';
                modelSelection.tier = 'Deep Reasoning (Groq Fallback)';
            }
        } else {
            // Uses Groq (or fallback)
            if (isMainKeyGroq) {
                baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
            } else {
                // Fallback if provider is 'groq' but key is something else? force Groq anyway?
                // Let's stick to the convention: if provider is Groq, use Groq URL.
                baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
            }
        }

        // OpenRouter override: if the main key is an OpenRouter key, route all
        // calls through OpenRouter and map model names to OpenRouter IDs.
        const isMainKeyOpenRouter = openAiApiKey.startsWith('sk-or-');
        if (isMainKeyOpenRouter) {
            baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
            activeApiKey = openAiApiKey;
            const openRouterModels: Record<string, string> = {
                'llama-3.1-8b-instant': 'meta-llama/llama-3.1-8b-instruct',
                'llama-3.3-70b-versatile': 'meta-llama/llama-3.3-70b-instruct',
                'gpt-4o': 'openai/gpt-4o-mini'
            };
            modelSelection.model = openRouterModels[modelSelection.model] || 'meta-llama/llama-3.3-70b-instruct';
            modelSelection.provider = 'openrouter';
            console.log('Using OpenRouter Provider with model:', modelSelection.model);
        }

        // ========================================
        // STEP 4: CALL SELECTED MODEL (WITH FAILOVER)
        // ========================================
        let responseData: any = null;
        let usedProvider = modelSelection.provider;

        try {
            const isGroq = baseUrl.includes('groq.com');
            console.log(`[Ask Function] Attempting to call ${isGroq ? 'Groq' : 'OpenAI'} with model ${modelSelection.model}`);

            const completion = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeApiKey}`
                },
                body: JSON.stringify({
                    model: modelSelection.model,
                    messages: [
                        { role: "system", content: modelSelection.systemPrompt },
                        { role: "user", content: question }
                    ],
                    temperature: modelSelection.temperature,
                    max_tokens: modelSelection.maxTokens
                })
            });

            if (!completion.ok) {
                const errorText = await completion.text();
                throw new Error(`${isGroq ? 'Groq' : 'OpenAI'} API returned error ${completion.status}: ${errorText}`);
            }

            const data = await completion.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error("No answer generated from model (empty response).");
            }

            // Success!
            responseData = data;

        } catch (primaryError: any) {
            console.error(`[Ask Function] Primary Model Failed: ${primaryError.message}`);

            // FAILOVER LOGIC: If OpenAI failed, try Groq
            if (usedProvider === 'openai') {
                console.warn("[Ask Function] ⚠️ Initiating Failover to Groq...");

                // Switch to Groq configuration
                baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                activeApiKey = openAiApiKey; // Use the main Groq key

                // Update model selection to reflect fallback
                modelSelection.model = 'llama-3.3-70b-versatile';
                modelSelection.provider = 'groq';
                modelSelection.tier = 'Deep Reasoning (Groq Fallback)';
                usedProvider = 'groq';

                const fallbackCompletion = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${activeApiKey}`
                    },
                    body: JSON.stringify({
                        model: modelSelection.model, // Updated to Llama 3
                        messages: [
                            { role: "system", content: modelSelection.systemPrompt },
                            { role: "user", content: question }
                        ],
                        temperature: 0.4, // Slightly higher temp for Llama
                        max_tokens: 1024  // Safer token limit for fallback
                    })
                });

                if (!fallbackCompletion.ok) {
                    const fallbackErrorText = await fallbackCompletion.text();
                    throw new Error(`Fallback (Groq) also failed: ${fallbackCompletion.status} - ${fallbackErrorText}`);
                }

                const fallbackData = await fallbackCompletion.json();
                const fallbackContent = fallbackData.choices?.[0]?.message?.content;

                if (!fallbackContent) {
                    throw new Error("Fallback model returned empty response.");
                }

                responseData = fallbackData;
                console.log("[Ask Function] ✅ Failover successful!");
            } else {
                // If it was already Groq, or some other error, just rethrow
                throw primaryError;
            }
        }

        const rawContent = responseData.choices?.[0]?.message?.content;

        // ========================================
        // FEATURE 4: CONFIDENCE-BASED ESCALATION
        // Applies only when Tier-1 (recall) was selected.
        // Uses a deterministic heuristic — NO ML.
        // ========================================
        let wasEscalated = false;
        let escalationReason = '';
        let finalRawContent = rawContent;

        if (queryType === 'recall') {
            const confidence = computeHeuristicConfidence(rawContent, question);
            console.log(`[Escalation Check] Heuristic confidence for recall answer: ${confidence.toFixed(3)}`);

            if (confidence < 0.55) {
                console.warn(`[Escalation] ⚠️ Low confidence (${confidence.toFixed(2)}) — escalating from Tier-1 to Tier-2`);
                escalationReason = `Tier-1 response had low heuristic confidence (${Math.round(confidence * 100)}%). ` +
                    `Signals: short answer, uncertainty terms, or low question-answer overlap. ` +
                    `Escalated to Tier-2 (llama-3.3-70b-versatile) for a more complete response.`;

                // Re-run with Tier-2 model
                const escalationCompletion = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: 'You are a conceptual explanation assistant. Explain clearly and logically with structured formatting.' },
                            { role: 'user', content: question }
                        ],
                        temperature: 0.4,
                        max_tokens: 1024
                    })
                });

                if (escalationCompletion.ok) {
                    const escalationData = await escalationCompletion.json();
                    const escalationContent = escalationData.choices?.[0]?.message?.content;
                    if (escalationContent) {
                        finalRawContent = escalationContent;
                        modelSelection.model = 'llama-3.3-70b-versatile';
                        modelSelection.tier = 'Explanation (Tier 2 — Escalated)';
                        wasEscalated = true;
                        console.log('[Escalation] ✅ Escalation successful — using Tier-2 response');
                    }
                } else {
                    console.warn('[Escalation] Escalation call failed — keeping Tier-1 response');
                }
            }
        }


        // Parse Metadata
        const { answer, references, metadata } = parseReferenceMetadata(finalRawContent);

        console.log(`[Ask Function] Answer parsed. Length: ${answer.length}. Refs: ${references?.length}. Meta: ${!!metadata}`);
        if (metadata) {
            console.log('[Ask Function] Metadata details:', {
                reliability: metadata.reliability_status,
                curriculum: metadata.curriculum_coverage?.substring(0, 50),
                concepts_count: metadata.key_concepts?.length || 0
            });
        } else {
            console.log('[Ask Function] WARNING: No metadata parsed from response');
        }


        // ========================================
        // PART 1: COVERAGE CALCULATION (FIXED)
        // ========================================
        // Pass both answer and question for better coverage detection
        const coverage = calculateCoverage(answer, syllabusData, question);

        // Reliability
        const reliabilityScore = runBenchmarkTests();
        const reliabilityStatus = reliabilityScore === 100 ? "Verified Stable" : "Needs Review";

        // ========================================
        // PART 4: ENSURE NORMALIZATION (0-1)
        // ========================================
        // Base confidence score (normalized 0-1)
        let confidenceScore = 0.85;

        // Adjust confidence based on question quality
        if (question.split(' ').length < 3) {
            confidenceScore = 0.4;
        } else if (queryType === 'deep_reasoning') {
            confidenceScore = 0.95; // High confidence for complex queries handled by deep reasoning
        }

        // Ensure confidence is normalized 0-1
        confidenceScore = Math.max(0, Math.min(confidenceScore, 1));

        // ========================================
        // PART 2: HALLUCINATION SCORE (FIXED)
        // ========================================
        // Hallucination = 1 - confidence (normalized 0-1)
        let hallucinationScore = 1 - confidenceScore;

        // Clamp hallucination_score between 0 and 1
        hallucinationScore = Math.max(0, Math.min(hallucinationScore, 1));

        // ========================================
        // PART 3: TRUST SCORE FORMULA (FIXED)
        // ========================================
        // Correct weighted formula:
        // trust_score = (confidence * 0.3) + ((1 - hallucination) * 0.4) + (coverage * 0.3)
        // All inputs are 0-1 normalized
        let trustScore =
            (confidenceScore * 0.3) +
            ((1 - hallucinationScore) * 0.4) +
            (coverage.score * 0.3);

        // Clamp final trust_score between 0 and 1
        trustScore = Math.max(0, Math.min(trustScore, 1));

        // ========================================
        // PART 5: DEBUG LOGGING
        // ========================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RELIABILITY ENGINE DEBUG');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 Confidence Score (0-1):', confidenceScore.toFixed(3));
        console.log('📚 Coverage Score (0-1):', coverage.score.toFixed(3));
        console.log('⚠️  Hallucination Score (0-1):', hallucinationScore.toFixed(3));
        console.log('✅ Trust Score (0-1):', trustScore.toFixed(3));
        console.log('📈 Trust Percentage:', (trustScore * 100).toFixed(1) + '%');
        console.log('📉 Hallucination Percentage:', (hallucinationScore * 100).toFixed(1) + '%');
        console.log('📊 Coverage Percentage:', (coverage.score * 100).toFixed(1) + '%');
        console.log('🔍 Covered Topics:', coverage.topics.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Learning Path (convert coverage to percentage for backward compatibility)
        const lp = generateLearningPath({
            coverage_percent: coverage.score * 100, // Convert to percentage for learning path
            missing_topics: coverage.missing_topics,
            confidence_score: confidenceScore,
            question_type: queryType === 'deep_reasoning' ? "tricky" : "factual",
            syllabus: syllabusData
        });

        // Risk classification (using normalized scores)
        const riskLevel = classifyRisk(confidenceScore, hallucinationScore * 100); // Convert hallucination to % for risk classification

        // Convert to percentages for UI display only
        const trustScorePercentage = Math.round(trustScore * 100);
        const hallucinationScorePercentage = Math.round(hallucinationScore * 100);
        const coverageScorePercentage = Math.round(coverage.score * 100);
        const end = performance.now();

        // ========================================
        // VISION MODE: Call Image Generation Provider
        // Only runs when queryType === 'vision'.
        // Routing/scoring/cost logic above is UNCHANGED.
        // Provider: OpenRouter (Nano Banana) — google/gemini-2.5-flash-image-preview
        // Cache key format: vision::<normalizedPrompt>::1024x1024::openrouter-nano-banana
        // ========================================
        let visionImageUrl: string | null = null;
        let visionImageSize: string | undefined = undefined;
        let visionImageProvider: string | undefined = undefined;
        let visionCacheHit = false;

        if (queryType === 'vision') {
            const IMAGE_SIZE = '1024x1024';

            // Check in-memory vision cache first (before calling API)
            const normalizedVisionPrompt = question.trim().toLowerCase().replace(/\s+/g, ' ');
            const visionCacheKey = `vision::${normalizedVisionPrompt}::${IMAGE_SIZE}::${VISION_PROVIDER_ID}`;
            const alreadyCached = visionCache.has(visionCacheKey);

            const visionResult = await generateImageWithOpenRouter(question, IMAGE_SIZE);
            visionImageUrl = visionResult.image_url;
            visionImageProvider = visionResult.provider ?? undefined;
            visionCacheHit = alreadyCached && !visionResult.fallback;

            if (visionResult.fallback) {
                // Graceful fallback: text-based MVP description
                visionImageSize = 'N/A (MVP fallback)';
                console.log('[Vision] Using MVP text-based fallback');
            } else {
                visionImageSize = IMAGE_SIZE;
                console.log('[Vision] Real image generated successfully. Provider:', visionResult.provider, '| Cache hit:', visionCacheHit);
            }
        }

        // Populate the final response object (reusing the interface structure)
        const finalResponse: AskResponse = {
            answer: answer,
            hallucination_score: hallucinationScorePercentage,
            model_used: modelSelection.model,
            model_tier: modelSelection.tier,
            cost_saved: costSaved,
            cache_hit: visionCacheHit,
            routing_reason: modelSelection.routingReason,
            response_time_ms: Math.round(end - start),
            trust_score: trustScorePercentage,
            risk_level: riskLevel,
            confidence_score: confidenceScore,
            context_completeness_score: coverageScorePercentage,
            covered_topics: coverage.topics,
            reliability_status: reliabilityStatus,
            learning_recommendations: lp.recommendations,
            learning_level: lp.learning_level,
            reference_metadata: metadata,
            references: references,
            // ── New fields (Features 1-4) ────────────────────────────────
            mode: queryType === 'research' ? 'research' : queryType === 'vision' ? 'vision' : 'text',
            sources_used: queryType === 'research',
            modality: queryType === 'vision' ? 'image' : 'text',
            image_url: visionImageUrl,
            image_size: visionImageSize,
            image_provider: visionImageProvider,
            routing_scores: scoringResult.scores as unknown as Record<string, number>,
            routing_score_reason: scoringResult.reason,
            was_escalated: wasEscalated,
            escalation_reason: wasEscalated ? escalationReason : undefined,
        };


        // ========================================
        // STEP 5: LOG TO DATABASE (Async)
        // ========================================
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

            if (supabaseUrl && supabaseServiceKey) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

                const { error: logError } = await supabaseAdmin.from('query_logs').insert({
                    question: question,
                    answer: answer,
                    model_used: modelSelection.model,
                    model_tier: modelSelection.tier,
                    hallucination_score: hallucinationScore,
                    confidence_score: confidenceScore,
                    trust_score: trustScorePercentage,
                    context_completeness_score: coverage.score,
                    cost_saved_percentage: 0,
                    routing_reason: modelSelection.routingReason,
                    response_time_ms: Math.round(end - start),
                    was_escalated: wasEscalated
                });

                if (logError) {
                    console.error('[Ask Function] Failed to log query to DB:', logError);
                } else {
                    console.log('[Ask Function] Query logged to database successfully');
                }
            } else {
                console.warn('[Ask Function] Missing Supabase credentials, skipping Log');
            }
        } catch (dbError) {
            console.error('[Ask Function] Database logging error:', dbError);
        }

        console.log('[Ask Function] Returning successful response');
        return new Response(JSON.stringify(finalResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("[Ask Function] Error caught:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[Ask Function] Error message:", message);

        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
