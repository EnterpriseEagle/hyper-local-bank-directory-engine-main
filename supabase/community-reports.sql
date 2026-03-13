create extension if not exists pgcrypto;

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  branch_id bigint not null,
  suburb_id bigint not null,
  report_type text not null check (report_type in ('working', 'atm_empty', 'branch_closed', 'closure_notice', 'long_queue')),
  note text,
  photo_path text,
  photo_bucket text,
  photo_content_type text,
  photo_sha256 text,
  photo_size_bytes bigint,
  photo_width integer,
  photo_height integer,
  photo_metadata_status text check (photo_metadata_status in ('missing', 'partial', 'present', 'edited')),
  photo_metadata_summary text,
  photo_metadata_json jsonb,
  camera_make text,
  camera_model text,
  camera_software text,
  captured_at timestamptz,
  capture_lat double precision,
  capture_lng double precision,
  capture_distance_km real,
  vision_model text,
  vision_summary text,
  vision_confidence numeric(5, 2),
  vision_supports_report boolean,
  vision_authenticity text check (vision_authenticity in ('high', 'medium', 'low', 'unclear')),
  reporter_hash text,
  source text not null default 'web',
  agent_summary text,
  agent_confidence numeric(5, 2),
  agent_recommendation text check (agent_recommendation in ('approve', 'review', 'reject')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderation_note text,
  moderated_at timestamptz,
  moderated_by text,
  submitted_at timestamptz not null default now(),
  synced_at timestamptz
);

do $$
begin
  alter table public.community_reports
    drop constraint if exists community_reports_report_type_check;

  alter table public.community_reports
    add constraint community_reports_report_type_check
    check (report_type in ('working', 'atm_empty', 'branch_closed', 'closure_notice', 'long_queue'));
exception
  when duplicate_object then null;
end $$;

alter table public.community_reports add column if not exists photo_sha256 text;
alter table public.community_reports add column if not exists photo_size_bytes bigint;
alter table public.community_reports add column if not exists photo_width integer;
alter table public.community_reports add column if not exists photo_height integer;
alter table public.community_reports add column if not exists photo_metadata_status text;
alter table public.community_reports add column if not exists photo_metadata_summary text;
alter table public.community_reports add column if not exists photo_metadata_json jsonb;
alter table public.community_reports add column if not exists camera_make text;
alter table public.community_reports add column if not exists camera_model text;
alter table public.community_reports add column if not exists camera_software text;
alter table public.community_reports add column if not exists captured_at timestamptz;
alter table public.community_reports add column if not exists capture_lat double precision;
alter table public.community_reports add column if not exists capture_lng double precision;
alter table public.community_reports add column if not exists capture_distance_km real;
alter table public.community_reports add column if not exists vision_model text;
alter table public.community_reports add column if not exists vision_summary text;
alter table public.community_reports add column if not exists vision_confidence numeric(5, 2);
alter table public.community_reports add column if not exists vision_supports_report boolean;
alter table public.community_reports add column if not exists vision_authenticity text;

create index if not exists community_reports_moderation_status_idx
  on public.community_reports (moderation_status, submitted_at desc);

create index if not exists community_reports_branch_idx
  on public.community_reports (branch_id, submitted_at desc);

alter table public.community_reports enable row level security;

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', false)
on conflict (id) do nothing;
