import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'

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
    const deleteFromSql = this.deleteFromSql()
    const [whereSql, whereParams] = this.whereSql(0)
    const [returningSql, returningParams] = this.returningSql(whereParams.length)

    const sql = [deleteFromSql, whereSql, returningSql]
      .filter(part => part !== '')
      .join(' ')

    const params = [...whereParams, ...returningParams]

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

  private deleteFromSql (): string {
    return this._deleteFrom ? `DELETE FROM "${this._deleteFrom.template[0]}"` : ''
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

  private returningSql (index: number): [sql: string, params: any[]] {
    const parts = this._returning.map(returning => {
      let part = ''

      for (let i = 0; i < returning.template.length - 1; i++) {
        part += returning.template[i]
        part += `$${++index}`
      }

      part += returning.template[returning.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : `RETURNING ${parts.join(', ')}`
    const params = this._returning.flatMap(returning => returning.params)

    return [sql, params]
  }
}
