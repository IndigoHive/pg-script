import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'
import { quoteTableName } from '../utils/quote-table-name'
import { Chain } from '../chain'
import { merge } from '../utils'

type UpdateValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type ReturningValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type SetValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type WhereValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

export class UpdateQueryBuilder<T extends QueryResultRow> implements PromiseLike<QueryResult<T>> {
  private db: Database

  private _update: UpdateValue | null
  private _set: SetValue[]
  private _where: WhereValue[]
  private _returning: ReturningValue[]

  constructor (
    db: Database,
    update: UpdateValue | null = null,
    set: SetValue[] = [],
    where: WhereValue[] = [],
    returning: ReturningValue[] = []
  ) {
    this.db = db
    this._update = update
    this._set = set
    this._where = where
    this._returning = returning
  }

  if (
    condition: boolean,
    callback: (builder: UpdateQueryBuilder<T>) => UpdateQueryBuilder<T>
  ): UpdateQueryBuilder<T> {
    return condition ? callback(this) : this
  }

  UPDATE (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<T> {
    return this.clone({ update: { template, params } })
  }

  SET<U extends QueryResultRow = T> (values: Record<string, any>): UpdateQueryBuilder<U>
  SET<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<U>
  SET<U extends QueryResultRow = T> (template: TemplateStringsArray | Record<string, any>, ...params: any[]): UpdateQueryBuilder<U> {
    if (Array.isArray(template)) {
      return this.clone({ set: [...this._set, { template, params }] })
    } else {
      const set = Object.entries(template).filter(([key, value]) => value !== undefined).map(([key, value]) => ({
        template: [`"${snakeCase(key)}" = `, ''],
        params: [value]
      }))
      return this.clone({ set: [...this._set, ...set] })
    }
  }

  WHERE<U extends QueryResultRow = T> (values: Record<string, any>): UpdateQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray | Record<string, any>, ...params: any[]): UpdateQueryBuilder<U> {
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

  AND<U extends QueryResultRow = T> (values: Record<string, any>): UpdateQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<U> {
    return this.WHERE(template, ...params)
  }

  RETURNING<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): UpdateQueryBuilder<U> {
    return this.clone({ returning: [...this._returning, { template, params }] })
  }

  toSql (): [sql: string, params: any[]] {
    return new Chain([])
      .UPDATE([quoteTableName(this._update?.template[0] ?? '')])
      .SET(...merge(this._set, ', '))
      .if(this._where.length > 0, chain => this._where.reduce(
        (chain, where, index) => index === 0
          ? chain.WHERE(where.template, ...where.params)
          : chain.AND(where.template, ...where.params),
        chain
      ))
      .if(
        this._returning.length > 0,
        chain => chain.RETURNING(...merge(this._returning, ', '))
      )
      .toSql()
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
    update?: UpdateQueryBuilder<T>['_update']
    set?: UpdateQueryBuilder<T>['_set']
    where?: UpdateQueryBuilder<T>['_where']
    returning?: UpdateQueryBuilder<T>['_returning']
  }): UpdateQueryBuilder<U> {
    return new UpdateQueryBuilder<U>(
      this.db,
      partial.update ?? this._update,
      partial.set ?? this._set,
      partial.where ?? this._where,
      partial.returning ?? this._returning
    )
  }
}
