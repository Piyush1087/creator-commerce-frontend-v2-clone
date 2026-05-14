# Frontend Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

The frontend expects the backend API at `VITE_API_URL`. For local backend work,
use `http://localhost:3000`.
