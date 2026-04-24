import fs from 'fs';
import path from 'path';

export interface Experience {
    id: string;
    timestamp: number;
    taskPrompt: string;
    success: boolean;
    toolsUsed: string[];
    lessonsLearned: string;
    antiPatterns: string[];
}

/**
 * ExperienceStore - The Episodic Memory layer for AutoResearch.
 * 
 * Stores "wins" and "mistakes" across sessions in a local JSON file.
 * The AgentExecutor pulls from this store during the `decompose()` phase to
 * avoid repeating past mistakes and to leverage proven toolchains.
 */
export class ExperienceStore {
    private storePath: string;
    private experiences: Experience[] = [];

    constructor(storeDir: string = path.join(process.cwd(), '.azmeth_memory')) {
        this.storePath = path.join(storeDir, 'lessons_learned.json');
        this.initStore(storeDir);
    }

    private initStore(storeDir: string) {
        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
        }

        if (fs.existsSync(this.storePath)) {
            try {
                const data = fs.readFileSync(this.storePath, 'utf8');
                this.experiences = JSON.parse(data);
            } catch (err) {
                console.error('[ExperienceStore] Failed to load memory:', err);
                this.experiences = [];
            }
        } else {
            this.saveStore();
        }
    }

    private saveStore() {
        fs.writeFileSync(this.storePath, JSON.stringify(this.experiences, null, 2), 'utf8');
    }

    /**
     * Record a new experience (win or failure).
     */
    addExperience(experience: Omit<Experience, 'id' | 'timestamp'>) {
        const newExp: Experience = {
            ...experience,
            id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now()
        };
        
        this.experiences.push(newExp);
        
        // Keep only the last 100 experiences so context doesn't blow up
        if (this.experiences.length > 100) {
            this.experiences.shift();
        }
        
        this.saveStore();
        return newExp.id;
    }

    /**
     * Retrieve relevant lessons for a given task context.
     * In a production setup this would be semantic search (RAG).
     * For now, we do a keyword heuristic match to find related past tasks.
     */
    getRelevantLessons(taskPrompt: string): Experience[] {
        const keywords = taskPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        
        if (keywords.length === 0) return [];

        // Score experiences based on keyword overlap
        const scored = this.experiences.map(exp => {
            const expWords = exp.taskPrompt.toLowerCase();
            let score = 0;
            for (const kw of keywords) {
                if (expWords.includes(kw)) score++;
            }
            return { exp, score };
        });

        // Return top 3 most relevant experiences that actually matched something
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.exp);
    }

    /**
     * Format relevant lessons into a prompt string for Claude.
     */
    formatLessonsForPrompt(taskPrompt: string): string {
        const relevant = this.getRelevantLessons(taskPrompt);
        
        if (relevant.length === 0) return '';

        let prompt = `\n\n## AutoResearch Internal Memory (Past Experiences)\n`;
        prompt += `You have previously attempted similar tasks. Review these lessons to avoid mistakes and replicate successes:\n\n`;

        for (const exp of relevant) {
            prompt += `### Past Task: "${exp.taskPrompt}"\n`;
            prompt += `- Status: ${exp.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
            prompt += `- Tools Used: ${exp.toolsUsed.join(', ')}\n`;
            prompt += `- Lesson Learned: ${exp.lessonsLearned}\n`;
            
            if (exp.antiPatterns.length > 0) {
                prompt += `- Patterns to AVOID:\n${exp.antiPatterns.map(p => `  * ${p}`).join('\n')}\n`;
            }
            prompt += `\n`;
        }

        return prompt;
    }
}
