import { describe, it, expect, vi, afterEach } from "vitest";
import User from "../models/User";
import { UserRepository } from "./UserRepository";

const repo = new UserRepository();

afterEach(() => vi.restoreAllMocks());

describe("UserRepository", () => {
    it("findByDiscordId queries by discordId", async () => {
        const findOne = vi
            .spyOn(User, "findOne")
            .mockResolvedValue({ id: 1 } as never);
        await repo.findByDiscordId("abc");
        expect(findOne).toHaveBeenCalledWith({ where: { discordId: "abc" } });
    });

    it("findById delegates to findByPk", async () => {
        const findByPk = vi
            .spyOn(User, "findByPk")
            .mockResolvedValue({ id: 3 } as never);
        await repo.findById(3);
        expect(findByPk).toHaveBeenCalledWith(3);
    });

    it("findOrCreate returns the user and created flag", async () => {
        vi.spyOn(User, "findOrCreate").mockResolvedValue([
            { id: 1, username: "a" },
            true,
        ] as never);

        const result = await repo.findOrCreate("abc", "a");
        expect(result).toEqual({ user: { id: 1, username: "a" }, created: true });
    });
});
