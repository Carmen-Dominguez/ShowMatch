import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const db = getDb();

  const groupRow = db.prepare(`SELECT code, createdAt FROM groups WHERE code = ?;`).get(code) as
    | { code: string; createdAt: string }
    | undefined;

  if (!groupRow) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const membersRows = db
    .prepare(
      `SELECT userId, name, servicesJson FROM group_members WHERE code = ? ORDER BY createdAt ASC;`,
    )
    .all(code) as Array<{ userId: string; name: string; servicesJson: string }>;

  // Keep JSON parsing local to avoid requiring types in SQL layer.
  const members = membersRows.map(r => ({
    userId: r.userId,
    name: r.name,
    services: JSON.parse(r.servicesJson) as unknown,
  }));

  return NextResponse.json(
    { code: groupRow.code, createdAt: groupRow.createdAt, members },
    { status: 200 },
  );
}

