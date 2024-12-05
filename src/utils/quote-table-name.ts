export function quoteTableName (name: string): string {
  const isAlreadyQuoted = name.startsWith('"') && name.endsWith('"')
  const hasDots = name.includes('.')

  if (isAlreadyQuoted || hasDots) {
    return name
  } else {
    return `"${name}"`
  }
}
