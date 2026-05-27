#!/usr/bin/env node
/**
 * Direct Connection CLI helper for Stitch MCP.
 * Run with: node scripts/stitch-cli.mjs <command> [args]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const url = 'https://stitch.googleapis.com/mcp';

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME;
}

async function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  // 1. Check API_KEY env variable first
  if (process.env.API_KEY) {
    headers['X-Goog-Api-Key'] = process.env.API_KEY;
    return headers;
  }

  // 2. Resolve local gemini-extension.json config
  const home = getHomeDir();
  if (home) {
    const configPath = path.join(home, '.gemini', 'extensions', 'Stitch', 'gemini-extension.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const mcpServer = config.mcpServers?.stitch;
        
        if (mcpServer) {
          // Check if OAuth/ADC is configured
          if (mcpServer.authProviderType === 'google_credentials') {
            const project = mcpServer.headers?.['X-Goog-User-Project'] || process.env.PROJECT_ID;
            if (project) {
              headers['X-Goog-User-Project'] = project;
            }
            try {
              // Try printing access token using gcloud
              const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
              headers['Authorization'] = `Bearer ${token}`;
              return headers;
            } catch (e) {
              console.warn('⚠️ Warning: Failed to retrieve gcloud credentials. Ensure you have run: gcloud auth login');
            }
          }
          
          // Fallback to API Key mode
          const apiKey = mcpServer.headers?.['X-Goog-Api-Key'];
          if (apiKey) {
            headers['X-Goog-Api-Key'] = apiKey;
            return headers;
          }
        }
      } catch (e) {
        // config parsing error, ignore and throw later
      }
    }
  }

  throw new Error('Could not find active Stitch API Key or OAuth credentials. Please set the API_KEY environment variable or configure the Stitch extension.');
}

async function callStitchTool(toolName, args = {}) {
  const headers = await getHeaders();
  
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stitch server error (${response.status}): ${text}`);
  }
  
  const data = await response.json();
  if (data.error) {
    throw new Error(`Stitch MCP error: ${JSON.stringify(data.error)}`);
  }
  
  return data.result;
}

async function run() {
  const command = process.argv[2];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
🚀 Stitch MCP Command Line Interface

Usage:
  node scripts/stitch-cli.mjs <command> [arguments]

Commands:
  list-projects                           List all Stitch projects owned by you
  list-screens <projectId>                List all screens within a project
  get-screen <projectId> <screenId>       Retrieve details of a specific screen
  generate-screen <projectId> <prompt>    Generate a new screen from text
  edit-screen <projectId> <screenId> <prompt>  Edit a screen with a prompt

Examples:
  node scripts/stitch-cli.mjs list-projects
  node scripts/stitch-cli.mjs list-screens 14443967781950308089
  node scripts/stitch-cli.mjs generate-screen 14443967781950308089 "A beautiful modern SaaS landing page"
`);
    process.exit(0);
  }

  if (command === 'list-projects') {
    try {
      const result = await callStitchTool('list_projects');
      const content = JSON.parse(result.content[0].text);
      console.log('\n📁 Stitch Projects:\n');
      if (!content.projects || content.projects.length === 0) {
        console.log('No projects found.');
      } else {
        content.projects.forEach(p => {
          const id = p.name.split('/').pop();
          console.log(`- \x1b[36m${p.title}\x1b[0m`);
          console.log(`  ID: ${id}`);
          console.log(`  Visibility: ${p.visibility}`);
          console.log(`  Role: ${p.metadata?.userRole}`);
          console.log(`  Updated: ${new Date(p.updateTime).toLocaleString()}`);
          console.log('');
        });
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } 
  
  else if (command === 'list-screens') {
    const projectId = process.argv[3];
    if (!projectId) {
      console.error('❌ Error: projectId is required.');
      process.exit(1);
    }
    try {
      const result = await callStitchTool('list_screens', { projectId });
      const content = JSON.parse(result.content[0].text);
      console.log(`\n🖥️  Screens for Project ${projectId}:\n`);
      if (!content.screens || content.screens.length === 0) {
        console.log('No screens found in this project.');
      } else {
        content.screens.forEach(s => {
          const id = s.name.split('/').pop();
          console.log(`- \x1b[32m${s.title || 'Untitled Screen'}\x1b[0m`);
          console.log(`  ID: ${id}`);
          console.log(`  Type: ${s.screenType}`);
          console.log(`  Status: ${s.screenMetadata?.status || 'UNKNOWN'}`);
          if (s.prompt) console.log(`  Prompt: "${s.prompt}"`);
          console.log('');
        });
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } 
  
  else if (command === 'get-screen') {
    const projectId = process.argv[3];
    const screenId = process.argv[4];
    if (!projectId || !screenId) {
      console.error('❌ Error: Both projectId and screenId are required.');
      process.exit(1);
    }
    try {
      const result = await callStitchTool('get_screen', {
        name: `projects/${projectId}/screens/${screenId}`,
        projectId,
        screenId
      });
      const s = JSON.parse(result.content[0].text);
      console.log(`\n🖥️  Screen Details:`);
      console.log(`- Title: \x1b[32m${s.title || 'Untitled Screen'}\x1b[0m`);
      console.log(`- ID: ${screenId}`);
      console.log(`- Type: ${s.screenType}`);
      console.log(`- Status: ${s.screenMetadata?.status || 'UNKNOWN'}`);
      console.log(`- Summary: ${s.screenMetadata?.summary || 'No summary'}`);
      if (s.prompt) console.log(`- Prompt: "${s.prompt}"`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } 
  
  else if (command === 'generate-screen') {
    const projectId = process.argv[3];
    const prompt = process.argv[4];
    if (!projectId || !prompt) {
      console.error('❌ Error: Both projectId and prompt are required.');
      process.exit(1);
    }
    try {
      console.log(`🚀 Generating screen in project ${projectId}...`);
      console.log(`Prompt: "${prompt}"`);
      console.log('This can take 2-3 minutes. Please do not close or exit...');
      
      const result = await callStitchTool('generate_screen_from_text', {
        projectId,
        prompt,
        modelId: 'GEMINI_3_1_PRO'
      });
      
      console.log('\n✨ Generation request completed!');
      if (result.content && result.content[0]) {
        try {
          const payload = JSON.parse(result.content[0].text);
          console.log('Response:', JSON.stringify(payload, null, 2));
        } catch (e) {
          console.log('Raw Output:', result.content[0].text);
        }
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } 
  
  else if (command === 'edit-screen') {
    const projectId = process.argv[3];
    const screenId = process.argv[4];
    const prompt = process.argv[5];
    if (!projectId || !screenId || !prompt) {
      console.error('❌ Error: projectId, screenId, and prompt are required.');
      process.exit(1);
    }
    try {
      console.log(`🚀 Editing screen ${screenId} in project ${projectId}...`);
      console.log(`Prompt: "${prompt}"`);
      console.log('This can take 2-3 minutes. Please do not close or exit...');
      
      const result = await callStitchTool('edit_screens', {
        projectId,
        selectedScreenIds: [screenId],
        prompt,
        modelId: 'GEMINI_3_1_PRO'
      });
      
      console.log('\n✨ Edit request completed!');
      if (result.content && result.content[0]) {
        try {
          const payload = JSON.parse(result.content[0].text);
          console.log('Response:', JSON.stringify(payload, null, 2));
        } catch (e) {
          console.log('Raw Output:', result.content[0].text);
        }
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } 
  
  else {
    console.error(`❌ Unknown command: "${command}". Run with --help for options.`);
    process.exit(1);
  }
}

run();
