# env-contract-drift

[![CI](https://github.com/Axlirr/env-contract-drift/actions/workflows/ci.yml/badge.svg)](https://github.com/Axlirr/env-contract-drift/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/env-contract-drift)](https://www.npmjs.com/package/env-contract-drift)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight CLI to detect **environment variable contract drift** across your codebase, Docker Compose files, and CI workflows.

> Stop discovering missing env vars at deploy time.

## Why this exists

In many repos, `.env.example` becomes stale while app code and infra files evolve.
That leads to:

- failed deploys
- broken local setups
- hidden config debt between teams

`env-contract-drift` scans your project and reports:

- variables **referenced in code but missing** in `.env.example`
- variables **declared in `.env.example` but unused** in code
- file-level env variable reference map

## Features

- ✅ Fast repository scan
- ✅ Works across app + infra files
- ✅ Human-readable output (`text`)
- ✅ Machine-readable output (`json`)
- ✅ CI-friendly non-zero exit code when required vars are missing

## Installation

### Global

```bash
npm i -g env-contract-drift
```

### Local (from source)

```bash
git clone https://github.com/Axlirr/env-contract-drift.git
cd env-contract-drift
npm install
```

## Usage

```bash
env-contract-drift scan
env-contract-drift scan --root . --env .env.example
env-contract-drift scan --format json
```

### Options

- `--root, -r` root directory to scan (default: current directory)
- `--env, -e` env contract file path (default: `.env.example`)
- `--format, -f` output format: `text` or `json` (default: `text`)

## Exit codes

- `0` — scan completed with no missing required vars
- `2` — one or more referenced vars are missing in the env contract file
- `1` — usage/runtime error

## CI integration

```yaml
- name: Env contract drift check
  run: env-contract-drift scan --root . --env .env.example
```

This will fail your pipeline when required variables are missing.

## Example output (text)

```text
🔍 env-contract-drift
Root: /repo
Env file: .env.example

Scanned: 218 files | With refs: 23
Referenced vars: 41 | Declared vars: 38

❗ Missing in .env.example:
  - STRIPE_WEBHOOK_SECRET
  - REDIS_URL

⚠️ Unused in .env.example:
  - OLD_ANALYTICS_KEY
```

## Roadmap

- include/exclude glob support
- optional `.env.contract.json` schema mode
- framework-aware parsing improvements
- GitHub Action wrapper

## License

MIT
