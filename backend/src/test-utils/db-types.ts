import type { db } from "@/db";

export type DbTransactionCallback = Parameters<typeof db.transaction>[0];
export type DbTransaction = Parameters<DbTransactionCallback>[0];
export type DbInsertResult = ReturnType<typeof db.insert>;
export type DbSelectResult = ReturnType<typeof db.select>;
export type DbUpdateResult = ReturnType<typeof db.update>;
