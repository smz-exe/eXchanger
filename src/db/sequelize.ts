import { Sequelize } from "sequelize";
import { env } from "../config/env";

/**
 * The single Sequelize instance for the app. Models bind to this on import.
 * Connecting (authenticate/sync) is deferred to `initDatabase`.
 */
const sequelize = new Sequelize(env.DB_NAME, env.DB_USERNAME, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: "postgres",
    logging: false,
});

export default sequelize;
