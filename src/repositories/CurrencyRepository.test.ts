import { describe, it, expect, vi, afterEach } from "vitest";
import Currency from "../models/Currency";
import { CurrencyRepository } from "./CurrencyRepository";

const repo = new CurrencyRepository();

afterEach(() => vi.restoreAllMocks());

describe("CurrencyRepository.getBalance", () => {
    it("returns the stored balance", async () => {
        vi.spyOn(Currency, "findOne").mockResolvedValue({
            balance: 120,
        } as never);
        expect(await repo.getBalance(1)).toBe(120);
    });

    it("returns 0 when the user has no currency row", async () => {
        vi.spyOn(Currency, "findOne").mockResolvedValue(null);
        expect(await repo.getBalance(1)).toBe(0);
    });
});

describe("CurrencyRepository.addBalance", () => {
    it("increments atomically and reloads the row", async () => {
        const increment = vi.fn().mockResolvedValue(undefined);
        const reload = vi.fn().mockResolvedValue(undefined);
        const instance = { balance: 150, increment, reload };
        vi.spyOn(Currency, "findOrCreate").mockResolvedValue([
            instance,
            true,
        ] as never);

        const result = await repo.addBalance(2, 50);

        expect(increment).toHaveBeenCalledWith("balance", {
            by: 50,
            transaction: undefined,
        });
        expect(reload).toHaveBeenCalled();
        expect(result).toBe(instance);
    });
});
