-- ============================================================
-- StreetIQ - Initial Database Data
-- Inserts existing project data
-- ============================================================


-- ============================================================
-- 1. ROUTES
-- ============================================================

INSERT INTO routes
(
    route_id,
    route_number,
    route_name,
    start_point,
    end_point
)
VALUES
(
    'R01',
    'R01',
    'Bhumkar chowk to Tathawade chowk',
    '{18.609043,73.751192}',
    '{18.628519,73.754108}'
);


-- ============================================================
-- 2. BUSES
-- ============================================================

INSERT INTO buses
(
    bus_id,
    registration_number,
    operator,
    status
)
VALUES
    ('B01', 'MH14A74040', 'PMC', 'Active'),
    ('B02', 'MH14AY4041', 'PMC', 'Active'),
    ('B03', 'MH14AX4042', 'PMC', 'Active');


-- ============================================================
-- 3. ROAD SEGMENTS
-- ============================================================

INSERT INTO road_segments
(
    segment_id,
    road_name,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    segment_length_m,
    road_condition
)
VALUES

(
    'S01',
    'Bhumkar chowk to Tathawade chowk',
    18.6090920,
    73.7510970,
    18.6134640,
    73.7521660,
    NULL,
    '{
        "potholes": [
            [12.54, 20.00],
            [8.28, 45.00]
        ],
        "damaged_divider": [
            [15.02, 70.25],
            [10.44, 92.00]
        ]
    }'::JSONB
),

(
    'S02',
    'Bhumkar chowk to Tathawade chowk',
    18.6134640,
    73.7521660,
    18.6178360,
    73.7519300,
    NULL,
    '{
        "potholes": [
            [10.26, 30.06],
            [7.52, 58.11]
        ],
        "damaged_divider": [
            [12.07, 50.11],
            [9.52, 90.11]
        ]
    }'::JSONB
),

(
    'S03',
    'Bhumkar chowk to Tathawade chowk',
    18.6178360,
    73.7519300,
    18.6224800,
    73.7516080,
    NULL,
    '{
        "potholes": [
            [7.49, 25.00],
            [6.22, 55.00]
        ],
        "damaged_divider": [
            [10.99, 45.00],
            [8.53, 85.00]
        ]
    }'::JSONB
),

(
    'S04',
    'Bhumkar chowk to Tathawade chowk',
    18.6224800,
    73.7516080,
    18.6262950,
    73.7515220,
    NULL,
    '{
        "potholes": [
            [14.19, 15.17],
            [9.51, 40.17]
        ],
        "damaged_divider": [
            [18.01, 65.44]
        ]
    }'::JSONB
);