import type { Transaction as DbTransaction } from "sequelize";
import sequelize from "./db/sequelize";
import { env } from "./config/env";
import { UserRepository } from "./repositories/UserRepository";
import { CurrencyRepository } from "./repositories/CurrencyRepository";
import { TransactionRepository } from "./repositories/TransactionRepository";
import { AttendanceRepository } from "./repositories/AttendanceRepository";
import { UserService } from "./services/UserService";
import { AttendanceService } from "./services/AttendanceService";
import { CurrencyService } from "./services/CurrencyService";
import { GeminiService } from "./services/GeminiService";
import type { TransactionRunner } from "./services/CurrencyService";

/**
 * Composition root. Instantiates repositories and services once and wires
 * their dependencies. Command handlers import the ready-made services from
 * here; tests construct services directly with mocked repositories instead.
 */

const userRepository = new UserRepository();
const currencyRepository = new CurrencyRepository();
const transactionRepository = new TransactionRepository();
const attendanceRepository = new AttendanceRepository();

const transactionRunner: TransactionRunner = {
    transaction: <T>(fn: (t: DbTransaction) => Promise<T>) =>
        sequelize.transaction(fn),
};

export const userService = new UserService(userRepository);

export const attendanceService = new AttendanceService(
    userRepository,
    attendanceRepository
);

export const currencyService = new CurrencyService(
    userRepository,
    currencyRepository,
    transactionRepository,
    transactionRunner
);

export const geminiService = new GeminiService(env.GEMINI_API_KEY);

/** Repositories are exported for callers that need raw data access. */
export const repositories = {
    users: userRepository,
    currencies: currencyRepository,
    transactions: transactionRepository,
    attendance: attendanceRepository,
};
