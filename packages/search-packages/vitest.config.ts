import { nodeTestPreset } from '@repobuddy/vitest/config/node'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	// `includeGeneralTests` is required, not cosmetic: the preset's default include
	// only matches platform-suffixed names like `*.spec.node.ts`. Our specs are plain
	// `*.spec.ts`, which the preset globs as "general" tests. Without the flag the
	// suite runs zero tests and still reports success.
	plugins: [nodeTestPreset({ includeGeneralTests: true })],
	test: {
		// The preset sets no globals; the specs call bare `test`/`expect`.
		globals: true,
		coverage: {
			provider: 'v8',
			// The preset excludes spec files. It does not know about these two:
			// `index.ts` is a re-export barrel with no branches, and `*.internal.ts` is
			// test scaffolding that never ships — neither says anything about the library.
			exclude: ['src/**/*.internal.ts', 'src/index.ts'],
			// The preset sets no reporters, so these have to stay: `text` for the
			// console summary, `lcov` for the `coverage/lcov.info` a coverage viewer reads.
			reporter: ['text', 'lcov'],
			// Set to what the suite already achieves, so a regression fails the build
			// instead of quietly reporting a lower number.
			thresholds: { statements: 100, branches: 87, functions: 100, lines: 100 }
		}
	}
})
