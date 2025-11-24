-- floors
create table if not exists floors (
  id text primary key,
  name text,
  building text default 'FUB'
);

-- rooms
create table if not exists rooms (
  id text primary key,
  name text,
  floor_id text references floors(id),
  capacity integer,
  created_at timestamptz default now()
);

-- devices
create table if not exists devices (
  id text primary key,
  room_id text references rooms(id),
  name text,
  is_active boolean default true,
  added_at timestamptz default now()
);

-- telemetry
create table if not exists telemetry (
  id uuid primary key default gen_random_uuid(),
  device_id text references devices(id) on delete cascade,
  room_id text,
  timestamp timestamptz not null,
  voltage numeric,
  current numeric,
  watt numeric,
  energy_kwh numeric,
  is_on boolean,
  raw jsonb
);
create index if not exists telemetry_device_time_idx on telemetry (device_id, timestamp);
create index if not exists telemetry_room_time_idx on telemetry (room_id, timestamp);

-- schedules
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  device_id text references devices(id),
  room_id text,
  action text,
  cron_spec text,
  start_time timestamptz,
  end_time timestamptz,
  repeat_weekdays smallint[],
  is_active boolean default true,
  created_at timestamptz default now()
);

-- tuya_tokens (simple cache)
create table if not exists tuya_tokens (
  id text primary key,
  token text,
  expires_at timestamptz
);
