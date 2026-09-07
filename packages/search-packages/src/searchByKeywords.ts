import { pickPackagesWithKeywords } from './pickPackagesWithKeywords.js'
import { type FetchPackagesOptions, fetchPackagesByKeywords } from './registry.js'

export type SearchByKeywordsOptions = FetchPackagesOptions

/**
 * Finds packages on the npm registry that carry *all* of `keywords`.
 *
 * Results come from the registry search endpoint over `fetch`, then are filtered
 * client-side: the registry's `keywords:` qualifier matches loosely, so the strict
 * all-keywords check still happens here.
 *
 * At most `DEFAULT_MAX_RESULTS` (1000) matches are fetched by default. Pass
 * `{ maxResults: Number.POSITIVE_INFINITY }` to page through everything the registry has,
 * or call `fetchPackagesByKeywords` directly to see whether the results were truncated.
 */
export function searchByKeywords(
	keywords: string[],
	fields?: undefined,
	options?: SearchByKeywordsOptions
): Promise<string[]>
export function searchByKeywords(
	keywords: string[],
	fields: string[],
	options?: SearchByKeywordsOptions
): Promise<(Record<string, any> & { name: string })[]>
export async function searchByKeywords(keywords: string[], fields?: string[], options?: SearchByKeywordsOptions) {
	const { packages } = await fetchPackagesByKeywords(keywords, options)
	return pickPackagesWithKeywords(packages, keywords, fields)
}
