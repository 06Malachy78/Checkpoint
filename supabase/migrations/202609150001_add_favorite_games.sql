create table public.favorite_games (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  game_name text not null,
  game_cover jsonb,
  updated_at timestamptz not null default now(),
  constraint favorite_games_pkey primary key (user_id, game_id)
);

create index favorite_games_user_id_idx on public.favorite_games (user_id);
create index favorite_games_updated_at_idx on public.favorite_games (updated_at desc);

alter table public.favorite_games enable row level security;

create policy "Users can view their own favorites"
on public.favorite_games
for select
using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
on public.favorite_games
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own favorites"
on public.favorite_games
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
on public.favorite_games
for delete
using (auth.uid() = user_id);
