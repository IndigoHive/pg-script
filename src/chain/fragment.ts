import { Chain } from './chain'

export class Fragment {
  private readonly _template: TemplateStringsArray | string[]
  private readonly _params: any[]
  private readonly _prefix?: string
  private readonly _suffix?: string

  constructor (
    template: TemplateStringsArray | string[],
    params: any[],
    prefix?: string,
    suffix?: string
  ) {
    this._template = template
    this._params = params
    this._prefix = prefix
    this._suffix = suffix
  }

  toString (): string {
    const [sql] = this.toSql()

    return sql
  }

  toSql (index: number = 0): [sql: string, params: any[]] {
    let sql = ''
    const params: any[] = []

    for (let i = 0; i < this._template.length; i++) {
      sql += this._template[i]

      if (i < this._params.length) {
        const param = this._params[i]

        if (param instanceof Chain) {
          const [fragmentSql, fragmentParams] = param.toSql(index)
          sql += fragmentSql
          params.push(...fragmentParams)
          index += fragmentParams.length
        } else {
          sql += `$${++index}`

          params.push(this._params[i])
        }
      }
    }

    const prefix = this._prefix ?? ''
    const suffix = this._suffix ?? ''
    const wrappedSql = `${prefix}${sql}${suffix}`

    return [wrappedSql, params]
  }
}
