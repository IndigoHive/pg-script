import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { DeleteQueryBuilder } from './builders/delete-query-builder'
import { InsertQueryBuilder } from './builders/insert-query-builder'
import { SelectQueryBuilder } from './builders/select-query-builder'
import { UpdateQueryBuilder } from './builders/update-query-builder'
import { camelCase } from './utils/camel-case'

export class Database {
  private _pg: Pool | PoolClient

  constructor (pg: Pool | PoolClient) {
    this._pg = pg
  }

  async query<T extends QueryResultRow = any> (
    sql: string, params?: any[]
  ): Promise<QueryResult<T>> {
    const result = await this._pg.query<T>(sql, params)

    return {
      ...result,
      rows: result.rows.map(row => {
        const keys = Object.keys(row)

        return Object.fromEntries(
          keys.map(key => [camelCase(key), row[key]])
        )
      }) as T[]
    }
  }

  DELETE_FROM<T extends QueryResultRow = any> (
    template: TemplateStringsArray, ...params: any[]
  ) {
    return new DeleteQueryBuilder<T>(this).DELETE_FROM(template, ...params)
  }

  SELECT<T extends QueryResultRow = any> (
    template: TemplateStringsArray, ...params: any[]
  ): SelectQueryBuilder<T> {
    return new SelectQueryBuilder<T>(this).SELECT(template, ...params)
  }

  INSERT_INTO<T extends QueryResultRow> (insertInto: string): InsertQueryBuilder<T>
  INSERT_INTO<T extends QueryResultRow> (insertInto: TemplateStringsArray, ...params: any[]): InsertQueryBuilder<T>
  INSERT_INTO<T extends QueryResultRow> (insertInto: TemplateStringsArray | string, ...params: any[]): InsertQueryBuilder<T> {
    return new InsertQueryBuilder<T>(this).INSERT_INTO(insertInto as any, ...params)
  }

  UPDATE<T extends QueryResultRow = any> (
    template: TemplateStringsArray, ...params: any[]
  ) {
    return new UpdateQueryBuilder<T>(this).UPDATE(template, ...params)
  }
}
