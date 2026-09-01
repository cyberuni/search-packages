import { writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsdown'

/**
 * Two outputs, matching what the package has always published:
 *
 * - `cjs/index.js` — a single bundled CommonJS entry, plus the `cjs/package.json`
 *   `{"type":"commonjs"}` marker the `"type": "module"` root would otherwise override.
 * - `esm/*.js` + `esm/*.d.ts` — one file per source module (`unbundle`), which is the
 *   shape `tsc` emitted, so no published path moves.
 */
export default defineConfig([
	{
		entry: ['ts/index.ts'],
		format: 'cjs',
		outDir: 'cjs',
		platform: 'node',
		dts: false,
		outExtensions: () => ({ js: '.js' }),
		clean: ['cjs'],
		hooks: {
			// `copy`'s `to` is treated as a directory, so it cannot write a file named
			// `cjs/package.json`. Write it after the build instead.
			'build:done': async () => {
				await writeFile('cjs/package.json', `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`)
			}
		}
	},
	{
		entry: ['ts/**/*.ts', '!ts/**/*.spec.ts', '!ts/**/*.internal.ts'],
		format: 'esm',
		outDir: 'esm',
		platform: 'node',
		unbundle: true,
		// `dts.sourcemap` governs both `.d.ts.map` and `.js.map`. `tsc` published the
		// former, so it stays on; the `.js.map` files that come with it resolve against
		// the `ts/` sources the package already ships.
		dts: { sourcemap: true },
		outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
		clean: ['esm']
	}
])
