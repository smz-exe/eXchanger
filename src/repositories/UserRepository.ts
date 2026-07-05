import type { Transaction as DbTransaction } from "sequelize";
import User from "../models/User";

export interface IUserRepository {
    findByDiscordId(discordId: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findOrCreate(
        discordId: string,
        username: string
    ): Promise<{ user: User; created: boolean }>;
}

export class UserRepository implements IUserRepository {
    async findByDiscordId(discordId: string): Promise<User | null> {
        return User.findOne({ where: { discordId } });
    }

    async findById(id: number): Promise<User | null> {
        return User.findByPk(id);
    }

    async findOrCreate(
        discordId: string,
        username: string,
        transaction?: DbTransaction
    ): Promise<{ user: User; created: boolean }> {
        const [user, created] = await User.findOrCreate({
            where: { discordId },
            defaults: { discordId, username },
            transaction,
        });
        return { user, created };
    }
}
