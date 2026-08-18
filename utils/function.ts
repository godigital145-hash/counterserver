import { SimpleORM, UUIDModelFactory } from "./simpleorm";

type Env = Partial<CloudflareBindings>;

const db = (env: Env) => {
  const orm = new SimpleORM(env.DB as D1Database);
  const database = new UUIDModelFactory(orm);
  return database;
};

export default db;
