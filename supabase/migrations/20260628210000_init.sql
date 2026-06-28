create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('dermatologist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  phone_number text,
  reason_for_visit text check (
    reason_for_visit in (
      'acne',
      'eczema',
      'keratosisPilaris',
      'psoriasis',
      'warts',
      'benign',
      'malignant',
      'other'
    )
  ),
  additional_notes text,
  image_url text,
  image_storage_path text,
  detections jsonb not null default '[]'::jsonb,
  urgency_level text check (urgency_level in ('routine', 'urgent', 'emergent')),
  summary text,
  status text not null default 'open' check (status in ('open', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archived_patients_have_archived_at check (
    (status = 'open' and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  dermatologist_id uuid not null references auth.users(id) on delete cascade,
  notes text not null check (octet_length(notes) <= 10485760),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_owner_id_idx on public.patients(patient_owner_id);
create index patients_status_created_at_idx on public.patients(status, created_at, id);
create index patients_urgency_queue_idx on public.patients(
  status,
  (
    case urgency_level
      when 'emergent' then 0
      when 'urgent' then 1
      when 'routine' then 2
      else 3
    end
  ),
  created_at,
  id
);
create index notes_patient_id_created_at_idx on public.notes(patient_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger set_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create or replace function public.is_dermatologist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'dermatologist'
  );
$$;

create or replace function public.get_patient_queue_position(target_patient_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_patient public.patients%rowtype;
  target_priority integer;
  queue_position integer;
begin
  select *
  into target_patient
  from public.patients
  where id = target_patient_id;

  if target_patient.id is null then
    return null;
  end if;

  if target_patient.patient_owner_id <> auth.uid() and not public.is_dermatologist() then
    return null;
  end if;

  if target_patient.status <> 'open' then
    return null;
  end if;

  target_priority := case target_patient.urgency_level
    when 'emergent' then 0
    when 'urgent' then 1
    when 'routine' then 2
    else 3
  end;

  select count(*)::integer
  into queue_position
  from public.patients queued
  where queued.status = 'open'
    and queued.image_url is not null
    and (
      case queued.urgency_level
        when 'emergent' then 0
        when 'urgent' then 1
        when 'routine' then 2
        else 3
      end,
      queued.created_at,
      queued.id
    ) <= (
      target_priority,
      target_patient.created_at,
      target_patient.id
    );

  return queue_position;
end;
$$;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.notes enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Dermatologists can read profiles"
on public.profiles
for select
to authenticated
using (public.is_dermatologist());

create policy "Patients can create their own check-in"
on public.patients
for insert
to authenticated
with check (patient_owner_id = auth.uid());

create policy "Patients can read their own check-in"
on public.patients
for select
to authenticated
using (patient_owner_id = auth.uid());

create policy "Patients can update their own open check-in"
on public.patients
for update
to authenticated
using (patient_owner_id = auth.uid() and status = 'open')
with check (patient_owner_id = auth.uid() and status = 'open' and archived_at is null);

create policy "Dermatologists can read patients"
on public.patients
for select
to authenticated
using (public.is_dermatologist());

create policy "Dermatologists can update patients"
on public.patients
for update
to authenticated
using (public.is_dermatologist())
with check (public.is_dermatologist());

create policy "Dermatologists can read notes"
on public.notes
for select
to authenticated
using (public.is_dermatologist());

create policy "Dermatologists can insert notes"
on public.notes
for insert
to authenticated
with check (public.is_dermatologist() and dermatologist_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.patients to authenticated;
grant select, insert on public.notes to authenticated;
grant execute on function public.is_dermatologist() to authenticated;
grant execute on function public.get_patient_queue_position(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'selfies',
  'selfies',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Patients can upload selfies to their owner prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'selfies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Patients can read their own selfies"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'selfies'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Dermatologists can read selfies"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'selfies'
  and public.is_dermatologist()
);

alter publication supabase_realtime add table public.patients;
