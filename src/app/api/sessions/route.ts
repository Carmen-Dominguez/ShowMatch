import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/server/db';
import { serializeJson } from '@/server/serializers';
import { ContentFilters } from '@/types';

type CreateSessionBody = {
  groupCode: string;
  titleIds: number[];
  filters: ContentFilters;
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateSessionBody;

  if (
    !body.groupCode ||
    !Array.isArray(body.titleIds) ||
    !body.filters ||
    !Array.isArray(body.filters.genres)
  ) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const groupCode = body.groupCode.toUpperCase();
  const titleIds = body.titleIds;
  const filters = body.filters;
  const sessionId = randomUUID();
  const createdAt = new Date().toISOString();

  const db = getDb();
  const markOldInactive = db.prepare(
    `UPDATE swipe_sessions SET isActive = 0 WHERE groupCode = ? AND isActive = 1;`,
  );
  const insertSession = db.prepare(
    `INSERT INTO swipe_sessions (id, groupCode, titleIdsJson, filtersJson, createdAt, isActive)
     VALUES (?, ?, ?, ?, ?, 1);`,
  );

  try {
    markOldInactive.run(groupCode);
    insertSession.run(
      sessionId,
      groupCode,
      serializeJson(titleIds),
      serializeJson(filters),
      createdAt,
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create session' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { session: { id: sessionId, groupCode, titleIds, filters, createdAt } },
    { status: 200 },
  );
}

