export function quoteTableName (name: string): string {
  const isAlreadyQuoted = name.startsWith('"') && name.endsWith('"')
  const hasDots = name.includes('.')
  const hasSpaces = name.includes(' ')

  if (isAlreadyQuoted || hasDots || hasSpaces) {
    return name
  } else {
    return `"${name}"`
  }
}
