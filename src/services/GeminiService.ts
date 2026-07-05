import { GEMINI_MODEL } from "../lib/constants";
import { logger } from "../lib/logger";

export interface AttendanceAnalysisInput {
    username: string;
    totalRecords: number;
    currentStreak: number;
    maxStreak: number;
    maxBeforeSevenStreak: number;
    latestAttendance: Date;
}

/**
 * Minimal structural view of the parts of the `@google/genai` client this
 * service actually uses. Declaring it locally keeps the ESM-only package out
 * of the CommonJS type graph (it is loaded lazily via dynamic import).
 */
interface GenAIClient {
    models: {
        generateContent(request: {
            model: string;
            contents: string;
        }): Promise<{ text?: string }>;
    };
}

const FALLBACK_MESSAGE = "🌟 Keep shining! You're doing great!";

/**
 * Wraps the Google Gemini SDK to produce a short motivational analysis.
 * Any API failure degrades gracefully to a fixed encouraging message so the
 * `/record` command never fails just because the AI call did.
 */
export class GeminiService {
    private clientPromise: Promise<GenAIClient> | null = null;

    constructor(private readonly apiKey: string) {}

    /**
     * Lazily construct the client. `@google/genai` is an ESM-only package, so
     * it is loaded via dynamic import (supported from CommonJS on Node 20+).
     */
    private getClient(): Promise<GenAIClient> {
        if (!this.clientPromise) {
            this.clientPromise = import("@google/genai").then(
                ({ GoogleGenAI }) =>
                    new GoogleGenAI({ apiKey: this.apiKey }) as GenAIClient
            );
        }
        return this.clientPromise;
    }

    private buildPrompt(input: AttendanceAnalysisInput): string {
        return `
    I want you to act as a motivational coach.
    I will provide you with some information about someone's goals and challenges, and it will be your job to come up with strategies that can help this person achieve their goals.
    This could involve providing positive affirmations, giving helpful advice or suggesting activities they can do to reach their end goal.

    Here is the attendance data for a user named "${input.username}".
    The user has the following data:
    - Total attendance records: ${input.totalRecords}
    - Current streak: ${input.currentStreak} days
    - Maximum streak: ${input.maxStreak} days
    - Maximum streak before 7:00 AM: ${input.maxBeforeSevenStreak} days
    - Latest attendance: ${input.latestAttendance.toLocaleString()}

    Provide an insightful analysis of the user's performance and suggest personalized motivational advice to encourage further progress.
    Make it supportive and engaging.
    Make it less than 100 words.
    `;
    }

    async analyzeAttendance(input: AttendanceAnalysisInput): Promise<string> {
        try {
            const ai = await this.getClient();
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: this.buildPrompt(input),
            });
            return response.text?.trim() || FALLBACK_MESSAGE;
        } catch (error) {
            logger.error("Failed to generate AI attendance analysis", error);
            return FALLBACK_MESSAGE;
        }
    }
}
