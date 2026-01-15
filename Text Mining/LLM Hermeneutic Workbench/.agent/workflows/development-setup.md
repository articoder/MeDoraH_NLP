---
description: Set up and run the LLM Hermeneutic Workbench development environment
---

# Development Setup Workflow

This workflow guides you through setting up and running the LLM Hermeneutic Workbench for the first time.

## Prerequisites

Before starting, ensure you have:
- **Node.js** ≥ 18.x installed
- **Rust** stable toolchain installed (`rustup show` to verify)

## Steps

1. Navigate to the Tauri application directory:
   ```bash
   cd hermeneutic-workbench
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run tauri dev
   ```

4. Wait for both Vite and Rust to compile. The app window will open automatically.

## Troubleshooting

- **Rust not found**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node version too old**: Use `nvm install 18` to upgrade
- **Port 1420 in use**: Kill existing processes with `lsof -i :1420 | xargs kill`
- **Build fails**: Try `rm -rf node_modules && npm install`

## Verification

The setup is successful when:
- App window opens showing "Welcome to LLM Hermeneutic Workbench"
- Console shows `[DataStore]` log messages
- "Open JSON" button is visible in the toolbar
