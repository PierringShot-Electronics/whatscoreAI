# Repository Guidelines

Active target: `WhatsCore.AI_5.0.1` (Node.js/Express). Contribute by mirroring the layered design and keeping business logic in services.

## Project Structure & Module Organization
- `WhatsCore.AI_5.0.1/index.js`: Express entry, Swagger, graceful shutdown.
- `WhatsCore.AI_5.0.1/src/`: Core logic (`agents/`, `controllers/`, `services/`, `middleware/`, `utils/`, `schemas/`).
- `WhatsCore.AI_5.0.1/api/`: API routes mounted at `/api`.
- `WhatsCore.AI_5.0.1/public/`: Admin UI at `/admin` and `/static` (basic auth).
- `WhatsCore.AI_5.0.1/test/`: Mocha test suites.
- `WhatsCore.AI_5.0.1/{data,logs,tmp,media}/`: App state and artifacts.
Pattern: route → controller → service → utils; validate inputs in `schemas/`.

See also: `docs/Project_Maverick_v5.0_System_Guide_az.md` for the full system roadmap and agent instructions.

## Build, Test, and Development
Run from `WhatsCore.AI_5.0.1/`:
- `npm install`: Install dependencies.
- `npm run dev`: Start with nodemon for local development.
- `SKIP_WHATSAPP=true npm start`: Start API (base port `5051`; honors `NODE_APP_INSTANCE` offset). Swagger at `/docs` when `docs/openapi.yaml` exists.
- `SKIP_WHATSAPP=true npm test`: Run Mocha tests (`test/**/*.spec.js`).
- `npm run lint`: Lint with ESLint.
- `npm run setup`: Initial setup via `start.sh`.

## Coding Style & Naming
- JavaScript: 4-space indentation, keep semicolons, descriptive names.
- Filenames: camelCase (e.g., `whatsappController.js`, `productManager.js`).
- Keep controllers thin; place logic in services; centralize helpers.

## Testing Guidelines
- Frameworks: Mocha + Chai + Sinon + Supertest.
- Location: `test/**/*.spec.js`; use fixtures under `data/`.
- Isolation: set `SKIP_WHATSAPP=true`; mock external clients.
- Clean up temp artifacts created during tests.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(api): add order endpoint`).
- PRs: clear description, linked issues, reproduction steps, API examples; include env/config notes when needed.
- Quality gates: update/add tests for changed behavior and ensure `npm run lint` passes.

## Security & Configuration
- Never commit secrets; use `.env` (see `.env.example`).
- Configure basic auth for `/admin` and `/static` via env.
- Monitor media/log sizes; avoid large files in Git.
