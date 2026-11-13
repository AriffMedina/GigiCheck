import * as SQLite from 'expo-sqlite';
import { migration } from './schema';
let opening: Promise<SQLite.SQLiteDatabase> | undefined;
export function database(): Promise<SQLite.SQLiteDatabase> {
  opening ??= (async () => {
    const db = await SQLite.openDatabaseAsync('gigicheck.db');
    await db.execAsync('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if ((version?.user_version ?? 0) < 1) await db.withTransactionAsync(() => db.execAsync(migration));
    return db;
  })().catch(error => { opening = undefined; throw error; });
  return opening;
}
