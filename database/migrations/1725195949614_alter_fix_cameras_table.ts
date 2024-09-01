import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('uid').notNullable().alter()
      table.text('room').notNullable().alter()
      table.text('info').notNullable().alter()
      table.text('stream_extension_token').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('uid').notNullable().alter()
      table.string('room').notNullable().alter()
      table.string('info').notNullable().alter()
      table.string('stream_extension_token').nullable().alter()
    })
  }
}
