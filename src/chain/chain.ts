import { Fragment } from './fragment'

export class Chain {
  private readonly _fragments: Fragment[]

  constructor (fragments: Fragment[] = []) {
    this._fragments = fragments
  }

  static from (template: TemplateStringsArray | string[], ...params: any[]): Chain {
    return new Chain([new Fragment(template, params)])
  }

  if (
    condition: boolean,
    callback: (chain: this) => Chain
  ): Chain {
    return condition
      ? callback(this)
      : this
  }

  toString (): string {
    const [sql] = this.toSql()

    return sql
  }

  toSql (index = 0): [sql: string, params: any[]] {
    const parts: string[] = []
    const params: any[] = []

    for (const fragment of this._fragments) {
      const [fragmentSql, fragmentParams] = fragment.toSql(index)

      index += fragmentParams.length
      parts.push(fragmentSql)
      params.push(...fragmentParams)
    }

    const sql = parts.join(' ')

    return [sql, params]
  }

  AND (template: TemplateStringsArray | string[], ...params: any[]): Chain
  AND (chain: Chain): Chain
  AND (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('AND', templateOrChain, params, { wrapParens: true })
  }

  AS (template: TemplateStringsArray | string[], ...params: any[]): Chain
  AS (chain: Chain): Chain
  AS (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('AS', templateOrChain, params)
  }

  DELETE_FROM (template: TemplateStringsArray | string[], ...params: any[]): Chain
  DELETE_FROM (chain: Chain): Chain
  DELETE_FROM (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('DELETE FROM', templateOrChain, params)
  }

  FROM (template: TemplateStringsArray | string[], ...params: any[]): Chain
  FROM (chain: Chain): Chain
  FROM (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('FROM', templateOrChain, params)
  }

  LEFT_JOIN (template: TemplateStringsArray | string[], ...params: any[]): Chain
  LEFT_JOIN (chain: Chain): Chain
  LEFT_JOIN (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('LEFT JOIN', templateOrChain, params)
  }

  LIMIT (template: TemplateStringsArray | string[], ...params: any[]): Chain
  LIMIT (chain: Chain): Chain
  LIMIT (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('LIMIT', templateOrChain, params)
  }

  JOIN (template: TemplateStringsArray | string[], ...params: any[]): Chain
  JOIN (chain: Chain): Chain
  JOIN (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('JOIN', templateOrChain, params)
  }

  OFFSET (template: TemplateStringsArray | string[], ...params: any[]): Chain
  OFFSET (chain: Chain): Chain
  OFFSET (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('OFFSET', templateOrChain, params)
  }

  OR (template: TemplateStringsArray | string[], ...params: any[]): Chain
  OR (chain: Chain): Chain
  OR (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('OR', templateOrChain, params)
  }

  ORDER_BY (template: TemplateStringsArray | string[], ...params: any[]): Chain
  ORDER_BY (chain: Chain): Chain
  ORDER_BY (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('ORDER BY', templateOrChain, params)
  }

  GROUP_BY (template: TemplateStringsArray | string[], ...params: any[]): Chain
  GROUP_BY (chain: Chain): Chain
  GROUP_BY (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('GROUP BY', templateOrChain, params)
  }

  RETURNING (template: TemplateStringsArray | string[], ...params: any[]): Chain
  RETURNING (chain: Chain): Chain
  RETURNING (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('RETURNING', templateOrChain, params)
  }

  SELECT (template: TemplateStringsArray | string[], ...params: any[]): Chain
  SELECT (chain: Chain): Chain
  SELECT (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('SELECT', templateOrChain, params)
  }

  SET (template: TemplateStringsArray | string[], ...params: any[]): Chain
  SET (chain: Chain): Chain
  SET (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('SET', templateOrChain, params)
  }

  get UNION (): Chain {
    return new Chain([
      ...this._fragments,
      new Fragment(['', ''] as any, [], 'UNION')
    ])
  }

  UPDATE (template: TemplateStringsArray | string[], ...params: any[]): Chain
  UPDATE (chain: Chain): Chain
  UPDATE (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('UPDATE', templateOrChain, params)
  }

  VALUES (...params: any[]): Chain {
    if (params.length === 0) {
      return new Chain([
        ...this._fragments,
        new Fragment([''] as any, [], 'VALUES (', ')')
      ])
    }

    return new Chain([
      ...this._fragments,
      new Fragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'VALUES (', ')')
    ])
  }

  WHERE (template: TemplateStringsArray | string[], ...params: any[]): Chain
  WHERE (chain: Chain): Chain
  WHERE (templateOrChain: TemplateStringsArray | string[] | Chain, ...params: any[]): Chain {
    return this.chainable('WHERE', templateOrChain, params, { wrapParens: true })
  }

  private chainable (
    keyword: string,
    templateOrChain: TemplateStringsArray | string[] | Chain,
    params: any[],
    options: { wrapParens?: boolean } = {}
  ): Chain {
    if (templateOrChain instanceof Chain) {
      return new Chain([
        ...this._fragments,
        new Fragment(['', ''] as any, [templateOrChain], `${keyword} (`, ')')
      ])
    } else {
      if (options.wrapParens) {
        return new Chain([
          ...this._fragments,
          new Fragment(templateOrChain, params, `${keyword} (`, ')')
        ])
      } else {
        return new Chain([
          ...this._fragments,
          new Fragment(templateOrChain, params, `${keyword} `)
        ])
      }
    }
  }
}
