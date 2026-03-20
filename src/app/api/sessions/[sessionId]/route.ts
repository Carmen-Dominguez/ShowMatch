import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { Vote } from '@/server/serializers';
import { ContentFilters } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const sessionId = params.sessionId;
  const db = getDb();

  const sessionRow = db
    .prepare(
      `SELECT id, groupCode, titleIdsJson, filtersJson, createdAt
       FROM swipe_sessions
       WHERE id = ?;`,
    )
    .get(sessionId) as
    | {
        id: string;
        groupCode: string;
        titleIdsJson: string;
        filtersJson: string;
        createdAt: string;
      }
    | undefined;

  if (!sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const titleIds = JSON.parse(sessionRow.titleIdsJson) as number[];
  const filters = JSON.parse(sessionRow.filtersJson) as ContentFilters;

  const votesRows = db
    .prepare(
      `SELECT voterUserId, titleId, vote
       FROM swipe_votes
       WHERE sessionId = ?;`,
    )
    .all(sessionId) as Array<{ voterUserId: string; titleId: number; vote: Vote }>;

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
        groupCode: sessionRow.groupCode,
        titleIds,
        filters,
        createdAt: sessionRow.createdAt,
        votesByUserId,
      },
    },
    { status: 200 },
  );
}

