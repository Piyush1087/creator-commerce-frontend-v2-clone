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

Once your AWS profiles and WSL environment are set up, and your backend is deployed, you can deploy the frontend.

Create `.env` in the repo root before deploy (not committed):

```env
VITE_RAZORPAY_KEY_ID=rzp_test_...   # public key — same Key Id as backend for card top-up on dev
```

`sst.config.ts` loads `.env` via `dotenv` (devDependency) and passes `VITE_RAZORPAY_KEY_ID` into the Vite build.

```bash
# 1. Install dependencies
npm install

# 2. Build and Deploy to Dev
export AWS_PROFILE=creator-dev
export SST_SKIP_DEPENDENCY_CHECK=1
aws sso login --profile creator-dev
npx sst deploy --stage dev --print-logs

# Or Deploy to Prod
export AWS_PROFILE=creator-prod
npx sst deploy --stage prod --print-logs
```

### Pulumi path (common error)

After the first successful deploy, SST stores Pulumi at `~/.config/sst/bin/pulumi` (a **binary file**).

Use `SST_SKIP_DEPENDENCY_CHECK=1` to avoid re-install checks. **Do not** set:

```bash
export SST_PULUMI_PATH="$HOME/.config/sst/bin/pulumi"  # wrong — causes pulumi/bin/pulumi error
```

If deploy fails with `pulumi/bin/pulumi: not a directory`:

```bash
unset SST_PULUMI_PATH
export SST_SKIP_DEPENDENCY_CHECK=1
~/.config/sst/bin/pulumi version
npx sst deploy --stage dev --print-logs
```

Run deploy as the same WSL user each time (`brian`, not `root`). See backend [deployment README](../../creator-commerce-backend-v2/docs/deployment/README.md#reuse-pulumi-skip-slow-download) for more detail.