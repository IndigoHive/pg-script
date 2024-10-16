import { Pool } from 'pg'
import { Database } from './database'
import { DatabasePoolClient } from './database-pool-client'

export class DatabasePool extends Database {
  private pg: Pool

  constructor (pg: Pool) {
    super(pg)
    this.pg = pg
  }

  get pool (): Pool {
    return this.pg
  }

  async transaction<T> (
    callback: (client: DatabasePoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pg.connect()

    try {
      await client.query('BEGIN')

      const result = await callback(new DatabasePoolClient(client))

      await client.query('COMMIT')

      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
