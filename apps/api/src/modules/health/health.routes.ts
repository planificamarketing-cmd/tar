import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '@tar/db';

export const healthRouter: Router = Router();

// GET /health — liveness + comprobación de conectividad a Postgres/PostGIS.
// Devuelve 200 aunque la BD falle (liveness), pero reporta `db: false`.
healthRouter.get('/', async (_req, res) => {
  let dbOk = false;
  let postgis: string | null = null;
  try {
    const result = await db.execute(
      sql`select postgis_full_version() as version`,
    );
    postgis = (result.rows[0]?.version as string | undefined) ?? null;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbOk,
    postgis,
  });
});
