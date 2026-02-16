
interface LearningPathInput {
    coverage_percent: number;
    missing_topics: string[];
    confidence_score: number;
    question_type: string; // "factual" | "tricky" | "conceptual"
    syllabus: any;
}

export function generateLearningPath(input: LearningPathInput): {
    recommendations: string[];
    learning_level: "Strong" | "Moderate" | "Needs Improvement";
} {
    const { coverage_percent, missing_topics, confidence_score, question_type, syllabus } = input;
    const recommendations: string[] = [];

    // --- Logic Rules ---

    // 1. Coverage Check
    if (coverage_percent < 60) {
        if (missing_topics.length > 0) {
            recommendations.push(`Review missing topics: ${missing_topics.slice(0, 3).join(", ")}.`);
        }
        recommendations.push("Revise foundational concepts before attempting advanced questions.");
    }

    // 2. Confidence Check
    if (confidence_score < 0.65) {
        recommendations.push("Strengthen conceptual understanding with examples.");
    }

    // 3. Type & Confidence Check
    if (question_type === "tricky" && confidence_score < 0.7) {
        recommendations.push("Practice application-based and misconception-focused problems.");
    }

    // Helper to access subjects
    const getSubjects = (s: any) => {
        if (s.default && s.default.subjects) return s.default.subjects;
        if (s.subjects) return s.subjects;
        return {};
    };

    const subjects = getSubjects(syllabus);

    // 4. Advanced Prerequisite Check
    // We scan missing topics to see if they are prerequisites for what was covered (simplified logic)
    // Or simply if missing topics have prerequisites, we recommend those first.
    for (const missing of missing_topics) {
        // Find prerequisite in syllabus (naive search for now)
        for (const subject in subjects) {
            const subjectNode = subjects[subject];
            if (subjectNode.topics) {
                for (const t of subjectNode.topics) {
                    if (t.subtopics) {
                        for (const sub of t.subtopics) {
                            // Check if this subtopic matches a missing one (simplistic name match)
                            if (missing.includes(sub.name) && sub.prerequisites && sub.prerequisites.length > 0) {
                                recommendations.push(`Before mastering ${sub.name}, ensure you know: ${sub.prerequisites.join(", ")}.`);
                            }
                        }
                    }
                }
            }
        }
    }


    // --- Learning Level ---
    let learning_level: "Strong" | "Moderate" | "Needs Improvement" = "Needs Improvement";

    if (coverage_percent >= 80 && confidence_score >= 0.75) {
        learning_level = "Strong";
    } else if (coverage_percent >= 60) {
        learning_level = "Moderate";
    }

    // Deduplicate recommendations
    const uniqueRecommendations = [...new Set(recommendations)];

    return {
        recommendations: uniqueRecommendations,
        learning_level
    };
}
