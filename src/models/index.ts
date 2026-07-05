import sequelize from "../db/sequelize";
import { env, isProduction } from "../config/env";
import { logger } from "../lib/logger";
import User from "./User";
import Currency from "./Currency";
import Transaction from "./Transaction";
import Attendance from "./Attendance";

/**
 * Associations are declared here (not inside each model file) so import order
 * never matters and the full relationship graph is visible in one place.
 */
function defineAssociations(): void {
    User.hasOne(Currency, { foreignKey: "userId", as: "currency" });
    Currency.belongsTo(User, { foreignKey: "userId", as: "user" });

    User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
    Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });
    Transaction.belongsTo(User, { foreignKey: "senderId", as: "sender" });
    Transaction.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

    User.hasMany(Attendance, { foreignKey: "userId", as: "attendances" });
    Attendance.belongsTo(User, { foreignKey: "userId", as: "user" });
}

defineAssociations();

/**
 * Establish the DB connection and synchronize the schema.
 *
 * `alter: true` is convenient in development but risky in production (it can
 * silently drop/rebuild columns), so schema sync is only auto-applied outside
 * production. In production, run explicit migrations instead.
 */
export async function initDatabase(): Promise<void> {
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    if (isProduction) {
        await sequelize.sync();
        logger.info("Models synchronized (production, no alter).");
    } else {
        await sequelize.sync({ alter: true });
        logger.info(`Models synchronized (${env.NODE_ENV}, alter: true).`);
    }
}

export { sequelize, User, Currency, Transaction, Attendance };
