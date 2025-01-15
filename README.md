# pg-script

Yet another SQL builder for JavaScript and Postgres.
The API was designed to be very similar to writing plain SQL with almost no abstraction layers, while still maintaining some conveniences.

# Installation

```
npm install pg-script
```

# Usage

```typescript
import { Pool } from 'pg'
import { DatabasePool } from 'pg-script'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const db = new DatabasePool(pool)

async function main () {
  const status = 'published'

  // Run the query
  const { rows } = await db
    .SELECT`id, title`
    .FROM`posts`
    .WHERE`status = ${status}`
    .ORDER_BY`publish_date DESC`

  // Just generate the SQL and the parameters
  const [sql, params] = db
    .SELECT`id, title`
    .FROM`posts`
    .WHERE`status = ${status}`
    .ORDER_BY`publish_date DESC`
    .toSql()

  // Just generate the SQL
  const sql = db
    .SELECT`id, title`
    .FROM`posts`
    .WHERE`status = ${status}`
    .ORDER_BY`publish_date DESC`
    .toString()
}
```

# Examples

## Select

```sql
SELECT id, title FROM "posts" WHERE status = $1 ORDER BY publish_date DESC
```

```typescript
const status = 'published'

db
  .SELECT`id, title`
  .FROM`posts`
  .WHERE`status = ${status}`
  .ORDER_BY`publish_date DESC`

// OR

db
  .SELECT`id, title`
  .FROM`posts`
  .WHERE({ status: 'published' })
  .ORDER_BY`publish_date DESC`
```

## Update

```sql
UPDATE "posts" SET status = $1 WHERE id = $2
```

```typescript
db
  .UPDATE`posts`
  .SET`status = ${status}`
  .WHERE`id = ${id}`
```

```typescript
db
  .UPDATE`posts`
  .SET({ status: 'published' })
  .WHERE({ id: postId })
```

## Delete

```sql
DELETE FROM "posts" WHERE id = $1
```

```typescript
db
  .DELETE_FROM`posts`
  .WHERE`id = ${id}`
  .RETURNING`title`
```

## Insert

```sql
INSERT INTO "posts" ("title", "status") VALUES ($1, $2) RETURNING id
```

```typescript
db
  .INSERT_INTO`posts`
  .VALUES({
    title: 'Hello, world',
    status: 'published'
  })
  .RETURNING`id`
```

## Select where exists

```sql
SELECT id, name FROM "users" WHERE (EXISTS (SELECT id FROM "posts" WHERE author_id = users.id)) ORDER BY name ASC
```

```typescript
db
  .SELECT`id, name`
  .FROM`users`
  .WHERE(EXISTS(SELECT`id`.FROM`posts`.WHERE`author_id = users.id`))
  .ORDER_BY`name ASC`
```
