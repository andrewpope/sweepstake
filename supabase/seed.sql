-- 48 World Cup 2026 teams across 12 groups (A–L).
-- Idempotent: ON CONFLICT (code) DO NOTHING so re-running seeds is safe.
-- Group composition here is illustrative — actual draw determines real groups.

insert into public.teams (name, code, group_name, seed) values
  -- Group A
  ('United States',  'USA', 'A', 1),
  ('Iran',           'IRN', 'A', 25),
  ('Senegal',        'SEN', 'A', 19),
  ('Ecuador',        'ECU', 'A', 31),

  -- Group B
  ('Canada',         'CAN', 'B', 2),
  ('South Korea',    'KOR', 'B', 26),
  ('Belgium',        'BEL', 'B', 14),
  ('Algeria',        'ALG', 'B', 32),

  -- Group C
  ('Mexico',         'MEX', 'C', 3),
  ('Morocco',        'MAR', 'C', 13),
  ('Croatia',        'CRO', 'C', 15),
  ('Saudi Arabia',   'KSA', 'C', 33),

  -- Group D
  ('Argentina',      'ARG', 'D', 4),
  ('Australia',      'AUS', 'D', 27),
  ('Poland',         'POL', 'D', 21),
  ('Tunisia',        'TUN', 'D', 34),

  -- Group E
  ('Brazil',         'BRA', 'E', 5),
  ('Switzerland',    'SUI', 'E', 16),
  ('Cameroon',       'CMR', 'E', 28),
  ('Serbia',         'SRB', 'E', 22),

  -- Group F
  ('France',         'FRA', 'F', 6),
  ('Denmark',        'DEN', 'F', 17),
  ('Peru',           'PER', 'F', 35),
  ('Iceland',        'ISL', 'F', 36),

  -- Group G
  ('England',        'ENG', 'G', 7),
  ('Wales',          'WAL', 'G', 23),
  ('Iraq',           'IRQ', 'G', 37),
  ('Costa Rica',     'CRC', 'G', 38),

  -- Group H
  ('Germany',        'GER', 'H', 8),
  ('Spain',          'ESP', 'H', 9),
  ('Japan',          'JPN', 'H', 18),
  ('New Zealand',    'NZL', 'H', 39),

  -- Group I
  ('Portugal',       'POR', 'I', 10),
  ('Uruguay',        'URU', 'I', 24),
  ('Ghana',          'GHA', 'I', 29),
  ('Jordan',         'JOR', 'I', 40),

  -- Group J
  ('Italy',          'ITA', 'J', 11),
  ('Egypt',          'EGY', 'J', 30),
  ('Nigeria',        'NGA', 'J', 20),
  ('Panama',         'PAN', 'J', 41),

  -- Group K
  ('Netherlands',    'NED', 'K', 12),
  ('Ivory Coast',    'CIV', 'K', 42),
  ('Sweden',         'SWE', 'K', 43),
  ('Jamaica',        'JAM', 'K', 44),

  -- Group L
  ('Hungary',        'HUN', 'L', 45),
  ('Turkey',         'TUR', 'L', 46),
  ('Uzbekistan',     'UZB', 'L', 47),
  ('Paraguay',       'PAR', 'L', 48)
on conflict (code) do nothing;
