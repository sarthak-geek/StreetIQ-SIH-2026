--\set ON_ERROR_STOP on 
 
BEGIN; 
 
WITH 
 
/* ============================================================ 
   STEP 1 
   Extract every individual entity from every observation. 
   ============================================================ */ 
 
raw_entities AS ( 
 
    SELECT 
        o.segment_id, 
        o.bus_id, 
        category.category_name, 
        entity.entity_no, 
        (entity.entity_data ->> 0)::NUMERIC AS width, 
        (entity.entity_data ->> 1)::NUMERIC AS distance 
 
    FROM observations AS o 
 
    CROSS JOIN LATERAL 
        jsonb_each(o.road_condition) 
        AS category(category_name, category_data) 
 
    CROSS JOIN LATERAL 
        jsonb_array_elements(category.category_data) 
        WITH ORDINALITY 
        AS entity(entity_data, entity_no) 
 
), 
 
/* ============================================================ 
   STEP 2 
   First-level aggregation 
   ============================================================ */ 
 
bus_entity_averages AS ( 
 
    SELECT 
        segment_id, 
        bus_id, 
        category_name, 
        entity_no, 
 
        ROUND(AVG(width), 2) AS avg_width, 
        ROUND(AVG(distance), 2) AS avg_distance 
 
    FROM raw_entities 
 
    GROUP BY 
        segment_id, 
        bus_id, 
        category_name, 
        entity_no 
), 
 
/* ============================================================ 
   STEP 3 
   Rebuild the JSON for every bus/segment combination. 
   ============================================================ */ 
 
bus_category_json AS ( 
 
    SELECT 
        segment_id, 
        bus_id, 
        category_name, 
 
        jsonb_agg( 
            jsonb_build_array( 
                avg_width, 
                avg_distance 
            ) 
            ORDER BY entity_no 
        ) AS entities 
 
    FROM bus_entity_averages 
 
    GROUP BY 
        segment_id, 
        bus_id, 
        category_name 
), 
 
bus_road_conditions AS ( 
 
    SELECT 
        segment_id, 
        bus_id, 
 
        jsonb_object_agg( 
            category_name, 
            entities 
        ) AS road_condition 
 
    FROM bus_category_json 
 
    GROUP BY 
        segment_id, 
        bus_id 
), 
 
/* ============================================================ 
   STEP 4 
   Extract the entities from the already-averaged BUS results. 
   ============================================================ */ 
 
bus_level_entities AS ( 
 
    SELECT 
        b.segment_id, 
        b.bus_id, 
        category.category_name, 
        entity.entity_no, 
 
        (entity.entity_data ->> 0)::NUMERIC AS width, 
        (entity.entity_data ->> 1)::NUMERIC AS distance 
 
    FROM bus_road_conditions AS b 
 
    CROSS JOIN LATERAL 
        jsonb_each(b.road_condition) 
        AS category(category_name, category_data) 
 
    CROSS JOIN LATERAL 
        jsonb_array_elements(category.category_data) 
        WITH ORDINALITY 
        AS entity(entity_data, entity_no) 
), 
 
/* ============================================================ 
   STEP 5 
   Second-level aggregation 
   ============================================================ */ 
 
segment_entity_averages AS ( 
 
    SELECT 
        segment_id, 
        category_name, 
        entity_no, 
 
        ROUND(AVG(width), 2) AS avg_width, 
        ROUND(AVG(distance), 2) AS avg_distance 
 
    FROM bus_level_entities 
 
    GROUP BY 
        segment_id, 
        category_name, 
        entity_no 
), 
 
/* ============================================================ 
   STEP 6 
   Rebuild the final road_condition JSON for each segment. 
   ============================================================ */ 
 
segment_category_json AS ( 
 
    SELECT 
        segment_id, 
        category_name, 
 
        jsonb_agg( 
            jsonb_build_array( 
                avg_width, 
                avg_distance 
            ) 
            ORDER BY entity_no 
        ) AS entities 
 
    FROM segment_entity_averages 
 
    GROUP BY 
        segment_id, 
        category_name 
), 
 
final_segment_data AS ( 
 
    SELECT 
        segment_id, 
 
        jsonb_object_agg( 
            category_name, 
            entities 
        ) AS road_condition 
 
    FROM segment_category_json 
 
    GROUP BY segment_id 
) 
 
/* ============================================================ 
   STEP 7 
   Update road_segments. 
   ============================================================ */ 
 
UPDATE road_segments AS rs 
 
SET road_condition = fsd.road_condition 
 
FROM final_segment_data AS fsd 
 
WHERE rs.segment_id = fsd.segment_id 
 
RETURNING 
    rs.segment_id, 
    rs.road_condition; 
 
TRUNCATE TABLE observations; 
 
COMMIT;