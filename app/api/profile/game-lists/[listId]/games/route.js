import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

async function getOwnedList(supabase, listId, userId) {
  const { data, error } = await supabase
    .from('game_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle();

  return error ? null : data;
}

export async function POST(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to edit lists.' }, { status: 401 });
  }

  const list = await getOwnedList(supabase, params.listId, user.id);
  if (!list) return NextResponse.json({ error: 'List not found.' }, { status: 404 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const gameId = payload?.game?.id == null ? '' : String(payload.game.id).trim();
  const gameName = typeof payload?.game?.name === 'string' ? payload.game.name.trim() : '';
  if (!gameId || !gameName) {
    return NextResponse.json({ error: 'Missing game details.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('game_list_games')
    .upsert(
      {
        list_id: list.id,
        user_id: user.id,
        game_id: gameId,
        game_name: gameName,
        game_cover: payload.game.cover ?? null,
      },
      { onConflict: 'list_id,game_id' }
    );

  if (error) {
    return NextResponse.json({ error: 'Unable to add game to list.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to edit lists.' }, { status: 401 });
  }

  const gameId = new URL(request.url).searchParams.get('gameId')?.trim();
  if (!gameId) return NextResponse.json({ error: 'Missing game id.' }, { status: 400 });

  const { error } = await supabase
    .from('game_list_games')
    .delete()
    .eq('list_id', params.listId)
    .eq('user_id', user.id)
    .eq('game_id', gameId);

  if (error) {
    return NextResponse.json({ error: 'Unable to remove game from list.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}