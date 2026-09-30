# StreetIQ Database Setup

This folder contains the PostgreSQL SQL scripts required to create, populate, test and update the database used by StreetIQ.

---

## 📂 Files

### `databse_structure_creation.sql`

Creates the required empty PostgreSQL database structure.

It creates:

- `routes`
- `buses`
- `road_segments`
- `observations`

and establishes the required foreign-key relationships.

**This file does not insert any data.**

---

### `adding_values_to_db_tables.sql`

Adds the initial project data to the database.

It inserts:

- Route information
- Bus information
- Road-segment information
- Initial road-condition data

---

### `adding_random_observation_entrie.sql`

Adds observation records to the `observations` table.

These observations can be used to test the segment-level aggregation and update process.

The observation data contains:

- Bus ID
- Segment ID
- Route ID
- Observation timestamp
- Road-condition JSON

---

### `updating_segment_data.sql`

Processes the observations collected from different buses.

The script:

1. Extracts individual anomalies from the observation JSON.
2. Groups observations by bus, segment and anomaly.
3. Calculates average anomaly width and position.
4. Rebuilds the road-condition JSON.
5. Aggregates observations across buses.
6. Updates `road_segments.road_condition`.
7. Clears the processed observations table.

The resulting data is stored in:

```text
road_segments.road_condition
