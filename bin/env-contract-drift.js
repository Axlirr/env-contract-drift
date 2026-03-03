#!/usr/bin/env node
import fs from "fs";
import path from "path";

const IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo", "coverage"]);
const TARGET_EXT = new Set([
  ".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx", ".py", ".go", ".java", ".rb", ".php", ".sh",
  ".yml", ".yaml", ".json", ".env", ".example", ".txt", ".toml", ".ini", ".conf", ""
]);

function parseArgs(argv) {
  const args = { cmd: argv[2] || "scan", root: process.cwd(), envFile: ".env.example", format: "text" };
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--root" || a === "-r") && argv[i + 1]) args.root = path.resolve(argv[++i]);
    else if ((a === "--env" || a === "-e") && argv[i + 1]) args.envFile = argv[++i];
    else if ((a === "--format" || a === "-f") && argv[i + 1]) args.format = argv[++i];
    else if (a === "--help" || a === "-h") args.cmd = "help";
  }
  return args;
}

function usage() {
  console.log(`env-contract-drift v0.1.0\n\nUsage:\n  env-contract-drift scan [--root <path>] [--env <path>] [--format text|json]\n\nExamples:\n  env-contract-drift scan\n  env-contract-drift scan --root . --env .env.example\n  env-contract-drift scan --format json`);
}

function readEnvExample(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const text = fs.readFileSync(filePath, "utf8");
  const set = new Set();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Z][A-Z0-9_]+)\s*=/);
    if (m) set.add(m[1]);
  }
  return set;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else {
      const ext = path.extname(entry.name);
      if (TARGET_EXT.has(ext) || entry.name.includes("env") || entry.name.includes("compose") || entry.name.includes("workflow")) {
        out.push(full);
      }
    }
  }
  return out;
}

function extractRefs(content) {
  const refs = new Set();
  const patterns = [
    /process\.env\.([A-Z][A-Z0-9_]+)/g,
    /process\.env\["([A-Z][A-Z0-9_]+)"\]/g,
    /process\.env\['([A-Z][A-Z0-9_]+)'\]/g,
    /\$\{([A-Z][A-Z0-9_]+)\}/g,
    /\b([A-Z][A-Z0-9_]+)\s*:\s*\$\{?[A-Z][A-Z0-9_]*\}?/g
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const val = m[1];
      if (val) refs.add(val);
    }
  }
  return refs;
}

function scan(root, envFileRel) {
  const envPath = path.isAbsolute(envFileRel) ? envFileRel : path.join(root, envFileRel);
  const declared = readEnvExample(envPath);
  const files = walk(root);

  const byFile = {};
  const referenced = new Set();

  for (const file of files) {
    let text = "";
    try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
    const refs = extractRefs(text);
    if (refs.size > 0) {
      const rel = path.relative(root, file);
      byFile[rel] = Array.from(refs).sort();
      for (const r of refs) referenced.add(r);
    }
  }

  const missingInExample = Array.from(referenced).filter((x) => !declared.has(x)).sort();
  const unusedInExample = Array.from(declared).filter((x) => !referenced.has(x)).sort();

  return {
    root,
    envFile: path.relative(root, envPath),
    totals: { filesScanned: files.length, filesWithRefs: Object.keys(byFile).length, referenced: referenced.size, declared: declared.size },
    missingInExample,
    unusedInExample,
    byFile
  };
}

function printText(result) {
  console.log(`🔍 env-contract-drift\nRoot: ${result.root}\nEnv file: ${result.envFile}`);
  console.log(`\nScanned: ${result.totals.filesScanned} files | With refs: ${result.totals.filesWithRefs}`);
  console.log(`Referenced vars: ${result.totals.referenced} | Declared vars: ${result.totals.declared}`);

  console.log("\n❗ Missing in .env.example:");
  if (!result.missingInExample.length) console.log("  (none)");
  else result.missingInExample.forEach((v) => console.log(`  - ${v}`));

  console.log("\n⚠️ Unused in .env.example:");
  if (!result.unusedInExample.length) console.log("  (none)");
  else result.unusedInExample.forEach((v) => console.log(`  - ${v}`));

  console.log("\n📁 References by file:");
  const files = Object.keys(result.byFile).sort();
  if (!files.length) console.log("  (no env references found)");
  else for (const f of files) console.log(`  - ${f}: ${result.byFile[f].join(", ")}`);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.cmd === "help") return usage();
  if (args.cmd !== "scan") {
    console.error(`Unknown command: ${args.cmd}`);
    usage();
    process.exit(1);
  }

  const result = scan(args.root, args.envFile);
  if (args.format === "json") console.log(JSON.stringify(result, null, 2));
  else printText(result);

  if (result.missingInExample.length > 0) process.exitCode = 2;
}

main();
