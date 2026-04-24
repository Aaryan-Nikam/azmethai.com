# Extractor Worker

This package contains the document extraction and compliance worker runtime that was previously nested inside the frontend app.

## Purpose

- Keep worker code isolated from Next.js build and deploy steps.
- Allow independent dependency management for queue workers and extraction pipelines.
- Reduce recurring frontend deploy failures caused by non-frontend code drift.

## Structure

- `src/Extractor/` Worker, extraction, reconciliation, and test harness modules.
- `src/shared-types/` Shared type contracts used by worker reconciliation.

## Scripts

- `npm run dev:invoice-worker` Start invoice extraction worker.
- `npm run dev:compliance-worker` Start compliance extraction worker.
- `npm run dev:approvals-api` Start approvals API worker process.
- `npm run typecheck` Run TypeScript type-checking.
- `npm test` Run tests.
