# Frontend environment names only

Full manifest: `environment-requirements.md` in this folder.

Build-time `VITE_*` names from `.env.example`:

```text
VITE_API_URL
VITE_STAGE
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_MAPS_API_KEY
VITE_RAZORPAY_KEY_ID
VITE_PUBLIC_APP_URL
```

No secret values. `VITE_API_URL` may be unset locally (Vite `/api` proxy).
