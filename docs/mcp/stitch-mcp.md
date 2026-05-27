# Stitch UI/UX Design MCP Integration

Stitch is an AI-powered design tool that enables developers to generate, edit, and export UI screens directly. This repository integrates with Stitch using the Model Context Protocol (MCP).

You can interact with Stitch through:
1. **Direct Connection CLI:** A lightweight helper script in this workspace (`scripts/stitch-cli.mjs`).
2. **Gemini CLI Extension:** Natural language commands via Gemini CLI.

---

## 🛠️ Direct Connection CLI Helper (Recommended)

To bypass the Gemini CLI shell and run commands directly, use the script in `scripts/stitch-cli.mjs`.

### Prerequisites
* Ensure your Stitch API key is configured (see the **API Key Authentication** section below).
* Node.js (version 18+).

### Usage
Execute commands from the repository root:

```bash
# Get help & list commands
node scripts/stitch-cli.mjs --help

# List all projects owned by you
node scripts/stitch-cli.mjs list-projects

# List all screens in a project
node scripts/stitch-cli.mjs list-screens <projectId>

# Fetch details of a specific screen
node scripts/stitch-cli.mjs get-screen <projectId> <screenId>

# Generate a new screen design from a text prompt (uses Gemini 3.1 Pro)
node scripts/stitch-cli.mjs generate-screen <projectId> "A dark mode user settings panel with profile uploads"

# Edit an existing screen with a prompt
node scripts/stitch-cli.mjs edit-screen <projectId> <screenId> "Change the theme to light mode and add a cancel button"
```

---

## 🔐 Authentication Setup

Stitch supports two authentication methods: **API Key Mode** (simpler, recommended) and **Google Cloud OAuth / ADC Mode**.

### Option A: API Key Mode (Recommended)

1. **Obtain your API Key:**
   * Open [Stitch](https://stitch.withgoogle.com/).
   * Click your profile icon (top right) -> **Stitch Settings** -> **API Keys**.
   * Generate and copy the API key.

2. **Configure local environment (Windows PowerShell):**
   ```powershell
   # Set API Key environment variable
   $env:API_KEY="AQ.xxxxxxxxxxxxxxxxx"

   # Write configuration to the Stitch extension directory
   (Get-Content "$HOME\.gemini\extensions\Stitch\gemini-extension-apikey.json") `
     -replace "YOUR_API_KEY", $env:API_KEY `
     | Set-Content "$HOME\.gemini\extensions\Stitch\gemini-extension.json"
   ```

3. **Configure local environment (macOS/Linux):**
   ```bash
   export API_KEY="your-api-key-here"
   sed "s/YOUR_API_KEY/$API_KEY/g" ~/.gemini/extensions/Stitch/gemini-extension-apikey.json > ~/.gemini/extensions/Stitch/gemini-extension.json
   ```

---

### Option B: Google Cloud OAuth / ADC Mode

If specific APIs require OAuth credentials:

1. **Prerequisites:**
   * Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
   * Authenticate: `gcloud auth login` and `gcloud auth application-default login`.

2. **Enable Stitch MCP Service in your Google Cloud project:**
   ```powershell
   $env:PROJECT_ID="stitch-gemini-playground"
   
   gcloud config set project $env:PROJECT_ID
   gcloud auth application-default set-quota-project $env:PROJECT_ID
   gcloud beta services mcp enable stitch.googleapis.com --project=$env:PROJECT_ID
   ```

3. **Generate ADC-based Config (Windows PowerShell):**
   ```powershell
   (Get-Content "$HOME\.gemini\extensions\Stitch\gemini-extension-adc.json") `
     -replace "YOUR_PROJECT_ID", $env:PROJECT_ID `
     | Set-Content "$HOME\.gemini\extensions\Stitch\gemini-extension.json"
   ```

---

## 🚀 Gemini CLI Extension (Alternative)

If you prefer using natural language within Gemini CLI:

1. **Install Stitch Extension:**
   ```bash
   gemini extensions install https://github.com/gemini-cli-extensions/stitch --auto-update
   ```

2. **Start interactive Gemini session:**
   ```bash
   gemini
   ```

3. **Execute commands using the `/stitch` prefix:**
   ```text
   /stitch What Stitch projects do I have?
   /stitch Give me all screens of project 14443967781950308089
   ```
