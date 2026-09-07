import { DEFAULT_MAX_RESULTS, fetchPackagesByKeywords, MAX_PAGE_SIZE, RegistrySearchError } from './registry.js'
import { registryObject, stubFailingFetch, stubFetch } from './testUtil.internal.js'

test('no keywords does not hit the registry', async () => {
	const fetch = stubFetch([])
	const result = await fetchPackagesByKeywords([], { fetch })

	expect(result).toEqual({ packages: [], truncated: false })
	expect(fetch.calls).toEqual([])
})

test('maps registry objects to their package info', async () => {
	const fetch = stubFetch([
		{ objects: [registryObject({ name: 'pkg-x', version: '1.0.0', keywords: ['x'] })], total: 1 }
	])

	const result = await fetchPackagesByKeywords(['x'], { fetch })

	expect(result.packages).toEqual([{ name: 'pkg-x', version: '1.0.0', keywords: ['x'] }])
	expect(result.truncated).toBe(false)
})

test('queries the keywords qualifier against the default registry', async () => {
	const fetch = stubFetch([{ objects: [], total: 0 }])

	await fetchPackagesByKeywords(['x', 'y'], { fetch })

	expect(fetch.calls[0]).toBe(
		`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent('keywords:x,y')}&size=${MAX_PAGE_SIZE}&from=0`
	)
})

test('honors a custom registry, with or without a trailing slash', async () => {
	const fetch = stubFetch([{ objects: [], total: 0 }])
	await fetchPackagesByKeywords(['x'], { fetch, registry: 'https://registry.example.com/' })

	expect(fetch.calls[0]).toMatch(/^https:\/\/registry\.example\.com\/-\/v1\/search\?/)
})

test('pages through until total is reached', async () => {
	const firstPage = Array.from({ length: MAX_PAGE_SIZE }, (_, i) => registryObject({ name: `pkg-${i}` }))
	const fetch = stubFetch([
		{ objects: firstPage, total: MAX_PAGE_SIZE + 2 },
		{ objects: [registryObject({ name: 'pkg-250' }), registryObject({ name: 'pkg-251' })], total: MAX_PAGE_SIZE + 2 }
	])

	const result = await fetchPackagesByKeywords(['x'], { fetch })

	expect(result.packages).toHaveLength(MAX_PAGE_SIZE + 2)
	expect(result.truncated).toBe(false)
	expect(fetch.calls).toHaveLength(2)
	expect(fetch.calls[0]).toContain(`&size=${MAX_PAGE_SIZE}&from=0`)
	expect(fetch.calls[1]).toContain(`&size=${MAX_PAGE_SIZE}&from=${MAX_PAGE_SIZE}`)
})

test('stops at maxResults and reports truncation', async () => {
	const page = Array.from({ length: 2 }, (_, i) => registryObject({ name: `pkg-${i}` }))
	const fetch = stubFetch([{ objects: page, total: 500 }])

	const result = await fetchPackagesByKeywords(['x'], { fetch, maxResults: 2 })

	expect(result.packages).toHaveLength(2)
	expect(result.truncated).toBe(true)
	expect(fetch.calls).toHaveLength(1)
	expect(fetch.calls[0]).toContain('&size=2&from=0')
})

test('never asks the registry for more than one page worth at a time', async () => {
	const fetch = stubFetch([{ objects: [], total: 0 }])

	await fetchPackagesByKeywords(['x'], { fetch, maxResults: DEFAULT_MAX_RESULTS })

	expect(fetch.calls[0]).toContain(`&size=${MAX_PAGE_SIZE}&`)
})

test('a short page ends pagination even when total claims more', async () => {
	const fetch = stubFetch([
		{ objects: [registryObject({ name: 'pkg-x' })], total: 900 },
		{ objects: [], total: 900 }
	])

	const result = await fetchPackagesByKeywords(['x'], { fetch })

	expect(result.packages).toHaveLength(1)
	expect(fetch.calls).toHaveLength(2)
})

test('a non-OK response throws RegistrySearchError carrying the status', async () => {
	const fetch = stubFailingFetch(503, 'Service Unavailable')

	await expect(fetchPackagesByKeywords(['x'], { fetch })).rejects.toThrow(RegistrySearchError)
	await expect(fetchPackagesByKeywords(['x'], { fetch })).rejects.toMatchObject({ status: 503 })
})

test('a network failure propagates', async () => {
	const fetch = () => Promise.reject(new Error('ECONNREFUSED'))

	await expect(fetchPackagesByKeywords(['x'], { fetch: fetch as unknown as typeof globalThis.fetch })).rejects.toThrow(
		'ECONNREFUSED'
	)
})

test('a missing global fetch is reported as such', async () => {
	const original = globalThis.fetch
	// @ts-expect-error simulating a runtime older than Node 18
	globalThis.fetch = undefined
	try {
		await expect(fetchPackagesByKeywords(['x'])).rejects.toThrow(/Node 18 or later/)
	} finally {
		globalThis.fetch = original
	}
})

test('the abort signal is handed to fetch', async () => {
	const controller = new AbortController()
	const seen: Array<RequestInit | undefined> = []
	const fetch = ((_input: string, init?: RequestInit) => {
		seen.push(init)
		return Promise.resolve({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: () => Promise.resolve({ objects: [], total: 0 })
		} as unknown as Response)
	}) as unknown as typeof globalThis.fetch

	await fetchPackagesByKeywords(['x'], { fetch, signal: controller.signal })

	expect(seen[0]?.signal).toBe(controller.signal)
})
