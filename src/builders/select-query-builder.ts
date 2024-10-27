import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'
import { NotFoundError } from '../errors'

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
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray | Record<string, any>, ...params: any[]): SelectQueryBuilder<U> {
    if (Array.isArray(template)) {
      return this.clone({ where: [...this._where, { template, params }] })
    } else {
      const where = Object.entries(template).filter(([key, value]) => value !== undefined).map(([key, value]) => ({
        template: [`"${snakeCase(key)}" = `, ''],
        params: [value]
      }))
      return this.clone({ where: [...this._where, ...where] })
    }
  }

  AND<U extends QueryResultRow = T> (values: Record<string, any>): SelectQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<U> {
    return this.WHERE(template, ...params)
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

  ORDER_BY (template: TemplateStringsArray, ...params: any[]): SelectQueryBuilder<T> {
    return this.clone({ orderBy: [...this._orderBy, { template, params }] })
  }

  toSql (): [sql: string, params: any[]] {
    const [selectSql, selectParams] = this.selectSql()
    const fromSql = this.fromSql()
    const [joinSql, joinParams] = this.joinSql(selectParams.length)
    const [whereSql, whereParams] = this.whereSql(selectParams.length + joinParams.length)
    const [orderBySql, orderByParams] = this.orderBySql(selectParams.length + joinParams.length + whereParams.length)
    const [limitSql, limitParams] = this.limitSql(selectParams.length + joinParams.length + whereParams.length + orderByParams.length)
    const [offsetSql, offsetParams] = this.offsetSql(selectParams.length + joinParams.length + whereParams.length + orderByParams.length + limitParams.length)

    const sql = [selectSql,  fromSql, joinSql, whereSql, orderBySql, limitSql, offsetSql]
      .filter(part => part !== '')
      .join(' ')

    const params = [...selectParams, ...joinParams, ...whereParams, ...orderByParams, ...limitParams, ...offsetParams]

    return [sql, params]
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

  private selectSql (): [sql: string, params: any[]] {
    let index = 0

    const parts = this._select.map(select => {
      let part = ''

      for (let i = 0; i < select.template.length - 1; i++) {
        part += select.template[i]
        part += `$${++index}`
      }

      part += select.template[select.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : `SELECT ${parts.join(', ')}`
    const params = this._select.flatMap(select => select.params)

    return [sql, params]
  }

  private joinSql (index: number): [sql: string, params: any[]] {
    const parts = this._join.map(join => {
      let part = join.clause + ' '

      for (let i = 0; i < join.template.length - 1; i++) {
        part += join.template[i]
        part += `$${++index}`
      }

      part += join.template[join.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : parts.join(' ')
    const params = this._join.flatMap(join => join.params)

    return [sql, params]
  }

  private fromSql (): string {
    return this._from ? `FROM "${this._from.template[0]}"` : ''
  }

  private whereSql (index: number): [sql: string, params: any[]] {
    const parts = this._where.map(where => {
      let part = ''

      for (let i = 0; i < where.template.length - 1; i++) {
        part += where.template[i]
        part += `$${++index}`
      }

      part += where.template[where.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : `WHERE ${parts.map(part => `(${part})`).join(' AND ')}`
    const params = this._where.flatMap(where => where.params)

    return [sql, params]
  }

  private orderBySql (index: number): [sql: string, params: any[]] {
    const parts = this._orderBy.map(orderBy => {
      let part = ''

      for (let i = 0; i < orderBy.template.length - 1; i++) {
        part += orderBy.template[i]
        part += `$${++index}`
      }

      part += orderBy.template[orderBy.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : `ORDER BY ${parts.join(', ')}`
    const params = this._orderBy.flatMap(orderBy => orderBy.params)

    return [sql, params]
  }

  private limitSql (index: number): [sql: string, params: any[]] {
    return this._limit === null
      ? ['', []]
      : [`LIMIT $${++index}`, [this._limit]]
  }

  private offsetSql (index: number): [sql: string, params: any[]] {
    return this._offset === null
      ? ['', []]
      : [`OFFSET $${++index}`, [this._offset]]
  }
}
