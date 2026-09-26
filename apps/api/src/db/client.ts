import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { drizzle, type NodeSQLiteDatabase } from 'drizzle-orm/node-sqlite';

export type AppDatabase = NodeSQLiteDatabase;

export type DatabaseContext = {
  db: AppDatabase;
  close: () => void;
};

export function createDatabase(databaseFile: string): DatabaseContext {
  const resolvedFile =
    databaseFile === ':memory:' ? databaseFile : resolve(databaseFile);

  if (resolvedFile !== ':memory:') {
    mkdirSync(dirname(resolvedFile), { recursive: true });
  }

  const sqlite = new DatabaseSync(resolvedFile, {
    enableForeignKeyConstraints: true,
  });
  sqlite.exec('PRAGMA journal_mode = WAL;');

  return {
    db: drizzle({ client: sqlite }),
    close: () => sqlite.close(),
  };
}
