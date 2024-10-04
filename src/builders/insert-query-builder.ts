import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'

type InsertIntoValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type OnConflictValue = {
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

export class InsertQueryBuilder<T extends QueryResultRow> implements PromiseLike<QueryResult<T>> {
  private db: Database

  private _insertInto: InsertIntoValue | null
  private _values: Record<string, any>
  private _returning: ReturningValue[]
  private _onConflict: OnConflictValue | null
  private _set: SetValue[]

  constructor (
    db: Database,
    insertInto: InsertIntoValue | null = null,
    values: Record<string, any> = {},
    returning: ReturningValue[] = [],
    onConflict: OnConflictValue | null = null,
    set: SetValue[] = []
  ) {
    this.db = db
    this._insertInto = insertInto
    this._values = values
    this._returning = returning
    this._onConflict = onConflict
    this._set = set
  }

  INSERT_INTO (template: TemplateStringsArray, ...params: any[]): InsertQueryBuilder<T> {
    return this.clone({ insertInto: { template, params } })
  }

  VALUES (values: Record<string, any>): InsertQueryBuilder<T> {
    return this.clone({ values })
  }

  RETURNING<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): InsertQueryBuilder<U> {
    return this.clone({ returning: [...this._returning, { template, params }] })
  }

  ON_CONFLICT<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): InsertQueryBuilder<U> {
    return this.clone({ onConflict: { template, params } })
  }

  SET<U extends QueryResultRow = T> (values: Record<string, any>): InsertQueryBuilder<U>
  SET<U extends QueryResultRow = T> (template: TemplateStringsArray, ...params: any[]): InsertQueryBuilder<U>
  SET<U extends QueryResultRow = T> (template: TemplateStringsArray | Record<string, any>, ...params: any[]): InsertQueryBuilder<U> {
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

  toSql (): [sql: string, params: any[]] {
    const insertIntoSql = this.insertIntoSql()

    const columns = Object.keys(this._values).map(column => `"${snakeCase(column)}"`).join(', ')
    const slots = Object.keys(this._values).map((_, i) => `$${i + 1}`).join(', ')

    const valuesSql = `(${columns}) VALUES (${slots})`
    const valuesParams = Object.values(this._values)
    const [onConflictSql, onConflictParams] = this.onConflictSql(valuesParams.length)
    const [setSql, setParams] = this.setSql(valuesParams.length + onConflictParams.length)

    const [returningSql, returningParams] = this.returningSql(setParams.length + valuesParams.length + onConflictParams.length)

    const sql = [insertIntoSql, valuesSql, onConflictSql, setSql, returningSql]
      .filter(part => part !== '')
      .join(' ')

    const params = [...valuesParams, ...onConflictParams, ...setParams, ...returningParams]

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
    insertInto?: InsertQueryBuilder<T>['_insertInto']
    values?: InsertQueryBuilder<T>['_values']
    returning?: InsertQueryBuilder<T>['_returning']
    onConflict?: InsertQueryBuilder<T>['_onConflict']
    set?: InsertQueryBuilder<T>['_set']
  }): InsertQueryBuilder<U> {
    return new InsertQueryBuilder<U>(
      this.db,
      partial.insertInto ?? this._insertInto,
      partial.values ?? this._values,
      partial.returning ?? this._returning,
      partial.onConflict ?? this._onConflict,
      partial.set ?? this._set
    )
  }

  private insertIntoSql (): string {
    return this._insertInto ? `INSERT INTO "${this._insertInto.template[0]}"` : ''
  }

  private setSql (index: number): [sql: string, params: any[]] {
    const parts = this._set.map(set => {
      let part = ''

      for (let i = 0; i < set.template.length - 1; i++) {
        part += set.template[i]
        part += `$${++index}`
      }

      part += set.template[set.template.length - 1]

      return part
    })

    const sql = parts.length === 0
      ? ''
      : `SET ${parts.join(', ')}`

    const params = this._set.flatMap(set => set.params)

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

  private onConflictSql (index: number): [sql: string, params: any[]] {
    const sql = this._onConflict
      ? `ON CONFLICT ${this._onConflict.template[0]}`
      : ''

    return [sql, []]
  }
}
