# Frontend Deployment

This repo keeps the existing frontend deployment identity:

- SST app: `creatorshop-fe`
- AWS region: `ap-south-1`
- Dev profile: `creator-dev`
- Prod profile: `creator-prod`
- Dev domain: `dashboard.dev.thecreatorshop.in`
- Prod domain: `dashboard.thecreatorshop.in`

Deployment is intentionally not run during initial setup. When v2 is ready to
take over, stop deploying the old frontend repo for the target stage first.

The static build output is `dist`.
