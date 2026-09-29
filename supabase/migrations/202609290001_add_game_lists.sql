create table public.game_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  constraint game_lists_id_user_id_key unique (id, user_id)
);

create unique index game_lists_user_name_unique
on public.game_lists (user_id, lower(name));

create table public.game_list_games (
  list_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  game_name text not null,
  game_cover jsonb,
  added_at timestamptz not null default now(),
  constraint game_list_games_pkey primary key (list_id, game_id),
  constraint game_list_games_owner_fkey
    foreign key (list_id, user_id)
    references public.game_lists (id, user_id)
    on delete cascade
);

create index game_list_games_user_id_idx on public.game_list_games (user_id);

alter table public.game_lists enable row level security;
alter table public.game_list_games enable row level security;

create policy "Anyone can view game lists"
on public.game_lists
for select
using (true);

create policy "Users can create their own game lists"
on public.game_lists
for insert
with check (auth.uid() = user_id);

create policy "Users can rename their own game lists"
on public.game_lists
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own game lists"
on public.game_lists
for delete
using (auth.uid() = user_id);

create policy "Anyone can view games in lists"
on public.game_list_games
for select
using (true);

create policy "Users can add games to their own lists"
on public.game_list_games
for insert
with check (auth.uid() = user_id);

create policy "Users can update games in their own lists"
on public.game_list_games
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can remove games from their own lists"
on public.game_list_games
for delete
using (auth.uid() = user_id);