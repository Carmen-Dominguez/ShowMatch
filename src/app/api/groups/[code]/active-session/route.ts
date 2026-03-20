import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { Vote } from '@/server/serializers';
import { ContentFilters } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const db = getDb();

  const sessionRow = db
    .prepare(
      `SELECT id, titleIdsJson, filtersJson, createdAt
       FROM swipe_sessions
       WHERE groupCode = ? AND isActive = 1
       ORDER BY createdAt DESC
       LIMIT 1;`,
    )
    .get(code) as
    | {
        id: string;
        titleIdsJson: string;
        filtersJson: string;
        createdAt: string;
      }
    | undefined;

  if (!sessionRow) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  const titleIds = JSON.parse(sessionRow.titleIdsJson) as number[];
  const filters = JSON.parse(sessionRow.filtersJson) as ContentFilters;

  const votesRows = db
    .prepare(
      `SELECT voterUserId, titleId, vote
       FROM swipe_votes
       WHERE sessionId = ?;`,
    )
    .all(sessionRow.id) as Array<{ voterUserId: string; titleId: number; vote: Vote }>;

  const votesByUserId: Record<string, Record<string, Vote>> = {};
  for (const r of votesRows) {
    const titleKey = String(r.titleId);
    if (!votesByUserId[r.voterUserId]) votesByUserId[r.voterUserId] = {};
    votesByUserId[r.voterUserId][titleKey] = r.vote;
  }

  return NextResponse.json(
    {
      session: {
        id: sessionRow.id,
        groupCode: code,
        titleIds,
        filters,
        createdAt: sessionRow.createdAt,
        votesByUserId,
      },
    },
    { status: 200 },
  );
}

