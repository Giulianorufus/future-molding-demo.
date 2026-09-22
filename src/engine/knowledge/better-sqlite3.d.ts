declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string)
    pragma(statement: string): Database
    exec(statement: string): void
    prepare(statement: string): {
      run(params?: Record<string, unknown> | any): { changes: number }
      get(params?: Record<string, unknown> | any): any
      all(params?: Record<string, unknown> | any): any[]
    }
    close(): void
  }

  export default Database
}
