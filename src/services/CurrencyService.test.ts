import { describe, it, expect, vi, beforeEach } from "vitest";
import { CurrencyService, type TransactionRunner } from "./CurrencyService";
import { ConfigurationError } from "../lib/errors";
import type { IUserRepository } from "../repositories/UserRepository";
import type { ICurrencyRepository } from "../repositories/CurrencyRepository";
import type { ITransactionRepository } from "../repositories/TransactionRepository";

const FAKE_TX = { id: "tx-sentinel" } as never;

function makeUserRepo(): IUserRepository {
    return {
        findByDiscordId: vi.fn(),
        findById: vi.fn(),
        findOrCreate: vi.fn(),
    };
}

function makeCurrencyRepo(): ICurrencyRepository {
    return {
        findByUserId: vi.fn(),
        getBalance: vi.fn(),
        findOrCreateForUser: vi.fn(),
        addBalance: vi.fn(),
    };
}

function makeTransactionRepo(): ITransactionRepository {
    return {
        create: vi.fn(),
        findForUser: vi.fn(),
    };
}

/** Runner that passes a sentinel transaction and propagates errors/rollback. */
function makeRunner(): TransactionRunner {
    return {
        transaction: vi.fn(async (fn) => fn(FAKE_TX)),
    };
}

describe("CurrencyService.addJam", () => {
    let users: IUserRepository;
    let currencies: ICurrencyRepository;
    let transactions: ITransactionRepository;
    let runner: TransactionRunner;
    let service: CurrencyService;

    beforeEach(() => {
        users = makeUserRepo();
        currencies = makeCurrencyRepo();
        transactions = makeTransactionRepo();
        runner = makeRunner();
        service = new CurrencyService(users, currencies, transactions, runner);
    });

    it("throws ConfigurationError when the system user is missing", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue(null);
        await expect(service.addJam("bot", "target", 10)).rejects.toBeInstanceOf(
            ConfigurationError
        );
    });

    it("returns recipient_not_registered when the target is unknown", async () => {
        vi.mocked(users.findByDiscordId)
            .mockResolvedValueOnce({ id: 99 } as never) // system user
            .mockResolvedValueOnce(null); // recipient

        const result = await service.addJam("bot", "target", 10);
        expect(result).toEqual({ status: "recipient_not_registered" });
        expect(runner.transaction).not.toHaveBeenCalled();
    });

    it("atomically credits balance and records the transaction", async () => {
        vi.mocked(users.findByDiscordId)
            .mockResolvedValueOnce({ id: 1 } as never) // system
            .mockResolvedValueOnce({ id: 2 } as never); // recipient
        vi.mocked(currencies.addBalance).mockResolvedValue({
            balance: 150,
        } as never);

        const result = await service.addJam("bot", "target", 50, "gift");

        expect(result).toEqual({ status: "ok", newBalance: 150 });
        expect(currencies.addBalance).toHaveBeenCalledWith(2, 50, FAKE_TX);
        expect(transactions.create).toHaveBeenCalledWith(
            {
                userId: 1,
                senderId: 1,
                recipientId: 2,
                type: "earn",
                amount: 50,
                reason: "gift",
            },
            FAKE_TX
        );
    });

    it("propagates errors so the transaction rolls back", async () => {
        vi.mocked(users.findByDiscordId)
            .mockResolvedValueOnce({ id: 1 } as never)
            .mockResolvedValueOnce({ id: 2 } as never);
        vi.mocked(currencies.addBalance).mockResolvedValue({
            balance: 10,
        } as never);
        vi.mocked(transactions.create).mockRejectedValue(new Error("db down"));

        await expect(service.addJam("bot", "target", 5)).rejects.toThrow(
            "db down"
        );
    });
});

describe("CurrencyService reads", () => {
    let users: IUserRepository;
    let currencies: ICurrencyRepository;
    let transactions: ITransactionRepository;
    let service: CurrencyService;

    beforeEach(() => {
        users = makeUserRepo();
        currencies = makeCurrencyRepo();
        transactions = makeTransactionRepo();
        service = new CurrencyService(
            users,
            currencies,
            transactions,
            makeRunner()
        );
    });

    it("getBalance returns null for unregistered users", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue(null);
        expect(await service.getBalance("d1")).toBeNull();
    });

    it("getBalance returns the stored balance", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 7 } as never);
        vi.mocked(currencies.getBalance).mockResolvedValue(42);
        expect(await service.getBalance("d1")).toBe(42);
        expect(currencies.getBalance).toHaveBeenCalledWith(7);
    });

    it("getHistory returns null for unregistered users", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue(null);
        expect(await service.getHistory("d1")).toBeNull();
    });

    it("getHistory returns the user's transactions", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 7 } as never);
        const rows = [{ id: 1 }] as never;
        vi.mocked(transactions.findForUser).mockResolvedValue(rows);

        const result = await service.getHistory("d1", 5);
        expect(result).toEqual({ userId: 7, transactions: rows });
        expect(transactions.findForUser).toHaveBeenCalledWith(7, 5);
    });
});
