import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { serializeJson } from '@/server/serializers';
import { StreamingService } from '@/types';

type JoinBody = {
  userId: string;
  name: string;
  services: StreamingService[];
};

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const body = (await req.json()) as JoinBody;

  if (!body.userId || !body.name || !Array.isArray(body.services)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const db = getDb();

  try {
    const groupExists = db
      .prepare(`SELECT code FROM groups WHERE code = ?;`)
      .get(code) as { code: string } | undefined;

    if (!groupExists) {
      db.prepare(`INSERT INTO groups (code, createdAt) VALUES (?, ?);`).run(code, createdAt);
    }

    db.prepare(
      `INSERT INTO group_members (code, userId, name, servicesJson, createdAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(code, userId) DO UPDATE SET
         name = excluded.name,
         servicesJson = excluded.servicesJson,
         createdAt = excluded.createdAt;`,
    ).run(code, body.userId, body.name, serializeJson(body.services), createdAt);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to join group' },
      { status: 500 },
    );
  }

  const membersRows = db
    .prepare(
      `SELECT userId, name, servicesJson FROM group_members WHERE code = ? ORDER BY createdAt ASC;`,
    )
    .all(code) as Array<{ userId: string; name: string; servicesJson: string }>;

  const members = membersRows.map(r => ({
    userId: r.userId,
    name: r.name,
    services: JSON.parse(r.servicesJson) as StreamingService[],
  }));

  return NextResponse.json(
    {
      code,
      members,
    },
    { status: 200 },
  );
}

