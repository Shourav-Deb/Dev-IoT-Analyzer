-- seed_demo_data.sql - seeds floors, rooms, devices and few telemetry rows

-- floors
insert into floors (id, name, building) values
('F1', 'Floor 1', 'FUB'),
('F2', 'Floor 2', 'FUB'),
('F3', 'Floor 3', 'FUB')
on conflict (id) do nothing;

-- rooms (we create 12 sample rooms)
insert into rooms (id, name, floor_id, capacity) values
('F1-R101', 'Room 101', 'F1', 40),
('F1-R102', 'Room 102', 'F1', 35),
('F1-R103', 'Room 103', 'F1', 30),
('F2-R201', 'Room 201', 'F2', 45),
('F2-R202', 'Room 202', 'F2', 40),
('F2-R203', 'Room 203', 'F2', 28),
('F3-R301', 'Room 301', 'F3', 38),
('F3-R302', 'Room 302', 'F3', 42),
('F3-R303', 'Room 303', 'F3', 36),
('F1-R104', 'Room 104', 'F1', 25),
('F2-R204', 'Room 204', 'F2', 20),
('F3-R304', 'Room 304', 'F3', 18)
on conflict (id) do nothing;

-- devices: placeholder tuya device ids - replace 'dev-xxx' with real IDs
insert into devices (id, room_id, name, is_active) values
('dev-F1-R101', 'F1-R101', 'Plug - R101', true),
('dev-F1-R102', 'F1-R102', 'Plug - R102', true),
('dev-F1-R103', 'F1-R103', 'Plug - R103', true),
('dev-F2-R201', 'F2-R201', 'Plug - R201', true),
('dev-F2-R202', 'F2-R202', 'Plug - R202', true),
('dev-F2-R203', 'F2-R203', 'Plug - R203', true),
('dev-F3-R301', 'F3-R301', 'Plug - R301', true),
('dev-F3-R302', 'F3-R302', 'Plug - R302', true),
('dev-F3-R303', 'F3-R303', 'Plug - R303', true),
('dev-F1-R104', 'F1-R104', 'Plug - R104', true),
('dev-F2-R204', 'F2-R204', 'Plug - R204', true),
('dev-F3-R304', 'F3-R304', 'Plug - R304', true)
on conflict (id) do nothing;

-- telemetry: add a few sample rows (timestamps recent)
insert into telemetry (device_id, room_id, timestamp, voltage, current, watt, energy_kwh, is_on, raw)
values
('dev-F1-R101', 'F1-R101', now() - interval '10 minutes', 230.5, 6.52, 1500, 0.025, true, '{"sample":"seed"}'),
('dev-F1-R101', 'F1-R101', now() - interval '5 minutes', 231.0, 6.48, 1496, 0.049, true, '{"sample":"seed"}'),
('dev-F1-R102', 'F1-R102', now() - interval '8 minutes', 229.8, 3.15, 725, 0.012, true, '{"sample":"seed"}'),
('dev-F2-R201', 'F2-R201', now() - interval '7 minutes', 230.9, 2.98, 686, 0.011, true, '{"sample":"seed"}');
