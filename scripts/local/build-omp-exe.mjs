#!/usr/bin/env node
// Build %LOCALAPPDATA%\omp\omp.exe — a forwarding shim around the
// npm-installed omp (`@oh-my-pi/pi-coding-agent`, run with bun).
//
// Why: OMP Desktop's Rust backend spawns `omp.exe`/`omp` via
// CreateProcess, which cannot execute npm's `omp.cmd` batch shim.
// omp's own official exe builds need its monorepo (packages/natives,
// packages/stats), unavailable from the npm package, so we compile a
// tiny forwarder instead. stdio pipes pass straight through, which is
// all the desktop's RPC mode needs.
//
// Run after: switching the active nvm-for-windows Node version, or
// moving the Node install. NOT needed after `omp update` — the shim
// only references the cli.js path, and npm swaps the file in place.
//
// Usage:  node scripts/local/build-omp-exe.mjs
// Env overrides: BUN_EXE, OMP_CLI_JS, OMP_EXE_OUT

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const fail = (msg) => {
	console.error(`build-omp-exe: ${msg}`);
	process.exit(1);
};

// Resolve bun.exe: real binary from the npm `bun` package, not the
// `bun.cmd` shim (same CreateProcess problem one level down).
const bunExe =
	process.env.BUN_EXE ??
	["bun/bin/bun.exe", "node_modules/bun/bin/bun.exe"]
		.map((rel) => join(process.execPath, "..", rel))
		.find((p) => existsSync(p));
if (!bunExe) fail(`no real bun.exe found beside node (${process.execPath}); set BUN_EXE`);

// Resolve omp's cli.js from the npm install.
const cliJs =
	process.env.OMP_CLI_JS ??
	["node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js"]
		.map((rel) => join(process.execPath, "..", rel))
		.find((p) => existsSync(p));
if (!cliJs) fail(`omp not installed beside node; set OMP_CLI_JS to pi-coding-agent/dist/cli.js`);

const outExe =
	process.env.OMP_EXE_OUT ??
	join(process.env.LOCALAPPDATA ?? fail("LOCALAPPDATA not set"), "omp", "omp.exe");

const shimSrc = readFileSync(new URL("./omp-exe-shim.ts", import.meta.url), "utf8");
const tmpDir = join(dirname(outExe), ".build");
mkdirSync(tmpDir, { recursive: true });
const tmpSrc = join(tmpDir, "omp-exe-shim.baked.ts");
writeFileSync(tmpSrc, shimSrc.replaceAll("__BUN_PATH__", bunExe.replaceAll("\\", "\\\\")).replaceAll("__CLI_PATH__", cliJs.replaceAll("\\", "\\\\")));

mkdirSync(dirname(outExe), { recursive: true });
console.log(`bun   <- ${bunExe}`);
console.log(`cli   <- ${cliJs}`);
console.log(`out   -> ${outExe}`);
execFileSync(bunExe, ["build", "--compile", "--target=bun-windows-x64", tmpSrc, "--outfile", outExe], { stdio: "inherit" });
console.log("done. Ensure %LOCALAPPDATA%\\omp is on the user PATH (omp's official installer location).");
