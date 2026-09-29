export async function listGameLists(userId, supabase) {
  if (!userId || !supabase) return [];

  const { data: lists, error: listsError } = await supabase
    .from('game_lists')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (listsError) {
    console.error('Unable to load game lists:', listsError.message);
    return [];
  }

  if (!lists?.length) return [];

  const listIds = lists.map((list) => list.id);
  const { data: games, error: gamesError } = await supabase
    .from('game_list_games')
    .select('list_id, game_id, game_name, game_cover, added_at')
    .in('list_id', listIds)
    .order('added_at', { ascending: false });

  if (gamesError) {
    console.error('Unable to load games in lists:', gamesError.message);
  }

  const gamesByList = new Map(listIds.map((listId) => [listId, []]));
  for (const game of games || []) {
    gamesByList.get(game.list_id)?.push({
      id: game.game_id,
      name: game.game_name,
      cover: game.game_cover,
      addedAt: game.added_at,
    });
  }

  return lists.map((list) => ({
    ...list,
    games: gamesByList.get(list.id) || [],
  }));
}