// omp.exe shim for OMP Desktop (Windows).
//
// OMP Desktop spawns a real `omp.exe` (CreateProcess cannot run npm's
// `omp.cmd` shim, and Rust std deliberately refuses .cmd without an
// explicit cmd.exe wrapper). This shim is a Bun-compiled exe that
// forwards argv + stdio to the real `bun.exe <pi-coding-agent>/dist/cli.js`
// from the npm install, and propagates the exit code.
//
// It never needs rebuilding when omp updates (`omp update` swaps cli.js
// behind the same path). Rebuild only after switching the active
// nvm-for-windows Node version: `node scripts/local/build-omp-exe.mjs`.
//
// Paths below are baked in by scripts/local/build-omp-exe.mjs.

const BUN_PATH = "__BUN_PATH__";
const CLI_PATH = "__CLI_PATH__";

const proc = Bun.spawn([BUN_PATH, CLI_PATH, ...Bun.argv.slice(2)], {
	stdio: ["inherit", "inherit", "inherit"],
	env: Bun.env,
	cwd: process.cwd(),
	windowsHide: true,
});
process.exitCode = await proc.exited;
