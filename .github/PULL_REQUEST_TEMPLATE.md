## Summary

- What change does this PR introduce and why?
- Link any related issue(s): Fixes #

## Checklist

- [ ] Code follows project structure (route → controller → service → utils).
- [ ] Input validation added/updated where applicable (`schemas/`).
- [ ] No secrets added to code; config via `.env` only.
- [ ] Lint passes: `npm run lint` (from `WhatsCore.AI_5.0.1/`).
- [ ] Tests pass locally: `SKIP_WHATSAPP=true npm test`.
- [ ] Updated docs (AGENTS.md/README, Swagger `docs/openapi.yaml` if API changes).
- [ ] Considered backward compatibility; API contracts unchanged or documented.

## Testing Notes

- Steps to reproduce and verify the change locally:
  1. `cd WhatsCore.AI_5.0.1 && npm install`
  2. `SKIP_WHATSAPP=true npm test`
  3. (If applicable) describe manual validation (e.g., `/api` calls)

## Screenshots / Logs (optional)

## Deployment Considerations

- [ ] Requires env/config changes
- [ ] Data migrations or one-off scripts
