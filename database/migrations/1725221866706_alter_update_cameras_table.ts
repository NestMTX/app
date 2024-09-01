import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_persistent').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_persistent')
    })
  }
}
