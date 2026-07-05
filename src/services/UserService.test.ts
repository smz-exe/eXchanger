import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./UserService";
import type { IUserRepository } from "../repositories/UserRepository";

describe("UserService.register", () => {
    let users: IUserRepository;
    let service: UserService;

    beforeEach(() => {
        users = {
            findByDiscordId: vi.fn(),
            findById: vi.fn(),
            findOrCreate: vi.fn(),
        };
        service = new UserService(users);
    });

    it("reports a newly created user", async () => {
        vi.mocked(users.findOrCreate).mockResolvedValue({
            user: { username: "alice" } as never,
            created: true,
        });

        const result = await service.register("d1", "alice");
        expect(result).toEqual({ username: "alice", created: true });
        expect(users.findOrCreate).toHaveBeenCalledWith("d1", "alice");
    });

    it("reports an already-registered user", async () => {
        vi.mocked(users.findOrCreate).mockResolvedValue({
            user: { username: "bob" } as never,
            created: false,
        });

        const result = await service.register("d2", "bob");
        expect(result).toEqual({ username: "bob", created: false });
    });
});
