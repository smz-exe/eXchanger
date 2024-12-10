import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db_name = process.env.DB_NAME;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST || "localhost";

if (!db_name || !username || !password) {
    throw new Error(
        "Missing required environment variables: DB_NAME, DB_USERNAME, DB_PASSWORD"
    );
}

const sequelize = new Sequelize(db_name, username, password, {
    host,
    dialect: "postgres",
    logging: false,
});

export default sequelize;
