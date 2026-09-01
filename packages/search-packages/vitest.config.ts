import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		include: ['ts/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['ts/**/*.ts'],
			// `index.ts` is a re-export barrel with no branches, and `*.internal.ts` is
			// test scaffolding that never ships — neither says anything about the library.
			exclude: ['ts/**/*.spec.ts', 'ts/**/*.internal.ts', 'ts/index.ts'],
			reporter: ['text', 'lcov'],
			// Set to what the suite already achieves, so a regression fails the build
			// instead of quietly reporting a lower number.
			thresholds: { statements: 100, branches: 87, functions: 100, lines: 100 }
		}
	}
})
