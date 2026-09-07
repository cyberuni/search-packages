import { searchByKeywords } from './searchByKeywords.js'
import { registryObject, stubFailingFetch, stubFetch } from './testUtil.internal.js'

test('returns the names of packages carrying every keyword', async () => {
	const fetch = stubFetch([
		{
			objects: [
				registryObject({ name: 'pkg-both', keywords: ['x', 'y'] }),
				registryObject({ name: 'pkg-one', keywords: ['x'] }),
				registryObject({ name: 'pkg-none' })
			],
			total: 3
		}
	])

	await expect(searchByKeywords(['x', 'y'], undefined, { fetch })).resolves.toEqual(['pkg-both'])
})

test('projects the requested fields alongside name', async () => {
	const fetch = stubFetch([
		{
			objects: [registryObject({ name: 'pkg-x', version: '1.2.3', description: 'blah', keywords: ['x'] })],
			total: 1
		}
	])

	await expect(searchByKeywords(['x'], ['version', 'description'], { fetch })).resolves.toEqual([
		{ name: 'pkg-x', version: '1.2.3', description: 'blah' }
	])
})

test('filters across paginated results', async () => {
	const filler = Array.from({ length: 250 }, (_, i) => registryObject({ name: `noise-${i}`, keywords: ['x'] }))
	const fetch = stubFetch([
		{ objects: filler, total: 251 },
		{ objects: [registryObject({ name: 'pkg-late', keywords: ['x', 'y'] })], total: 251 }
	])

	await expect(searchByKeywords(['x', 'y'], undefined, { fetch })).resolves.toEqual(['pkg-late'])
})

test('a registry error surfaces to the caller', async () => {
	const fetch = stubFailingFetch(500, 'Internal Server Error')

	await expect(searchByKeywords(['x'], undefined, { fetch })).rejects.toThrow(/500 Internal Server Error/)
})

test('no matches yields an empty list', async () => {
	const fetch = stubFetch([{ objects: [registryObject({ name: 'pkg-other', keywords: ['z'] })], total: 1 }])

	await expect(searchByKeywords(['x'], undefined, { fetch })).resolves.toEqual([])
})
