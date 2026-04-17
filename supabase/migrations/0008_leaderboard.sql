-- Funcao RPC para leaderboard seguro (sem expor dados sensíveis)
create or replace function public.get_leaderboard(
  metric text default 'xp',
  region_filter text default null,
  page_size int default 50,
  page_offset int default 0
)
returns table (
  user_id uuid,
  display_name text,
  region text,
  fitness_level int,
  total_xp bigint,
  current_streak int,
  longest_streak int,
  workout_count bigint,
  achievement_count bigint,
  skill_count bigint,
  rank bigint
)
language sql
stable
security definer
as $$
  with ranked as (
    select
      p.id as user_id,
      p.display_name,
      p.region,
      p.fitness_level,
      coalesce(up.total_xp, 0)::bigint as total_xp,
      coalesce(up.current_streak, 0)::int as current_streak,
      coalesce(up.longest_streak, 0)::int as longest_streak,
      coalesce(wc.cnt, 0)::bigint as workout_count,
      coalesce(ac.cnt, 0)::bigint as achievement_count,
      coalesce(sc.cnt, 0)::bigint as skill_count,
      row_number() over (
        order by
          case metric
            when 'xp' then coalesce(up.total_xp, 0)
            when 'streak' then coalesce(up.longest_streak, 0)
            when 'workouts' then coalesce(wc.cnt, 0)
            when 'skills' then coalesce(sc.cnt, 0)
            else coalesce(up.total_xp, 0)
          end desc,
          p.display_name asc
      )::bigint as rank
    from public.profiles p
    left join public.user_progress up on up.user_id = p.id
    left join lateral (
      select count(*)::bigint as cnt from public.workout_sessions ws where ws.user_id = p.id
    ) wc on true
    left join lateral (
      select count(*)::bigint as cnt from public.user_achievements ua where ua.user_id = p.id
    ) ac on true
    left join lateral (
      select count(*)::bigint as cnt from public.user_skills us where us.user_id = p.id and us.status = 'mastered'
    ) sc on true
    where (region_filter is null or p.region = region_filter)
      and p.display_name is not null
  )
  select * from ranked
  order by rank
  limit page_size
  offset page_offset;
$$;

-- Funcao para posicao do usuario atual
create or replace function public.get_my_rank(metric text default 'xp')
returns bigint
language sql
stable
security definer
as $$
  with ranked as (
    select
      p.id,
      row_number() over (
        order by
          case metric
            when 'xp' then coalesce(up.total_xp, 0)
            when 'streak' then coalesce(up.longest_streak, 0)
            when 'workouts' then coalesce((select count(*) from public.workout_sessions ws where ws.user_id = p.id), 0)
            when 'skills' then coalesce((select count(*) from public.user_skills us where us.user_id = p.id and us.status = 'mastered'), 0)
            else coalesce(up.total_xp, 0)
          end desc
      )::bigint as rank
    from public.profiles p
    left join public.user_progress up on up.user_id = p.id
    where p.display_name is not null
  )
  select rank from ranked where id = auth.uid();
$$;
