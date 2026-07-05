import { describe, it, expect } from "vitest";
import { errorEmbed, successEmbed, warningEmbed } from "./embeds";
import { COLORS } from "./constants";

describe("embed helpers", () => {
    it("errorEmbed uses the error color and default title", () => {
        const json = errorEmbed("something broke").toJSON();
        expect(json.color).toBe(COLORS.ERROR);
        expect(json.title).toBe("Error ⚠️");
        expect(json.description).toBe("something broke");
    });

    it("errorEmbed accepts a custom title", () => {
        expect(errorEmbed("x", "Custom").toJSON().title).toBe("Custom");
    });

    it("successEmbed uses the success color", () => {
        const json = successEmbed("Done", "great").toJSON();
        expect(json.color).toBe(COLORS.SUCCESS);
        expect(json.title).toBe("Done");
    });

    it("warningEmbed uses the warning color", () => {
        expect(warningEmbed("Heads up", "careful").toJSON().color).toBe(
            COLORS.WARNING
        );
    });
});
