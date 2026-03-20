import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { Vote } from '@/server/serializers';

type VoteBody = {
  voterUserId: string;
  titleId: number;
  vote: Vote;
};

function buildVotesByUserId(rows: Array<{ voterUserId: string; titleId: number; vote: Vote }>) {
  const votesByUserId: Record<string, Record<string, Vote>> = {};
  for (const r of rows) {
    const titleKey = String(r.titleId);
    if (!votesByUserId[r.voterUserId]) votesByUserId[r.voterUserId] = {};
    votesByUserId[r.voterUserId][titleKey] = r.vote;
  }
  return votesByUserId;
}

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } },
) {
  const sessionId = params.sessionId;
  const body = (await req.json()) as VoteBody;

  if (
    !body.voterUserId ||
    typeof body.titleId !== 'number' ||
    !body.vote ||
    !['like', 'skip'].includes(body.vote)
  ) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO swipe_votes (sessionId, voterUserId, titleId, vote, createdAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(sessionId, voterUserId, titleId) DO UPDATE SET
         vote = excluded.vote,
         createdAt = excluded.createdAt;`,
    ).run(sessionId, body.voterUserId, body.titleId, body.vote, now);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record vote' },
      { status: 500 },
    );
  }

  const votesRows = db
    .prepare(
      `SELECT voterUserId, titleId, vote
       FROM swipe_votes
       WHERE sessionId = ?;`,
    )
    .all(sessionId) as Array<{ voterUserId: string; titleId: number; vote: Vote }>;

  return NextResponse.json(
    { votesByUserId: buildVotesByUserId(votesRows) },
    { status: 200 },
  );
}

