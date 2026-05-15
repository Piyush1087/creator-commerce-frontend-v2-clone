# Frontend Deployment

This repo keeps the existing frontend deployment identity from v1 to seamlessly take over routing and domains without having to tear down the SST stack completely:

- SST app: `creatorshop-fe`
- AWS region: `ap-south-1`
- Dev profile: `creator-dev`
- Prod profile: `creator-prod`
- Dev domain: `dashboard.dev.thecreatorshop.in`
- Prod domain: `dashboard.thecreatorshop.in`

Deployment is intentionally not run during initial setup. When v2 is ready to take over, **stop deploying the old frontend repo** for the target stage first.

The static build output is `dist`.

---

## WSL Environment Setup (Recommended)

For performance, clone the repository directly into your WSL home directory (e.g., `~/repos/`) rather than accessing it via the Windows `/mnt/c/` mount.

1. **Install AWS CLI in WSL**:
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS Profiles**:
   ```bash
   aws configure --profile creator-dev
   aws configure --profile creator-prod
   ```

---

## Deployment Workflows

Once your AWS profiles and WSL environment are set up, and your backend is deployed, you can deploy the frontend. Ensure your environment variables are configured properly (e.g., `VITE_STAGE`).

```bash
# 1. Install dependencies
npm install

# 2. Build and Deploy to Dev
npx sst deploy --stage dev

# Or Deploy to Prod
npx sst deploy --stage prod
```