import type { IUserRepository } from "../repositories/UserRepository";

export interface RegisterResult {
    username: string;
    created: boolean;
}

/** Handles user registration into the attendance/currency system. */
export class UserService {
    constructor(private readonly users: IUserRepository) {}

    /**
     * Register (or no-op if already registered) a Discord user.
     * Returns whether a new record was created.
     */
    async register(
        discordId: string,
        username: string
    ): Promise<RegisterResult> {
        const { user, created } = await this.users.findOrCreate(
            discordId,
            username
        );
        return { username: user.username, created };
    }
}
