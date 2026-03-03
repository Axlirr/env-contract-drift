# env-contract-drift

Detect environment variable drift across code, Docker Compose, and CI/workflow files.

## Why
In many repos, `.env.example`, app code, Docker, and CI drift out of sync. That causes failed deploys and broken environments.

This CLI scans your repo and reports:
- variables **referenced in code but missing** in `.env.example`
- variables **declared in `.env.example` but unused** in code
- file-level reference map

## Install

```bash
npm i -g env-contract-drift
```

Or run locally from source:

```bash
npm install
node bin/env-contract-drift.js scan
```

## Usage

```bash
env-contract-drift scan
env-contract-drift scan --root . --env .env.example
env-contract-drift scan --format json
```

## Output

- Exit code `0`: no missing env vars detected
- Exit code `2`: missing vars found (useful for CI)

## Example CI step

```yaml
- name: Env contract check
  run: env-contract-drift scan --root . --env .env.example
```

## Roadmap

- Framework-aware parsing improvements
- Ignore/include globs
- GitHub Action wrapper
- Optional `.env.contract.json` schema mode

## License
MIT
