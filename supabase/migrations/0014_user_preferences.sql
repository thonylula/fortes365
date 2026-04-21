-- Migration 0014: preferencias do usuario pro motor de plano
-- Adiciona equipment disponivel e skill_focus opcional.
-- Normaliza physical_issues com os codigos que a migration 0013 usa em contraindications.

alter table public.profiles
  add column if not exists equipment text[] not null default '{bodyweight}',
  add column if not exists skill_focus text;

create index if not exists profiles_skill_focus_idx on public.profiles (skill_focus);

-- Normaliza physical_issues antigos (back/knees/shoulders) pros codigos
-- que a migration 0013 usa em exercises.contraindications (lower_back/knee/shoulder).
update public.profiles
  set physical_issues = array(
    select case elem
      when 'back' then 'lower_back'
      when 'knees' then 'knee'
      when 'shoulders' then 'shoulder'
      else elem
    end
    from unnest(physical_issues) as elem
  )
where physical_issues is not null
  and physical_issues && array['back', 'knees', 'shoulders'];
