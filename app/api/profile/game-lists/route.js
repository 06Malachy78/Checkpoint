import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { listGameLists } from '@/lib/game-lists';

async function getAuthenticatedUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error || !user ? null : user;
}

export async function GET(request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to view your lists.' }, { status: 401 });
  }

  const lists = await listGameLists(user.id, supabase);
  const gameId = new URL(request.url).searchParams.get('gameId');

  return NextResponse.json({
    lists: lists.map((list) => ({
      ...list,
      containsGame: gameId ? list.games.some((game) => game.id === gameId) : false,
    })),
  });
}

export async function POST(request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to create a list.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  if (!name || name.length > 40) {
    return NextResponse.json({ error: 'List names must be between 1 and 40 characters.' }, { status: 400 });
  }

  const { data: list, error } = await supabase
    .from('game_lists')
    .insert({ user_id: user.id, name })
    .select('id, name, created_at')
    .single();

  if (error) {
    const isDuplicate = error.code === '23505';
    return NextResponse.json(
      { error: isDuplicate ? 'You already have a list with that name.' : 'Unable to create list.' },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ list: { ...list, games: [] } }, { status: 201 });
}