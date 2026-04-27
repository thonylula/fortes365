-- Migration 0039: RPC publico get_public_profile pra /perfil/[id]
--
-- Problema: a pagina /perfil/[id] fazia .select() direto em profiles,
-- user_progress, user_achievements, workout_sessions — todas com RLS
-- policy `auth.uid() = user_id`. Quando user logado tenta ler perfil
-- de outra pessoa, PostgREST retorna null silenciosamente e a pagina
-- mostra "PERFIL NAO ENCONTRADO" mesmo com o usuario existindo.
--
-- Solucao: RPC com `security definer` que bypassa RLS controladamente
-- e retorna SO os campos publicos agregados. Padrao identico ao
-- get_leaderboard() de 0008_leaderboard.sql.
--
-- Privacidade: campos sensiveis (peso, altura, idade, sexo, objetivo,
-- mood/notes de treinos) NUNCA sao retornados — explicitamente listados
-- como `jsonb_build_object` nao incluem esses campos. Se o schema crescer
-- com novos campos privados, precisa atualizar essa funcao tambem.

create or replace function public.get_public_profile(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'region', p.region,
      'fitness_level', p.fitness_level,
      'created_at', p.created_at
    ),
    'progress', jsonb_build_object(
      'total_xp', coalesce(up.total_xp, 0),
      'current_streak', coalesce(up.current_streak, 0),
      'longest_streak', coalesce(up.longest_streak, 0),
      'last_workout_at', up.last_workout_at
    ),
    'workout_count', coalesce((
      select count(*)::int from public.workout_sessions where user_id = p.id
    ), 0),
    'skill_count', coalesce((
      select count(*)::int from public.user_skills
      where user_id = p.id and status = 'mastered'
    ), 0),
    'achievements', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'slug', a.slug,
          'title', a.title,
          'description', a.description,
          'emoji', a.emoji,
          'category', a.category,
          'unlocked_at', ua.unlocked_at,
          'sort_order', a.sort_order
        )
        order by ua.unlocked_at desc nulls last
      )
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = p.id
    ), '[]'::jsonb)
  )
  from public.profiles p
  left join public.user_progress up on up.user_id = p.id
  where p.id = p_user_id;
$$;

-- Anon e authenticated podem chamar (consistente com get_leaderboard)
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

comment on function public.get_public_profile(uuid) is
  'Retorna jsonb com perfil publico do usuario (sem dados sensiveis). Usado pela pagina /perfil/[id]. Bypassa RLS via security definer mas filtra colunas explicitamente.';
