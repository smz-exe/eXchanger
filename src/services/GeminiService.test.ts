import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiService } from "./GeminiService";

const { generateContent } = vi.hoisted(() => ({
    generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
    GoogleGenAI: class {
        models = { generateContent };
        constructor(_config: unknown) {}
    },
}));

const input = {
    username: "alice",
    totalRecords: 10,
    currentStreak: 5,
    maxStreak: 7,
    maxBeforeSevenStreak: 3,
    latestAttendance: new Date(2026, 0, 6, 6, 0),
};

describe("GeminiService.analyzeAttendance", () => {
    beforeEach(() => {
        generateContent.mockReset();
    });

    it("returns the trimmed model response", async () => {
        generateContent.mockResolvedValue({ text: "  Great work!  " });
        const service = new GeminiService("key");
        expect(await service.analyzeAttendance(input)).toBe("Great work!");
    });

    it("falls back to an encouraging message when the API fails", async () => {
        generateContent.mockRejectedValue(new Error("quota exceeded"));
        const service = new GeminiService("key");
        const result = await service.analyzeAttendance(input);
        expect(result).toContain("Keep shining");
    });

    it("falls back when the response has no text", async () => {
        generateContent.mockResolvedValue({ text: undefined });
        const service = new GeminiService("key");
        const result = await service.analyzeAttendance(input);
        expect(result).toContain("Keep shining");
    });

    it("constructs the client only once across calls", async () => {
        generateContent.mockResolvedValue({ text: "ok" });
        const service = new GeminiService("key");
        await service.analyzeAttendance(input);
        await service.analyzeAttendance(input);
        expect(generateContent).toHaveBeenCalledTimes(2);
    });
});
