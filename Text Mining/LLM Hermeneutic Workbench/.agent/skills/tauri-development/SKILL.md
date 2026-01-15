---
name: tauri-development
description: Run, build, and debug the LLM Hermeneutic Workbench Tauri application. Use when the user asks to "start the app", "run dev server", "build the app", "debug Tauri", or troubleshoot startup issues.
---

# Tauri Development

## Purpose

This skill provides the commands and procedures for running, building, and debugging the LLM Hermeneutic Workbench desktop application built with Tauri 2 + React 19 + Vite.

## When to Use

- User asks to "start the app" or "run the application"
- User wants to "run development mode" or "start dev server"
- User needs to "build for production" or "create a release"
- User reports the app won't start or has build errors
- User wants to test changes in the desktop application

## Instructions

### Start Development Mode

1. Navigate to the Tauri application directory:
   ```bash
   cd hermeneutic-workbench
   ```

2. Ensure dependencies are installed:
   ```bash
   npm install
   ```

3. Start full Tauri development mode (frontend + Rust backend):
   ```bash
   npm run tauri dev
   ```
   This compiles Rust code and starts Vite dev server with hot reload.

### Frontend-Only Development

For faster iteration on React components without Rust recompilation:

```bash
cd hermeneutic-workbench
npm run dev
```

Note: Tauri IPC calls will fail in browser-only mode.

### Build Production Release

```bash
cd hermeneutic-workbench
npm run tauri build
```

Output location: `hermeneutic-workbench/src-tauri/target/release/`

## Decision Tree

```
User wants to run the app?
├── Yes → Is it first time setup?
│   ├── Yes → Run `npm install` first, then `npm run tauri dev`
│   └── No → Run `npm run tauri dev`
└── User wants to build?
    └── Run `npm run tauri build`
```

## Common Pitfalls

1. **Missing Rust toolchain**: Run `rustup show` to verify Rust is installed
2. **Port already in use**: Kill existing Vite processes on port 1420
3. **Rust compilation errors**: Check `src-tauri/src/` for syntax issues
4. **CSS import order issues**: Ensure `app.css` is imported first (contains font imports)

## Verification

- Development mode: App window opens and console shows `[DataStore]` logs
- Production build: `.dmg` or `.app` file created in `target/release/bundle/`
- Check terminal for `Compiled successfully` message
