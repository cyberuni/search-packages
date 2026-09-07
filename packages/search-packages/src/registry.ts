/**
 * The public npm registry search endpoint.
 */
export const DEFAULT_REGISTRY = 'https://registry.npmjs.org'

/**
 * The largest `size` the registry search endpoint accepts. Asking for more is rejected.
 */
export const MAX_PAGE_SIZE = 250

/**
 * Upper bound on how many results `searchByKeywords` will page through.
 *
 * The registry reports a `total` that can run into the thousands for a broad keyword.
 * Paging all of it would mean dozens of sequential requests, which defeats the point of
 * replacing the `npm search` shell-out. 1000 is 4 requests at {@link MAX_PAGE_SIZE} and
 * covers every realistic plugin-discovery search.
 *
 * When the registry has more matches than this, the extra results are dropped and
 * `truncated` is set on the result so the caller can tell.
 */
export const DEFAULT_MAX_RESULTS = 1000

export interface RegistryPackage {
	name: string
	version?: string
	description?: string
	keywords?: string[]
	date?: string
	links?: Record<string, string>
	publisher?: { username?: string; email?: string }
	maintainers?: Array<{ username?: string; email?: string }>
	[key: string]: unknown
}

export interface RegistrySearchResponse {
	objects: Array<{ package: RegistryPackage }>
	total: number
}

export interface FetchPackagesOptions {
	/**
	 * Registry base URL. Defaults to {@link DEFAULT_REGISTRY}.
	 */
	registry?: string
	/**
	 * Cap on results fetched across all pages. Defaults to {@link DEFAULT_MAX_RESULTS}.
	 */
	maxResults?: number
	/**
	 * Aborts the in-flight requests.
	 */
	signal?: AbortSignal
	/**
	 * `fetch` implementation to use. Defaults to the global `fetch`.
	 */
	fetch?: typeof globalThis.fetch
}

export interface FetchPackagesResult {
	packages: RegistryPackage[]
	/**
	 * `true` when the registry reported more matches than `maxResults` allowed us to fetch.
	 */
	truncated: boolean
}

export class RegistrySearchError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message)
		this.name = 'RegistrySearchError'
	}
}

/**
 * Queries the npm registry search endpoint for packages carrying `keywords`,
 * paging until `total` is reached or `maxResults` is hit.
 *
 * The registry's `keywords:` qualifier is not a strict conjunction, so the returned
 * packages still need filtering by {@link hasAllKeywords} on the caller's side.
 */
export async function fetchPackagesByKeywords(
	keywords: string[],
	options: FetchPackagesOptions = {}
): Promise<FetchPackagesResult> {
	const {
		registry = DEFAULT_REGISTRY,
		maxResults = DEFAULT_MAX_RESULTS,
		signal,
		fetch: fetchImpl = globalThis.fetch
	} = options

	if (keywords.length === 0) return { packages: [], truncated: false }
	if (typeof fetchImpl !== 'function') {
		throw new RegistrySearchError('global fetch is not available; Node 18 or later is required')
	}

	const text = `keywords:${keywords.join(',')}`
	const packages: RegistryPackage[] = []
	let total = Number.POSITIVE_INFINITY

	while (packages.length < maxResults && packages.length < total) {
		const size = Math.min(MAX_PAGE_SIZE, maxResults - packages.length)
		const url = `${trimTrailingSlash(registry)}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}&from=${packages.length}`

		const response = await fetchImpl(url, { signal })
		if (!response.ok) {
			throw new RegistrySearchError(
				`npm registry search failed: ${response.status} ${response.statusText}`,
				response.status
			)
		}

		const body = (await response.json()) as RegistrySearchResponse
		const objects = body?.objects ?? []
		total = typeof body?.total === 'number' ? body.total : packages.length + objects.length

		// A page can come back short or empty even when `total` says otherwise;
		// stop rather than loop forever on `from` that never advances.
		if (objects.length === 0) return { packages, truncated: false }

		for (const object of objects) {
			if (object?.package) packages.push(object.package)
		}
	}

	return { packages, truncated: total > packages.length }
}

function trimTrailingSlash(url: string) {
	return url.endsWith('/') ? url.slice(0, -1) : url
}
