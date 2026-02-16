
interface Topic {
    name: string;
    subtopics?: { name: string; keywords?: string[] }[];
}

export async function generateBenchmarkQuestions(syllabus: any, openAiApiKey: string): Promise<any[]> {
    // Helper to access subjects
    const getSubjects = (s: any) => {
        if (s.default && s.default.subjects) return s.default.subjects;
        if (s.subjects) return s.subjects;
        return {};
    };

    const subjects = getSubjects(syllabus);

    // 1. Extract topics from syllabus
    const topics: string[] = [];
    for (const subject in subjects) {
        const subjData = subjects[subject];
        if (subjData.topics) {
            for (const t of subjData.topics) {
                topics.push(`${subject}: ${t.name}`);
            }
        }
    }

    const topicsStr = topics.join(", ");

    // 2. prompt logic
    const prompt = `
Generate 10 educational questions based on the following syllabus topics: ${topicsStr}.

Requirements:
- 5 factual questions (definition, formula, direct concept)
- 5 tricky or conceptual questions (reasoning, application, misconception-based)
- Avoid repetition.

Return ONLY a JSON array in this format:
[
  {
    "question": "string",
    "type": "factual" | "tricky",
    "topic": "string"
  }
]
`;

    // 3. Call OpenAI or Groq
    const isGroq = openAiApiKey.startsWith('gsk_');
    const baseUrl = isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    // Use a reasoning-capable model for generation
    const model = isGroq ? 'llama-3.1-70b-versatile' : 'gpt-4o';

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: "You are an expert exam setter. return ONLY raw JSON without markdown formatting." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API Error in benchmark generation:", response.status, errText);
        throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        console.error("No content in OpenAI response", data);
        throw new Error("No content generated");
    }

    // 4. Parse JSON
    try {
        // cleanliness check: sometimes LLMs return markdown code blocks
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse generated questions", content);
        // Fallback if parsing fails
        return [
            { question: "What is velocity?", type: "factual", topic: "Physics" },
            { question: "Why does a feather fall slower than a hammer?", type: "tricky", topic: "Physics" }
        ];
    }
}
