export function camelCase (string: string) {
	return string.replace(/[_.-](\w|$)/g, function (_, x) {
		return x.toUpperCase()
	})
}
