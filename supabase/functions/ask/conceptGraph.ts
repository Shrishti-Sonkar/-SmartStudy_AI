
// Graph Node Interface
interface ConceptNode {
    id: string; // "Physics > Kinematics > Vectors"
    name: string;
    prerequisites: string[]; // List of IDs
    bloom_level: number;
}

// Helper to flatten syllabus into a map
export function buildConceptGraph(syllabus: any): Map<string, ConceptNode> {
    const graph = new Map<string, ConceptNode>();

    // Helper to access subjects
    const getSubjects = (s: any) => {
        if (s.default && s.default.subjects) return s.default.subjects;
        if (s.subjects) return s.subjects;
        return {};
    };

    const subjects = getSubjects(syllabus);

    for (const subjectName in subjects) {
        const subject = subjects[subjectName];
        for (const topic of subject.topics) {
            for (const sub of topic.subtopics) {
                // Create a unique ID
                const id = `${subjectName} > ${topic.name} > ${sub.name}`;
                // Resolve prerequisites to full IDs (assuming prereqs are just subtopic names for now)
                // In a real system, prereqs should probably be full IDs or unique names.
                // Here we will try to find the full ID for the Prereq Name.
                // Since we don't have a lookup yet, we might need a 2-pass approach or just precise naming.
                // PROMPT assumption: "prerequisites": ["Motion in One Dimension"] -> implies same subject/topic context or global unique name.
                // Let's assume unique names for subtopics for simplicity in this demo logic.

                graph.set(sub.name, { // Indexing by simple name for easy lookup, ideally use full ID
                    id: id,
                    name: sub.name,
                    prerequisites: sub.prerequisites || [],
                    bloom_level: sub.bloom_level || 1
                });
            }
        }
    }
    return graph;
}

// 1. Get all missing prerequisites for a target concept
export function getMissingPrerequisites(targetConceptName: string, completedConcepts: string[], graph: Map<string, ConceptNode>): string[] {
    const target = graph.get(targetConceptName);
    if (!target) return [];

    const missing: string[] = [];

    // BFS/Recursive check
    const queue = [...target.prerequisites];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentName = queue.shift()!;
        if (visited.has(currentName)) continue;
        visited.add(currentName);

        // If already completed, we don't need to check its children (assume mastery implies foundation)
        // OR we might want to check anyway. Let's assume if completed, we're good.
        if (completedConcepts.includes(currentName)) continue;

        // If not completed, it's missing!
        missing.push(currentName);

        // And we need to check ITS prerequisites
        const node = graph.get(currentName);
        if (node && node.prerequisites) {
            queue.push(...node.prerequisites);
        }
    }

    return missing;
}

// 2. Suggest Next Topic (Zone of Proximal Development)
// Find topics where all prerequisites are met but the topic itself is not mastered.
export function getNextRecommendedTopics(completedConcepts: string[], graph: Map<string, ConceptNode>): string[] {
    const recommended: string[] = [];

    for (const [name, node] of graph.entries()) {
        if (completedConcepts.includes(name)) continue; // Already done

        // Check if all immediate prerequisites are done
        const allPrereqsMet = node.prerequisites.every(p => completedConcepts.includes(p));

        if (allPrereqsMet) {
            recommended.push(name);
        }
    }

    return recommended;
}
