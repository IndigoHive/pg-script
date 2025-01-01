import { QueryResult, QueryResultRow } from 'pg'
import { Chain } from '../chain'
import { Database } from '../database'
import { NotFoundError } from '../errors'
import { merge, quoteTableName, snakeCase } from '../utils'

type SelectValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type JoinValue = {
  template: TemplateStringsArray | string[]
  params: any[]
  clause: 'JOIN' | 'LEFT JOIN'
}

type FromValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type WhereValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type OrderByValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

export class SelectQueryBuilder<T extends QueryResultRow> implements PromiseLike<QueryResult<T>> {
  private db: Database

  private _select: SelectValue[]
  private _join: JoinValue[]
  private _from: FromValue | null
  private _where: WhereValue[]
  private _limit: number | null
  private _offset: number | null
  private _orderBy: OrderByValue[]

  constructor (
    db: Database,
    select: SelectValue[] = [],
    join: JoinValue[] = [],
    from: FromValue | null = null,
    where: WhereValue[] = [],
    limit: number | null = null,
    offset: number | null = null,
    orderBy: OrderByValue[] = []
  ) {
    this.db = db
    this._select = select
    this._join = join
    this._from = from
    this._where = where
    this._limit = limit
    this._offset = offset
    this._orderBy = orderBy
  }

  if (
    condition: boolean,
    callback: (builder: SelectQueryBuilder<T>) => SelectQueryBuilder<T>
  ): SelectQueryBuilder<T> {
    return condition ? callback(this) : this
  }

  async count (): Promise<number> {
    const [sql, params] = this.toSqlCount()

    const result = await this.db.query<{ count: number }>(sql, params)

    return result.rows[0].count
  }

  async find<U extends QueryResultRow = T> (options: { error?: string } = {}): Promise<U> {
    const [sql, params] = this.LIMIT(1).toSql()

    const result = await this.db.query<U>(sql, params)

    if (result.rows.length === 0) {
      throw new NotFoundError(options.error ?? 'method find returned no results')
    }

    return result.rows[0]
  }

  async first<U extends QueryResultRow = T> (): Promise<U | null> {
    const [sql, params] = this.LIMIT(1).toSql()

    const result = await this.db.query<U>(sql, params)

    return result.rows[0] ?? null
  }

  async list<U extends QueryResultRow = T> (): Promise<U[]> {
    const [sql, params] = this.toSql()

    const result = await this.db.query<U>(sql, params)

    return result.rows
  }

  async page<U extends QueryResultRow = T> (
    pageNumber: number,
    pageSize: number
  ): Promise<{ rows: U[], count: number }> {
    const limit = pageSize
    const offset = pageNumber * pageSize

    const rows = await this.LIMIT(limit).OFFSET(offset).list<U>()
    const count = await this.count()

    return { rows, count }
  }

  SELECT<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U> {
    return this.clone({ select: [...this._select, { template, params }] })
  }

