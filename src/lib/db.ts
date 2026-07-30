import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = process.env.TODO_DATABASE_PATH ?? path.join(dataDirectory, "todos.db");
const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");

let database: Database.Database | undefined;

export function getDatabase(): Database.Database {
  if (!database) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    database = new Database(databasePath);
    database.pragma("journal_mode = WAL");
    database.exec(fs.readFileSync(schemaPath, "utf8"));
  }
  return database;
}
