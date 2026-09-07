import type { RegistryPackage } from './registry.js'

export interface StubbedFetch {
	(input: string | URL | Request, init?: RequestInit): Promise<Response>
	/**
	 * The URLs each call was made with, in order.
	 */
	calls: string[]
}

/**
 * Builds a `fetch` stub that answers registry search requests from `pages`.
 *
 * Each entry is one response, served in order — enough to drive the pagination loop
 * without a network.
 */
export function stubFetch(
	pages: Array<{ objects?: Array<{ package: Partial<RegistryPackage> }>; total: number }>
): StubbedFetch {
	let index = 0
	const stub = ((input: string | URL | Request) => {
		stub.calls.push(String(input))
		const page = pages[index++] ?? { objects: [], total: 0 }
		return Promise.resolve(jsonResponse(page))
	}) as StubbedFetch
	stub.calls = []
	return stub
}

/**
 * Builds a `fetch` stub that answers every request with a non-OK status.
 */
export function stubFailingFetch(status: number, statusText: string): StubbedFetch {
	const stub = ((input: string | URL | Request) => {
		stub.calls.push(String(input))
		return Promise.resolve({
			ok: false,
			status,
			statusText,
			json: () => Promise.reject(new Error('should not be read'))
		} as unknown as Response)
	}) as StubbedFetch
	stub.calls = []
	return stub
}

/**
 * Builds one registry search result object for `pkg`.
 */
export function registryObject(pkg: Partial<RegistryPackage> & { name: string }) {
	return { package: pkg }
}

function jsonResponse(body: unknown): Response {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		json: () => Promise.resolve(body)
	} as unknown as Response
}