  FROM (from: string): SelectQueryBuilder<T>
  FROM (from: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<T>
  FROM (from: TemplateStringsArray | string, ...params: any[]): SelectQueryBuilder<T> {
    if (Array.isArray(from)) {
      return this.clone({ from: { template: from, params } })
    } else {
      return this.clone({ from: { template: [from as string], params: [] } })
    }
  }

  WHERE<U extends QueryResultRow = T> (values: Record<string, any>): SelectQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (chain: Chain): SelectQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (
    template: TemplateStringsArray | Record<string, any> | Chain,
    ...params: any[]
  ): SelectQueryBuilder<U> {
    if (Array.isArray(template)) {
      return this.clone({ where: [...this._where, { template, params }] })
    } else if (template instanceof Chain) {
      return this.clone({ where: [...this._where, { template: ['', ''], params: [template] }] })
    } else {
      const where = Object.entries(template).filter(([key, value]) => value !== undefined).map(([key, value]) => ({
        template: [`"${snakeCase(key)}" = `, ''],
        params: [value]
      }))
      return this.clone({ where: [...this._where, ...where] })
    }
  }

  AND<U extends QueryResultRow = T> (values: Record<string, any>): SelectQueryBuilder<U>
  AND<U extends QueryResultRow = T> (chain: Chain): SelectQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U>
  AND<U extends QueryResultRow = T> (
    template: TemplateStringsArray | Record<string, any> | Chain,
    ...params: any[]
  ): SelectQueryBuilder<U> {
    if (template instanceof Chain) {
      return this.WHERE(template)
    } else {
      return this.WHERE(template as TemplateStringsArray, ...params)
    }
  }

  JOIN (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<T> {
    return this.clone({ join: [...this._join, { template, params, clause: 'JOIN' }] })
  }

  LEFT_JOIN (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<T> {
    return this.clone({ join: [...this._join, { template, params, clause: 'LEFT JOIN' }] })
  }

  LIMIT (limit: number | null): SelectQueryBuilder<T> {
    return this.clone({ limit })
  }

  OFFSET (offset: number | null): SelectQueryBuilder<T> {
    return this.clone({ offset })
  }

  ORDER_BY (chain: Chain): SelectQueryBuilder<T>
  ORDER_BY (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<T>
  ORDER_BY (
    template: TemplateStringsArray | Chain,
    ...params: any[]
  ): SelectQueryBuilder<T> {
    if (template instanceof Chain) {
      return this.clone({ orderBy: [...this._orderBy, { template: ['', ''], params: [template] }] })
    } else {
      return this.clone({ orderBy: [...this._orderBy, { template, params }] })
    }
  }

  async then<TResult1 = QueryResult<T>, TResult2 = never> (
    onfulfilled: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>),
    onrejected: ((reason: any) => TResult2 | PromiseLike<TResult2>)
  ): Promise<TResult1 | TResult2> {
    const [sql, params] = this.toSql()

    try {
      const result = await this.db.query<T>(sql, params)

      return onfulfilled(result)
    } catch (error) {
      return onrejected(error)
    }
  }

  toSql (): [sql: string, params: any[]] {
    return new Chain([])
      .SELECT(...merge(this._select, ', '))
      .FROM([quoteTableName(this._from?.template[0] ?? '')])
      .if(this._join.length > 0, chain => this._join.reduce(
        (chain, join) => {
          if (join.clause === 'LEFT JOIN') {
            return chain.LEFT_JOIN(join.template, ...join.params)
          } else {
            return chain.JOIN(join.template, ...join.params)
          }
        },
        chain
      ))
      .if(this._where.length > 0, chain => this._where.reduce(
        (chain, where, index) => index === 0
          ? chain.WHERE(where.template, ...where.params)
          : chain.AND(where.template, ...where.params),
        chain
      ))
      .if(this._orderBy.length > 0, chain => chain.ORDER_BY(...merge(this._orderBy, ', ')))
      .if(this._limit !== null, chain => chain.LIMIT(['', ''], this._limit!))
      .if(this._offset !== null, chain => chain.OFFSET(['', ''], this._offset!))
      .toSql()
  }

  private toSqlCount (): [sql: string, params: any[]] {
    return new Chain([])
      .SELECT`COUNT(*)::int as "count"`
      .FROM([quoteTableName(this._from?.template[0] ?? '')])
      .if(this._join.length > 0, chain => this._join.reduce(
        (chain, join) => {
          if (join.clause === 'LEFT JOIN') {
            return chain.LEFT_JOIN(join.template, ...join.params)
          } else {
            return chain.JOIN(join.template, ...join.params)
          }
        },
        chain
      ))
      .if(this._where.length > 0, chain => this._where.reduce(
        (chain, where, index) => index === 0
          ? chain.WHERE(where.template, ...where.params)
          : chain.AND(where.template, ...where.params),
        chain
      ))
      .toSql()
  }

  private clone<U extends QueryResultRow = T> (partial: {
    select?: SelectQueryBuilder<T>['_select']
    join?: SelectQueryBuilder<T>['_join']
    from?: SelectQueryBuilder<T>['_from']
    where?: SelectQueryBuilder<T>['_where']
    limit?: SelectQueryBuilder<T>['_limit']
    offset?: SelectQueryBuilder<T>['_offset']
    orderBy?: SelectQueryBuilder<T>['_orderBy']
  }): SelectQueryBuilder<U> {
    return new SelectQueryBuilder<U>(
      this.db,
      partial.select ?? this._select,
      partial.join ?? this._join,
      partial.from ?? this._from,
      partial.where ?? this._where,
      partial.limit ?? this._limit,
      partial.offset ?? this._offset,
      partial.orderBy ?? this._orderBy
    )
  }
}
