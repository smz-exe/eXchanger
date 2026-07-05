import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isValidCommand, loadCommands } from "./commandLoader";

describe("isValidCommand", () => {
    const valid = {
        data: { toJSON: () => ({ name: "ping", description: "pong" }) },
        execute: async () => {},
    };

    it("accepts a well-formed command", () => {
        expect(isValidCommand(valid)).toBe(true);
    });

    it("rejects a command without execute", () => {
        expect(isValidCommand({ data: valid.data })).toBe(false);
    });

    it("rejects a command whose data lacks name/description", () => {
        expect(
            isValidCommand({ data: { toJSON: () => ({}) }, execute: async () => {} })
        ).toBe(false);
    });

    it("rejects non-objects", () => {
        expect(isValidCommand(null)).toBe(false);
        expect(isValidCommand(undefined)).toBe(false);
        expect(isValidCommand("cmd")).toBe(false);
    });
});

describe("loadCommands", () => {
    let dir: string;

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "cmdloader-"));
        const feature = path.join(dir, "feature");
        fs.mkdirSync(feature);

        fs.writeFileSync(
            path.join(feature, "good.js"),
            `module.exports = { data: { toJSON: () => ({ name: "good", description: "d" }) }, execute: async () => {} };`
        );
        fs.writeFileSync(
            path.join(feature, "bad.js"),
            `module.exports = { nope: true };`
        );
        // Should be ignored by the loader.
        fs.writeFileSync(path.join(feature, "good.test.js"), `module.exports = {};`);
        // A stray file at the top level (not a directory) should be skipped.
        fs.writeFileSync(path.join(dir, "README.md"), "not a command");
    });

    afterAll(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("loads only valid command modules and skips the rest", () => {
        const commands = loadCommands(dir);
        expect(commands).toHaveLength(1);
        expect(commands[0].data.toJSON().name).toBe("good");
    });
});
