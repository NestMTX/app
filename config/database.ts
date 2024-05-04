import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const dbConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | The primary connection for making database queries across the application
  | You can use any key from the `connections` object defined in this same
  | file.
  |
  */
  connection: env.get('DB_CONNECTION', 'sqlite'),

  connections: {
    /*
    |--------------------------------------------------------------------------
    | SQLite
    |--------------------------------------------------------------------------
    |
    | Configuration for the SQLite database.  Make sure to install the driver
    | from npm when using this connection
    |
    | npm i sqlite3
    |
    */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      migrations: {
        naturalSort: true,
      },
      useNullAsDefault: true,
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | MySQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MySQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i mysql2
    |
    */
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST', 'localhost'),
        port: env.get('DB_PORT', 3306),
        user: env.get('DB_USER', 'lucid'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_NAME', 'lucid'),
        ssl: {
          rejectUnauthorized: !env.get('DB_SECURE', false),
        },
      },
      migrations: {
        naturalSort: true,
      },
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for PostgreSQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i pg
    |
    */
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST', 'localhost'),
        port: env.get('DB_PORT', 5432),
        user: env.get('DB_USER', 'lucid'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_NAME', 'lucid'),
        ssl: env.get('DB_SECURE', false),
      },
      migrations: {
        naturalSort: true,
      },
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | MSSQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MSSQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i tedious
    |
    */
    mssql: {
      client: 'mssql',
      connection: {
        user: env.get('DB_USER', 'lucid'),
        port: env.get('DB_PORT', 1443),
        server: env.get('DB_HOST', 'localhost'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_NAME', 'lucid'),
      },
      migrations: {
        naturalSort: true,
      },
      debug: false,
    },
  },
})

export default dbConfig
