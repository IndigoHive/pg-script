import { PoolClient } from 'pg'
import { Database } from './database'

export class DatabasePoolClient extends Database {
  constructor (pg: PoolClient) {
    super(pg)
  }
}
