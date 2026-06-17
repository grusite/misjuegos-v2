import type { Database } from "./database"
import type { PendingTables } from "./rows"

export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & PendingTables
  }
}
