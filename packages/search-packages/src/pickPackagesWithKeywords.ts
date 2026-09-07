import { hasAllKeywords } from './hasAllKeywords.js'

export function pickPackagesWithKeywords(packageInfos: Record<string, any>[], keywords: string[], fields?: string[]) {
	const pkgs = packageInfos.filter((pkg) => hasAllKeywords(pkg.keywords, keywords))
	if (fields)
		return pkgs.map((pkg) =>
			fields.reduce<Record<string, any> & { name: string }>(
				(p, v) => {
					p[v] = pkg[v]
					return p
				},
				{ name: pkg.name }
			)
		)

	return pkgs.map((pkg) => pkg.name)
}
