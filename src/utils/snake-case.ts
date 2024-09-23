export function snakeCase (string: string) {
  return string.replace(/([a-zA-Z])(?=[A-Z])/g,'$1_').toLowerCase()
 }
