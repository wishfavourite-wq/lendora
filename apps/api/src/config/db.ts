import mysql from "mysql2/promise";
import type { FieldPacket, QueryResult } from "mysql2";
import { env } from "./env.js";

const mysqlPool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 12,
  namedPlaceholders: true,
  decimalNumbers: true
});

type SqlValues = Record<string, unknown> | unknown[];

export const pool = {
  execute<T extends QueryResult = QueryResult>(sql: string, values?: SqlValues) {
    return mysqlPool.execute(sql, values as any) as Promise<[T, FieldPacket[]]>;
  },
  query<T extends QueryResult = QueryResult>(sql: string, values?: SqlValues) {
    return mysqlPool.query(sql, values as any) as Promise<[T, FieldPacket[]]>;
  }
};

export type DbConnection = {
  execute<T extends QueryResult = QueryResult>(sql: string, values?: SqlValues): Promise<[T, FieldPacket[]]>;
  query<T extends QueryResult = QueryResult>(sql: string, values?: SqlValues): Promise<[T, FieldPacket[]]>;
};

export async function withTransaction<T>(handler: (connection: DbConnection) => Promise<T>) {
  const rawConnection = await mysqlPool.getConnection();
  const connection: DbConnection = {
    execute<TQuery extends QueryResult = QueryResult>(query: string, values?: SqlValues) {
      return rawConnection.execute(query, values as any) as Promise<[TQuery, FieldPacket[]]>;
    },
    query<TQuery extends QueryResult = QueryResult>(query: string, values?: SqlValues) {
      return rawConnection.query(query, values as any) as Promise<[TQuery, FieldPacket[]]>;
    }
  };
  try {
    await rawConnection.beginTransaction();
    const result = await handler(connection);
    await rawConnection.commit();
    return result;
  } catch (error) {
    await rawConnection.rollback();
    throw error;
  } finally {
    rawConnection.release();
  }
}
