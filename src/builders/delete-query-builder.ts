import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'
import { quoteTableName } from '../utils/quote-table-name'
import { Chain } from '../chain'
import { merge } from '../utils'

type DeleteFromValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type ReturningValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type WhereValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

export class DeleteQueryBuilder<T extends QueryResultRow> implements PromiseLike<QueryResult<T>> {
  private db: Database

  private _deleteFrom: DeleteFromValue | null
  private _where: WhereValue[]
  private _returning: ReturningValue[]

  constructor (
    db: Database,
    deleteFrom: DeleteFromValue | null = null,
    where: WhereValue[] = [],
    returning: ReturningValue[] = []
  ) {
    this.db = db
    this._deleteFrom = deleteFrom
    this._where = where
    this._returning = returning
  }

  if (
    condition: boolean,
    callback: (builder: DeleteQueryBuilder<T>) => DeleteQueryBuilder<T>
  ): DeleteQueryBuilder<T> {
    return condition ? callback(this) : this
  }

  DELETE_FROM (template: TemplateStringsArray, ...params: any[]): DeleteQueryBuilder<T> {
    return this.clone({ deleteFrom: { template, params } })
  }

  WHERE<U extends QueryResultRow = T> (values: Record<string, any>): DeleteQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): DeleteQueryBuilder<U>
  WHERE<U extends QueryResultRow = T> (template: TemplateStringsArray | Record<string, any>, ...params: any[]): DeleteQueryBuilder<U> {
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

  AND<U extends QueryResultRow = T> (values: Record<string, any>): DeleteQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): DeleteQueryBuilder<U>
  AND<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): DeleteQueryBuilder<U> {
    return this.WHERE(template, ...params)
  }

  RETURNING<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): DeleteQueryBuilder<U> {
    return this.clone({ returning: [...this._returning, { template, params }] })
  }

  toSql (): [sql: string, params: any[]] {
    return new Chain([])
      .DELETE_FROM([quoteTableName(this._deleteFrom?.template[0] ?? '')])
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
    deleteFrom?: DeleteQueryBuilder<T>['_deleteFrom']
    where?: DeleteQueryBuilder<T>['_where']
    returning?: DeleteQueryBuilder<T>['_returning']
  }): DeleteQueryBuilder<U> {
    return new DeleteQueryBuilder<U>(
      this.db,
      partial.deleteFrom ?? this._deleteFrom,
      partial.where ?? this._where,
      partial.returning ?? this._returning
    )
  }
}
