import { PoolClient } from 'pg'
import { Database } from './database'

export class DatabasePoolClient extends Database {
  private pg: PoolClient

  constructor (pg: PoolClient) {
    super(pg)
    this.pg = pg
  }

  get client (): PoolClient {
    return this.pg
  }
}
