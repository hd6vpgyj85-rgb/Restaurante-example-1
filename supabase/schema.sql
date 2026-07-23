-- ============================================================
-- OBSIDIANA — Esquema de base de datos para Supabase
-- Ejecuta este script completo en Supabase: SQL Editor > New query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- Tablas ----------

create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  nombre_es text not null,
  nombre_en text not null,
  descripcion text,
  ingredientes text,
  imagen_url text,
  precio_mxn numeric not null,
  categoria text not null,
  creado_en timestamptz not null default now()
);

create table if not exists galeria (
  id uuid primary key default uuid_generate_v4(),
  imagen_url text not null,
  orden integer default 0,
  creado_en timestamptz not null default now()
);

create table if not exists promociones (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descripcion text,
  imagen_url text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists empleados (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  puesto text not null,
  horario text,
  paga_mensual numeric,
  creado_en timestamptz not null default now()
);

create table if not exists reservaciones (
  id uuid primary key default uuid_generate_v4(),
  nombre_cliente text not null,
  fecha date not null,
  hora time not null,
  personas integer not null,
  telefono text not null,
  creado_en timestamptz not null default now()
);

-- ---------- Row Level Security ----------

alter table menu_items enable row level security;
alter table galeria enable row level security;
alter table promociones enable row level security;
alter table empleados enable row level security;
alter table reservaciones enable row level security;

-- Lectura pública (anon) para menu_items, galeria y promociones
create policy "public_select_menu_items" on menu_items
  for select using (true);

create policy "public_select_galeria" on galeria
  for select using (true);

create policy "public_select_promociones" on promociones
  for select using (true);

-- Lectura solo para usuarios autenticados (empleados y reservaciones son privadas)
create policy "auth_select_empleados" on empleados
  for select using (auth.role() = 'authenticated');

create policy "auth_select_reservaciones" on reservaciones
  for select using (auth.role() = 'authenticated');

-- El formulario público (anon) puede crear reservaciones
create policy "anon_insert_reservaciones" on reservaciones
  for insert with check (true);

-- El usuario autenticado (dueño/admin) tiene control total sobre todas las tablas
create policy "auth_all_menu_items" on menu_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_galeria" on galeria
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_promociones" on promociones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_empleados" on empleados
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth_all_reservaciones" on reservaciones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
