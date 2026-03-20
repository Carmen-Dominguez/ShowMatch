import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { generateGroupCode } from '@/lib/group';
import { StreamingService } from '@/types';
import { serializeJson } from '@/server/serializers';

type CreateGroupBody = {
  userId: string;
  name: string;
  services: StreamingService[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateGroupBody;

  if (!body.userId || !body.name || !Array.isArray(body.services)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = generateGroupCode();
  const createdAt = new Date().toISOString();

  const db = getDb();
  const insertGroup = db.prepare(
    `INSERT INTO groups (code, createdAt) VALUES (?, ?);`,
  );
  const insertMember = db.prepare(
    `INSERT INTO group_members (code, userId, name, servicesJson, createdAt)
     VALUES (?, ?, ?, ?, ?);`,
  );

  try {
    insertGroup.run(code, createdAt);
    insertMember.run(code, body.userId, body.name, serializeJson(body.services), createdAt);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create group' }, { status: 500 });
  }

  const members = [
    {
      userId: body.userId,
      name: body.name,
      services: body.services,
    },
  ];

  return NextResponse.json(
    { code, createdAt, members },
    { status: 200 },
  );
}

