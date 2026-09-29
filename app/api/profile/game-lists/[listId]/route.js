import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to rename a list.' }, { status: 401 });
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
    .update({ name })
    .eq('id', params.listId)
    .eq('user_id', user.id)
    .select('id, name, created_at')
    .maybeSingle();

  if (error) {
    const isDuplicate = error.code === '23505';
    return NextResponse.json(
      { error: isDuplicate ? 'You already have a list with that name.' : 'Unable to rename list.' },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  if (!list) return NextResponse.json({ error: 'List not found.' }, { status: 404 });
  return NextResponse.json({ list });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to delete a list.' }, { status: 401 });
  }

  const { data: list, error } = await supabase
    .from('game_lists')
    .delete()
    .eq('id', params.listId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Unable to delete list.' }, { status: 500 });
  }

  if (!list) return NextResponse.json({ error: 'List not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}