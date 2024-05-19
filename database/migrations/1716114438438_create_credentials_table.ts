import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'credentials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('description').notNullable()
      table.text('checksum').notNullable().unique()
      table.text('oauth_client_id').notNullable()
      table.text('oauth_client_secret').notNullable()
      table.text('dac_project_id').nullable()
      table.text('tokens').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
