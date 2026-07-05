import { describe, it, expect, vi, afterEach } from "vitest";
import { Op } from "sequelize";
import Transaction from "../models/Transaction";
import { TransactionRepository } from "./TransactionRepository";

const repo = new TransactionRepository();

afterEach(() => vi.restoreAllMocks());

describe("TransactionRepository.findForUser", () => {
    it("queries by user, sender, or recipient, newest first, with a limit", async () => {
        const findAll = vi
            .spyOn(Transaction, "findAll")
            .mockResolvedValue([] as never);

        await repo.findForUser(7, 10);

        expect(findAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [{ userId: 7 }, { senderId: 7 }, { recipientId: 7 }],
            },
            order: [["createdAt", "DESC"]],
            limit: 10,
        });
    });

    it("omits the limit when not provided", async () => {
        const findAll = vi
            .spyOn(Transaction, "findAll")
            .mockResolvedValue([] as never);

        await repo.findForUser(7);

        const arg = findAll.mock.calls[0][0] as Record<string, unknown>;
        expect(arg).not.toHaveProperty("limit");
    });
});

describe("TransactionRepository.create", () => {
    it("forwards data and the transaction to the model", async () => {
        const create = vi
            .spyOn(Transaction, "create")
            .mockResolvedValue({ id: 1 } as never);
        const tx = { id: "t" } as never;
        const data = {
            userId: 1,
            senderId: 1,
            recipientId: 2,
            type: "earn" as const,
            amount: 5,
            reason: null,
        };

        await repo.create(data, tx);
        expect(create).toHaveBeenCalledWith(data, { transaction: tx });
    });
});
