'use client';

import Link from 'next/link';
import { useState } from 'react';
import { parseApiResponse } from '@/lib/api-client';

const PREVIEW_LIMIT = 7;

function getCoverUrl(game) {
  const coverUrl = game?.cover?.url?.replace('t_thumb', 't_cover_big') || '/no-cover.svg';
  return coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;
}

export default function GameListsSection({ lists: initialLists = [], editable = false }) {
  const [lists, setLists] = useState(initialLists);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [busyListId, setBusyListId] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);
  const [expandedListId, setExpandedListId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const expandedList = lists.find((list) => list.id === expandedListId);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    setError('');
    const response = await fetch('/api/profile/game-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName }),
    });
    const result = await parseApiResponse(response);

    if (response.ok) {
      setLists((current) => [...current, result.list]);
      setNewListName('');
    } else {
      setError(result.error || 'Unable to create list.');
    }
    setIsCreating(false);
  };

  const handleRename = async (event, listId) => {
    event.preventDefault();
    setBusyListId(listId);
    setError('');
    const response = await fetch(`/api/profile/game-lists/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName }),
    });
    const result = await parseApiResponse(response);

    if (response.ok) {
      setLists((current) => current.map((list) => list.id === listId ? { ...list, name: result.list.name } : list));
      setEditingListId(null);
    } else {
      setError(result.error || 'Unable to rename list.');
    }
    setBusyListId(null);
  };

  const handleDelete = async () => {
    if (!listToDelete || busyListId) return;
    const listId = listToDelete.id;
    setBusyListId(listId);
    setError('');
    const response = await fetch(`/api/profile/game-lists/${listId}`, { method: 'DELETE' });
    const result = await parseApiResponse(response);

    if (response.ok) {
      setLists((current) => current.filter((list) => list.id !== listId));
      setListToDelete(null);
    } else {
      setError(result.error || 'Unable to delete list.');
    }
    setBusyListId(null);
  };

  return (
    <section className="mb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">Game Lists</h2>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
          {lists.length} {lists.length === 1 ? 'list' : 'lists'}
        </span>
      </div>

      {editable && (
        <form onSubmit={handleCreate} className="mb-6 flex flex-wrap gap-2">
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            maxLength={40}
            placeholder="Name a list"
            aria-label="New game list name"
            className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-[#00FF88] sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={isCreating || !newListName.trim()}
            className="rounded-lg bg-[#00FF88] px-4 py-2 text-xs font-black uppercase text-black transition-colors hover:bg-[#00cc6e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Creating' : 'Create list'}
          </button>
        </form>
      )}

      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}

      {lists.length ? (
        <div className="space-y-5">
          {lists.map((list) => {
            const previewGames = list.games.slice(0, PREVIEW_LIMIT);
            const hiddenCount = Math.max(0, list.games.length - PREVIEW_LIMIT);

            return (
              <section key={list.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  {editable && editingListId === list.id ? (
                    <form onSubmit={(event) => handleRename(event, list.id)} className="flex min-w-0 flex-1 gap-2">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={40}
                        aria-label="Rename game list"
                        className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-[#00FF88] sm:max-w-xs"
                      />
                      <button type="submit" disabled={busyListId === list.id || !editingName.trim()} className="text-xs font-bold text-[#00FF88] disabled:opacity-50">Save</button>
                      <button type="button" onClick={() => setEditingListId(null)} className="text-xs text-zinc-400">Cancel</button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => list.games.length && setExpandedListId(list.id)}
                      disabled={!list.games.length}
                      className="min-w-0 break-words text-left text-sm font-black uppercase tracking-wider text-zinc-200 enabled:hover:text-[#00FF88] disabled:cursor-default"
                    >
                      {list.name}
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      {list.games.length} {list.games.length === 1 ? 'game' : 'games'}
                    </span>
                    {editable && editingListId !== list.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditingListId(list.id); setEditingName(list.name); setError(''); }}
                          className="text-xs font-bold text-zinc-400 hover:text-white"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={busyListId === list.id}
                          onClick={() => { setListToDelete(list); setError(''); }}
                          className="text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {list.games.length ? (
                  <>
                    <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                      {previewGames.map((game) => (
                        <Link
                          key={`${list.id}-${game.id}`}
                          href={`/game/${game.id}`}
                          title={game.name}
                          className="group block w-full max-w-[100px] overflow-hidden rounded-lg border border-zinc-800 bg-black"
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                            <img src={getCoverUrl(game)} alt={game.name || 'Game cover'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                        </Link>
                      ))}
                    </div>
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedListId(list.id)}
                        className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs italic tracking-wide text-zinc-600">No games in this list yet. Add one from its game page.</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="text-xs italic uppercase tracking-widest text-zinc-600">
          {editable ? 'Create a list to start grouping games.' : 'No game lists yet.'}
        </p>
      )}

      {expandedList && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="expanded-game-list-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setExpandedListId(null)}
            aria-label="Close game list"
          />
          <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 id="expanded-game-list-title" className="truncate text-sm font-black uppercase tracking-widest text-[#00FF88]">
                  {expandedList.name}
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {expandedList.games.length} {expandedList.games.length === 1 ? 'game' : 'games'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedListId(null)}
                className="h-8 w-8 shrink-0 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Close game list"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-2 justify-items-start gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                {expandedList.games.map((game) => (
                  <Link
                    key={`expanded-${expandedList.id}-${game.id}`}
                    href={`/game/${game.id}`}
                    className="group block w-full max-w-[120px] overflow-hidden rounded-lg border border-zinc-800 bg-black"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                      <img src={getCoverUrl(game)} alt={game.name || 'Game cover'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <span className="block truncate px-2 py-2 text-xs text-zinc-300" title={game.name}>{game.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {listToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-list-title" aria-describedby="delete-list-description">
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setListToDelete(null)}
            aria-label="Cancel deleting list"
          />
          <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 id="delete-list-title" className="text-sm font-black uppercase tracking-widest text-white">
              Delete list?
            </h3>
            <p id="delete-list-description" className="mt-3 break-words text-sm leading-relaxed text-zinc-400">
              Delete <span className="font-bold text-zinc-200">{listToDelete.name}</span> and remove all its games?
            </p>
            {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setListToDelete(null); setError(''); }}
                disabled={busyListId === listToDelete.id}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busyListId === listToDelete.id}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-400 disabled:opacity-50"
              >
                {busyListId === listToDelete.id ? 'Deleting' : 'Delete list'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}