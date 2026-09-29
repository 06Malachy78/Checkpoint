'use client';

import { useState } from 'react';
import { parseApiResponse } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

export default function GameListPicker({ game, onRequireAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyListId, setBusyListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState('');

  const openPicker = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError('');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setIsOpen(false);
      setIsLoading(false);
      onRequireAuth();
      return;
    }

    const response = await fetch(`/api/profile/game-lists?gameId=${encodeURIComponent(game.id)}`);
    const result = await parseApiResponse(response);
    if (response.ok) {
      setLists(result.lists || []);
    } else {
      setError(result.error || 'Unable to load your lists.');
    }
    setIsLoading(false);
  };

  const handleToggle = async (list) => {
    if (busyListId) return;

    setBusyListId(list.id);
    setError('');
    const response = list.containsGame
      ? await fetch(`/api/profile/game-lists/${list.id}/games?gameId=${encodeURIComponent(game.id)}`, { method: 'DELETE' })
      : await fetch(`/api/profile/game-lists/${list.id}/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game }),
        });
    const result = await parseApiResponse(response);

    if (response.ok) {
      setLists((current) => current.map((entry) => (
        entry.id === list.id ? { ...entry, containsGame: !list.containsGame } : entry
      )));
    } else {
      setError(result.error || 'Unable to update this list.');
    }
    setBusyListId(null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newListName.trim() || busyListId) return;

    setBusyListId('new');
    setError('');
    const createResponse = await fetch('/api/profile/game-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName }),
    });
    const createResult = await parseApiResponse(createResponse);

    if (!createResponse.ok) {
      setError(createResult.error || 'Unable to create list.');
      setBusyListId(null);
      return;
    }

    const createdList = createResult.list;
    const addResponse = await fetch(`/api/profile/game-lists/${createdList.id}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game }),
    });
    const addResult = await parseApiResponse(addResponse);

    setLists((current) => [...current, { ...createdList, containsGame: addResponse.ok }]);
    setNewListName('');
    if (!addResponse.ok) setError(addResult.error || 'List created, but the game could not be added.');
    setBusyListId(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="h-11 rounded-full border border-zinc-800 bg-zinc-900 px-3 text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-colors hover:border-[#00FF88]/50 hover:text-[#00FF88]"
        aria-label="Add game to a list"
        title="Add game to a list"
      >
        Lists
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="game-list-picker-title">
          <button type="button" className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsOpen(false)} aria-label="Close list picker" />
          <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="game-list-picker-title" className="text-sm font-black uppercase tracking-widest text-[#00FF88]">Add to a list</h2>
                <p className="mt-1 truncate text-xs text-zinc-400">{game.name}</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="h-8 w-8 shrink-0 rounded-full border border-zinc-800 text-zinc-400 hover:text-white" aria-label="Close list picker">×</button>
            </div>

            {error && <p role="alert" className="mb-3 text-sm text-red-400">{error}</p>}
            {isLoading ? (
              <p className="py-4 text-sm text-zinc-500">Loading lists...</p>
            ) : (
              <>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {lists.map((list) => (
                    <label key={list.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-zinc-900">
                      <input
                        type="checkbox"
                        checked={Boolean(list.containsGame)}
                        disabled={Boolean(busyListId)}
                        onChange={() => handleToggle(list)}
                        className="h-4 w-4 accent-[#00FF88]"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{list.name}</span>
                    </label>
                  ))}
                  {!lists.length && <p className="py-3 text-xs italic text-zinc-500">Create a list to start grouping games.</p>}
                </div>

                <form onSubmit={handleCreate} className="mt-4 flex gap-2 border-t border-zinc-800 pt-4">
                  <input
                    value={newListName}
                    onChange={(event) => setNewListName(event.target.value)}
                    maxLength={40}
                    placeholder="New list name"
                    aria-label="New list name"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#00FF88]"
                  />
                  <button type="submit" disabled={Boolean(busyListId) || !newListName.trim()} className="rounded-lg bg-[#00FF88] px-3 py-2 text-xs font-black uppercase text-black disabled:opacity-50">
                    Create
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}