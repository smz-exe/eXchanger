# eXchanger

A Discord bot for early-morning attendance tracking and a virtual currency
("Jam"), built with TypeScript, discord.js v14, Sequelize/PostgreSQL, and
Google Gemini for motivational analysis.

## Features

| Command         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `/register`     | Sign up to the attendance & currency system.             |
| `/attend`       | Mark attendance (05:00–09:00); tracks streaks.           |
| `/record`       | View attendance stats + an AI motivational analysis.     |
| `/balance`      | Check your current Jam balance.                          |
| `/transactions` | View your recent transaction history.                    |
| `/addjam`       | (Admin) Grant Jam to a user — atomic balance + ledger.   |
| `/ping`         | Health check with WebSocket latency.                     |

## Architecture

Layered, with thin Discord adapters over testable business logic:

```
src/
  config/        env loading + Zod validation (fail-fast)
  lib/           logger, errors, embeds, constants, command loader
  db/            Sequelize connection
  models/        Sequelize models + associations + initDatabase()
  repositories/  data access (interface + implementation per aggregate)
  services/      business logic (streak math, currency, registration, Gemini)
  commands/      slash-command adapters (feature folders)
  events/        Discord event handlers
  container.ts   composition root (wires repositories → services)
  index.ts       bootstrap
```

- **Commands** parse the interaction, call a **service**, and render an embed.
- **Services** hold the logic and depend on **repository interfaces**, so they
  are unit-tested with mocks — no database required.
- The attendance streak math lives in `services/attendance/streak.ts` as pure
  functions.
- `/addjam` writes the balance update and the transaction record inside a
  single DB transaction (atomic).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` from the template and fill in your values:

   ```bash
   cp .env.example .env
   ```

3. Register slash commands with Discord (run once, or after changing commands):

   ```bash
   npm run deploy-commands
   ```

## Scripts

| Script                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Run in watch mode with `tsx`.                  |
| `npm run build`         | Clean `dist/` and compile with `tsc`.          |
| `npm start`             | Run the compiled bot (`dist/index.js`).        |
| `npm run deploy-commands` | Register slash commands to the guild.        |
| `npm run typecheck`     | Type-check without emitting.                   |
| `npm run lint`          | Lint with ESLint (flat config).                |
| `npm test`              | Run the Vitest suite.                          |
| `npm run test:coverage` | Run tests with a coverage report.              |

## Testing

Unit tests use [Vitest](https://vitest.dev). Services and repositories are
tested in isolation with mocked dependencies; the pure streak logic is tested
exhaustively. Coverage is enforced at 80%+.

```bash
npm run test:coverage
```

## Requirements

- Node.js 20+ (developed on Node 24)
- PostgreSQL
