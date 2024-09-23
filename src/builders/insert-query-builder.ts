import { QueryResult, QueryResultRow } from 'pg'
import { Database } from '../database'
import { snakeCase } from '../utils/snake-case'

type InsertIntoValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

type ReturningValue = {
  template: TemplateStringsArray | string[]
  params: any[]
}

export class InsertQueryBuilder<T extends QueryResultRow> implements PromiseLike<QueryResult<T>> {
  private db: Database

  private _insertInto: InsertIntoValue | null
  private _values: Record<string, any>
  private _returning: ReturningValue[]
  private _onConflict: string | null

  constructor (
    db: Database,
    insertInto: InsertIntoValue | null = null,
    values: Record<string, any> = {},
    returning: ReturningValue[] = [],
    onConflict: string | null = null
  ) {
    this.db = db
    this._insertInto = insertInto
    this._values = values
    this._returning = returning
    this._onConflict = onConflict
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

  ON_CONFLICT<U extends QueryResultRow = T> (onConflict: 'DO NOTHING' | 'DO UPDATE'): InsertQueryBuilder<U> {
    return this.clone({ onConflict })
  }

  toSql (): [sql: string, params: any[]] {
    const insertIntoSql = this.insertIntoSql()

    const columns = Object.keys(this._values).map(column => `"${snakeCase(column)}"`).join(', ')
    const slots = Object.keys(this._values).map((_, i) => `$${i + 1}`).join(', ')

    const valuesSql = `(${columns}) VALUES (${slots})`
    const valuesParams = Object.values(this._values)
    const onConflictSql = this.onConflictSql()

    const [returningSql, returningParams] = this.returningSql(valuesParams.length)

    const sql = [insertIntoSql, valuesSql, onConflictSql, returningSql]
      .filter(part => part !== '')
      .join(' ')

    const params = [...valuesParams, ...returningParams]

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
  }): InsertQueryBuilder<U> {
    return new InsertQueryBuilder<U>(
      this.db,
      partial.insertInto ?? this._insertInto,
      partial.values ?? this._values,
      partial.returning ?? this._returning,
      partial.onConflict ?? this._onConflict
    )
  }

  private insertIntoSql (): string {
    return this._insertInto ? `INSERT INTO "${this._insertInto.template[0]}"` : ''
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

  private onConflictSql (): string {
    if (this._onConflict === 'DO NOTHING') {
      return 'ON CONFLICT DO NOTHING'
    } else if (this._onConflict === 'DO UPDATE') {
      return 'ON CONFLICT DO UPDATE'
    } else {
      return ''
    }
  }
}
