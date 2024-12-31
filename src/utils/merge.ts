export function merge (
  items: {
    template: TemplateStringsArray | string[]
    params: any[]
  }[],
  char: string = ''
): [TemplateStringsArray | string[], ...params: any[]] {
  if (items.length === 0) {
    return [[]]
  }

  if (items.length === 1) {
    return [items[0].template, ...items[0].params]
  }

  const template = [...items[0].template.slice(0, -1)]
  const params = [...items[0].params]

  for (let i = 1; i < items.length; i++) {
    const joined = items[i - 1].template.at(-1)! + char + items[i].template[0]
    template.push(joined, ...items[i].template.slice(1, -1))
    params.push(...items[i].params)
  }

  template.push(...items.at(-1)!.template.slice(1))

  return [
    template,
    ...params
  ]
}
