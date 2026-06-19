-- Friendships: link logged-in users or unlinked participants to your friend list.

create type public.friendship_status as enum ('active', 'disabled');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  friend_profile_id uuid references public.profiles (id) on delete cascade,
  friend_participant_id uuid references public.participants (id) on delete cascade,
  status public.friendship_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_target_check check (
    (
      friend_profile_id is not null
      and friend_participant_id is null
    )
    or (
      friend_profile_id is null
      and friend_participant_id is not null
    )
  )
);

create index friendships_owner_status_idx on public.friendships (owner_id, status);
create index friendships_friend_profile_idx on public.friendships (friend_profile_id)
  where friend_profile_id is not null;
create index friendships_friend_participant_idx on public.friendships (friend_participant_id)
  where friend_participant_id is not null;

create unique index friendships_owner_profile_active_uidx
  on public.friendships (owner_id, friend_profile_id)
  where friend_profile_id is not null and status = 'active';

create unique index friendships_owner_participant_active_uidx
  on public.friendships (owner_id, friend_participant_id)
  where friend_participant_id is not null and status = 'active';

create trigger friendships_set_updated_at
  before update on public.friendships
  for each row
  execute function public.set_updated_at();

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "friendships_insert_own"
  on public.friendships
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "friendships_update_own"
  on public.friendships
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "friendships_delete_own"
  on public.friendships
  for delete
  to authenticated
  using (owner_id = auth.uid());

comment on table public.friendships is
  'Per-user friend list: linked accounts (friend_profile_id) or unlinked participants (friend_participant_id).';

-- Backfill from existing per-owner participant rows (excluding self).

insert into public.friendships (owner_id, friend_profile_id, status)
select p.owner_id, p.profile_id, 'active'::public.friendship_status
from public.participants p
where p.profile_id is not null
  and p.profile_id <> p.owner_id
  and not exists (
    select 1
    from public.friendships f
    where f.owner_id = p.owner_id
      and f.friend_profile_id = p.profile_id
      and f.status = 'active'
  );

insert into public.friendships (owner_id, friend_participant_id, status)
select p.owner_id, p.id, 'active'::public.friendship_status
from public.participants p
where p.profile_id is null
  and not exists (
    select 1
    from public.participants self_row
    where self_row.owner_id = p.owner_id
      and self_row.profile_id = p.owner_id
      and self_row.id = p.id
  )
  and not exists (
    select 1
    from public.friendships f
    where f.owner_id = p.owner_id
      and f.friend_participant_id = p.id
      and f.status = 'active'
  );

-- Search profiles + unlinked participants to add as friends.

create or replace function public.search_people_to_friend(p_search text)
returns table (
  kind text,
  profile_id uuid,
  participant_id uuid,
  display_name text,
  avatar_url text,
  color text,
  session_count bigint,
  already_friend boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select lower(trim(p_search)) as value
  ),
  current_user_id as (
    select auth.uid() as id
  )
  select *
  from (
    select
      'profile'::text as kind,
      pr.id as profile_id,
      null::uuid as participant_id,
      pr.display_name,
      pr.avatar_url,
      null::text as color,
      0::bigint as session_count,
      exists (
        select 1
        from public.friendships f
        where f.owner_id = (select id from current_user_id)
          and f.status = 'active'
          and f.friend_profile_id = pr.id
      ) as already_friend
    from public.profiles pr
    cross join normalized n
    where (select id from current_user_id) is not null
      and pr.id <> (select id from current_user_id)
      and length(n.value) >= 2
      and lower(pr.display_name) like '%' || n.value || '%'

    union all

    select
      'participant'::text as kind,
      null::uuid as profile_id,
      p.id as participant_id,
      p.display_name,
      null::text as avatar_url,
      p.color,
      count(sp.session_id)::bigint as session_count,
      exists (
        select 1
        from public.friendships f
        where f.owner_id = (select id from current_user_id)
          and f.status = 'active'
          and f.friend_participant_id = p.id
      ) as already_friend
    from public.participants p
    cross join normalized n
    left join public.session_participants sp on sp.participant_id = p.id
    where p.profile_id is null
      and length(n.value) >= 2
      and (
        lower(trim(p.display_name)) like '%' || n.value || '%'
        or exists (
          select 1
          from public.participant_aliases pa
          where pa.participant_id = p.id
            and lower(trim(pa.alias)) like '%' || n.value || '%'
        )
      )
    group by p.id, p.display_name, p.color, n.value
  ) results
  order by already_friend asc, session_count desc, display_name
  limit 40;
$$;

grant execute on function public.search_people_to_friend(text) to authenticated;

create or replace function public.list_my_friends()
returns table (
  friendship_id uuid,
  status public.friendship_status,
  kind text,
  profile_id uuid,
  participant_id uuid,
  display_name text,
  avatar_url text,
  color text,
  session_count bigint,
  local_participant_id uuid,
  participant_owner_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id as friendship_id,
    f.status,
    case
      when f.friend_profile_id is not null then 'profile'
      else 'participant'
    end as kind,
    f.friend_profile_id as profile_id,
    f.friend_participant_id as participant_id,
    coalesce(pr.display_name, p.display_name) as display_name,
    pr.avatar_url,
    p.color,
    coalesce(sc.session_count, 0)::bigint as session_count,
    lp.id as local_participant_id,
    p.owner_id as participant_owner_id
  from public.friendships f
  left join public.profiles pr on pr.id = f.friend_profile_id
  left join public.participants p on p.id = f.friend_participant_id
  left join public.participants lp
    on lp.owner_id = f.owner_id
    and lp.profile_id = f.friend_profile_id
  left join lateral (
    select count(*)::bigint as session_count
    from public.session_participants sp
    where sp.participant_id = f.friend_participant_id
  ) sc on f.friend_participant_id is not null
  where f.owner_id = auth.uid()
    and f.status = 'active'
  order by display_name;
$$;

grant execute on function public.list_my_friends() to authenticated;

-- When a ghost participant is claimed, migrate friendships to profile links.

create or replace function public.claim_participant_link(participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.participants p
    where p.id = participant_id
      and p.profile_id is null
  ) then
    raise exception 'Participant not found or already linked';
  end if;

  update public.participants
  set profile_id = current_user_id
  where id = participant_id;

  update public.friendships f
  set
    friend_profile_id = current_user_id,
    friend_participant_id = null,
    updated_at = now()
  where f.friend_participant_id = participant_id
    and f.status = 'active'
    and not exists (
      select 1
      from public.friendships existing
      where existing.owner_id = f.owner_id
        and existing.status = 'active'
        and existing.friend_profile_id = current_user_id
        and existing.id <> f.id
    );

  delete from public.friendships f
  where f.friend_participant_id = participant_id
    and f.status = 'active'
    and exists (
      select 1
      from public.friendships existing
      where existing.owner_id = f.owner_id
        and existing.status = 'active'
        and existing.friend_profile_id = current_user_id
        and existing.id <> f.id
    );

  update public.profiles
  set participant_link_prompt_completed_at = now()
  where id = current_user_id
    and participant_link_prompt_completed_at is null;
end;
$$;
