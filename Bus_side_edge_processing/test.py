from flask import Flask, render_template
from flask_sock import Sock

import json
import base64
import cv2
import numpy as np
import threading
import queue
import pandas as pd
import psycopg
from ultralytics import YOLO


# ============================================================
# FLASK SETUP
# ============================================================

app = Flask(__name__)
sock = Sock(app)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "Street_IQ",
    "user": "postgres",
    "password": "272006"
}

TABLE_NAME = "observations"


# ============================================================
# ROUTE / SEGMENT DATA
# ============================================================

transition_region_radius = 0.000239

segments = pd.Series(
    [
        [18.607182, 73.755724],
        [18.608177, 73.754858],
        [18.608085, 73.753079],
        [18.608204, 73.751464]
    ],
    index=[
        "seg1",
        "seg2",
        "seg3",
        "end"
    ]
)


# ============================================================
# CALCULATE TOTAL LENGTH OF EACH SEGMENT
# ============================================================

segment_lengths = {}

for i in range(len(segments) - 1):

    start_point = segments.iloc[i]
    end_point = segments.iloc[i + 1]

    segment_lengths[
        segments.index[i]
    ] = np.sqrt(

        (
            end_point[0]
            -
            start_point[0]
        ) ** 2

        +

        (
            end_point[1]
            -
            start_point[1]
        ) ** 2
    )


# ============================================================
# ANOMALY CLASSES
# ============================================================

class_names = [
    "potholes"
]


# ============================================================
# SHARED GPS + SEGMENT STATE
# ============================================================

shared_state = {
    "latitude": None,
    "longitude": None,
    "current_segment": 0
}

gps_lock = threading.Lock()


# ============================================================
# OBSERVATIONS
# ============================================================

observations = pd.DataFrame(
    columns=[
        "anomaly_type",
        "width",
        "position"
    ]
)

observations.index.name = "track_id"


# ============================================================
# YOLO MODEL
# ============================================================

model = YOLO(
    r"C:\SARTHAK\SIH\prototype\YOLO\model\pothole_Detection_YOLO11n.pt"
)


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# ============================================================
# CONVERT OBSERVATIONS TO JSON
# ============================================================

def observations_to_json():

    grouped_data = {}

    for anomaly_type, group in observations.groupby(
        "anomaly_type"
    ):

        grouped_data[anomaly_type] = [

            [
                row["width"],
                row["position"]
            ]

            for _, row in group.iterrows()

        ]

    return grouped_data


# ============================================================
# INSERT ROAD CONDITION INTO DATABASE
# ============================================================

def insert_road_condition(
    bus_id,
    segment_id,
    road_condition
):

    try:

        connection = psycopg.connect(
            **DB_CONFIG
        )

        cursor = connection.cursor()

        query = f"""
            INSERT INTO {TABLE_NAME}
            (
                bus_id,
                segment_id,
                observed_at,
                road_condition
            )
            VALUES
            (
                %s,
                %s,
                NULL,
                %s
            )
        """

        cursor.execute(
            query,
            (
                bus_id,
                segment_id,
                json.dumps(road_condition)
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        print(
            "[DATABASE] "
            f"Road condition inserted for "
            f"Bus={bus_id}, "
            f"Segment={segment_id}"
        )

        return True

    except Exception as e:

        print(
            "[DATABASE ERROR]",
            e
        )

        return False


# ============================================================
# CAMERA / YOLO WORKER
# ============================================================

def yolo_worker(
    frame_queue,
    stop_event
):

    print(
        "[YOLO] Worker started"
    )

    while not stop_event.is_set():

        # ====================================================
        # WAIT FOR A FRAME
        # ====================================================

        try:

            image_data = frame_queue.get(
                timeout=0.5
            )

        except queue.Empty:

            continue


        # ====================================================
        # DECODE BASE64 IMAGE
        # ====================================================

        try:

            if "," in image_data:

                image_data = image_data.split(
                    ",",
                    1
                )[1]


            image_bytes = base64.b64decode(
                image_data
            )


            np_arr = np.frombuffer(
                image_bytes,
                np.uint8
            )


            frame = cv2.imdecode(
                np_arr,
                cv2.IMREAD_COLOR
            )


            if frame is None:

                print(
                    "[YOLO] Could not decode frame"
                )

                continue


        except Exception as e:

            print(
                "[YOLO] Image decoding error:",
                e
            )

            continue


        # ====================================================
        # YOLO TRACKING
        # ====================================================

        try:

            results = model.track(

                frame,

                conf=0.75,

                imgsz=640,

                persist=True,

                verbose=False
            )

            result = results[0]


        except Exception as e:

            print(
                "[YOLO] Inference error:",
                e
            )

            continue


        # ====================================================
        # EXTRACT TRACKING DATA
        # ====================================================

        if result.boxes.id is not None:

            boxes = (
                result.boxes
                .xyxy
                .cpu()
                .numpy()
            )


            ids = (
                result.boxes
                .id
                .cpu()
                .numpy()
            )


            classes = (
                result.boxes
                .cls
                .cpu()
                .numpy()
            )


            confidence = (
                result.boxes
                .conf
                .cpu()
                .numpy()
            )


            # =================================================
            # PROCESS EACH DETECTED OBJECT
            # =================================================

            for box, track_id, cls, conf in zip(

                boxes,
                ids,
                classes,
                confidence
            ):

                x1, y1, x2, y2 = map(
                    int,
                    box
                )


                track_id = int(
                    track_id
                )

                cls = int(
                    cls
                )


                # =================================================
                # ANOMALY TYPE
                # =================================================

                anomaly_type = class_names[cls]


                # =================================================
                # WIDTH AS PERCENTAGE OF FRAME WIDTH
                # =================================================

                frame_height, frame_width = (
                    frame.shape[:2]
                )

                box_width = x2 - x1

                width = (
                    box_width
                    /
                    frame_width
                ) * 100


                # =================================================
                # DRAW BOUNDING BOX
                # =================================================

                cv2.rectangle(

                    frame,

                    (x1, y1),

                    (x2, y2),

                    (0, 255, 0),

                    2
                )


                # =================================================
                # DISPLAY INFORMATION
                # =================================================

                cv2.putText(

                    frame,

                    f"{anomaly_type} "
                    f"ID:{track_id} "
                    f"{conf:.2f}",

                    (x1, y1 - 10),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.6,

                    (0, 255, 0),

                    2
                )


                # =================================================
                # GET CURRENT GPS + SEGMENT
                # =================================================

                with gps_lock:

                    current_latitude = (
                        shared_state["latitude"]
                    )

                    current_longitude = (
                        shared_state["longitude"]
                    )

                    current_segment = (
                        shared_state[
                            "current_segment"
                        ]
                    )


                    anomaly_segment = (
                        segments.index[
                            current_segment
                        ]
                    )


                    segment_start = (
                        segments.iloc[
                            current_segment
                        ]
                    )


                # =================================================
                # CALCULATE POSITION AS %
                # OF TOTAL SEGMENT LENGTH
                # =================================================

                position = None


                if (

                    current_latitude is not None

                    and

                    current_longitude is not None

                ):

                    distance_from_start = np.sqrt(

                        (
                            current_latitude
                            -
                            segment_start[0]
                        ) ** 2

                        +

                        (
                            current_longitude
                            -
                            segment_start[1]
                        ) ** 2
                    )


                    total_segment_length = (
                        segment_lengths[
                            anomaly_segment
                        ]
                    )


                    if total_segment_length > 0:

                        position = (

                            distance_from_start
                            /
                            total_segment_length

                        ) * 100


                # =================================================
                # STORE ANOMALY OBSERVATION
                # =================================================

                if (

                    position is not None

                    and

                    track_id not in observations.index

                ):

                    observations.loc[
                        track_id
                    ] = [

                        anomaly_type,

                        width,

                        position
                    ]


                    print(

                        f"[ANOMALY] "

                        f"Type="
                        f"{anomaly_type} | "

                        f"ID="
                        f"{track_id} | "

                        f"Width="
                        f"{width:.2f}% | "

                        f"Position="
                        f"{position:.2f}% | "

                        f"Segment="
                        f"{anomaly_segment}"
                    )


        # ====================================================
        # DISPLAY PROCESSED FRAME
        # ====================================================

        cv2.imshow(

            "YOLO + Tracker",

            frame
        )


        # ====================================================
        # CHECK FOR Q
        # ====================================================

        if cv2.waitKey(1) & 0xFF == ord("q"):

            stop_event.set()

            break


    print(
        "[YOLO] Worker stopped"
    )


# ============================================================
# WEBSOCKET
# ============================================================

@sock.route("/ws")
def websocket(ws):

    print(
        "Phone connected!"
    )


    # ========================================================
    # BUS ID
    # ========================================================

    bus_id = None


    # ========================================================
    # LATEST-FRAME QUEUE
    # ========================================================

    frame_queue = queue.Queue(
        maxsize=1
    )


    # ========================================================
    # STOP EVENT
    # ========================================================

    stop_event = threading.Event()


    # ========================================================
    # START YOLO WORKER
    # ========================================================

    worker = threading.Thread(

        target=yolo_worker,

        args=(

            frame_queue,

            stop_event

        ),

        daemon=True
    )

    worker.start()


    try:

        # ====================================================
        # PRODUCER
        # ====================================================

        while not stop_event.is_set():

            # ------------------------------------------------
            # RECEIVE MESSAGE FROM PHONE
            # ------------------------------------------------

            message = ws.receive()


            if message is None:

                break


            # ------------------------------------------------
            # JSON -> PYTHON DICTIONARY
            # ------------------------------------------------

            data = json.loads(
                message
            )

            data_type = data.get(
                "type"
            )


            # =================================================
            # BUS ID
            # =================================================

            if data_type == "bus_id":

                bus_id = str(
                    data["bus_id"]
                )


                print(
                    f"[BUS] Bus ID received: "
                    f"{bus_id}"
                )


            # =================================================
            # GPS DATA
            # =================================================

            elif data_type == "gps":

                latitude = data[
                    "latitude"
                ]

                longitude = data[
                    "longitude"
                ]


                # =================================================
                # UPDATE SHARED GPS DATA + SEGMENT
                # =================================================

                with gps_lock:

                    shared_state[
                        "latitude"
                    ] = latitude

                    shared_state[
                        "longitude"
                    ] = longitude


                    current_segment = (
                        shared_state[
                            "current_segment"
                        ]
                    )


                    # =================================================
                    # SEGMENT TRANSITION
                    # =================================================

                    if (

                        current_segment
                        <
                        len(segments) - 1

                    ):

                        next_point = (
                            segments.iloc[
                                current_segment + 1
                            ]
                        )


                        distance = np.sqrt(

                            (
                                latitude
                                -
                                next_point[0]
                            ) ** 2

                            +

                            (
                                longitude
                                -
                                next_point[1]
                            ) ** 2
                        )


                        if (

                            distance
                            <
                            transition_region_radius

                        ):

                            previous_segment = (
                                segments.index[
                                    current_segment
                                ]
                            )


                            # =================================================
                            # CONVERT OBSERVATIONS TO JSON
                            # =================================================

                            observations_json = (
                                observations_to_json()
                            )


                            print(
                                "[OBSERVATIONS JSON]"
                            )

                            print(
                                json.dumps(
                                    observations_json,
                                    indent=4
                                )
                            )


                            # =================================================
                            # INSERT INTO DATABASE
                            # =================================================

                            if bus_id is not None:

                                success = (
                                    insert_road_condition(

                                        bus_id,

                                        previous_segment,

                                        observations_json

                                    )
                                )

                            else:

                                print(
                                    "[DATABASE] "
                                    "Bus ID not received. "
                                    "Observation not inserted."
                                )

                                success = False


                            # =================================================
                            # MOVE TO NEXT SEGMENT ONLY
                            # AFTER SUCCESSFUL TRANSMISSION
                            # =================================================

                            if success:

                                shared_state[
                                    "current_segment"
                                ] += 1


                                new_segment = (
                                    segments.index[
                                        shared_state[
                                            "current_segment"
                                        ]
                                    ]
                                )


                                print(

                                    f"[SEGMENT] "
                                    f"Bus entered "
                                    f"{new_segment}"
                                )


                                # =================================================
                                # CLEAR OBSERVATIONS
                                # =================================================

                                observations.drop(
                                    observations.index,
                                    inplace=True
                                )


                                print(
                                    "[OBSERVATIONS] "
                                    "DataFrame cleared"
                                )


                                # =================================================
                                # TERMINATE AT END
                                # =================================================

                                if new_segment == "end":

                                    print(
                                        "[ROUTE] "
                                        "End of route reached."
                                    )

                                    print(
                                        "[ROUTE] "
                                        "Previous segment data "
                                        "successfully transmitted."
                                    )


                                    stop_event.set()

                                    break


                            else:

                                print(
                                    "[SEGMENT] "
                                    "Database transmission "
                                    "failed. "
                                    "Program will continue."
                                )


                    current_segment = (
                        shared_state[
                            "current_segment"
                        ]
                    )


                # =================================================
                # GPS OUTPUT
                # =================================================

                print(

                    f"[GPS] "

                    f"Lat: "
                    f"{latitude:.6f} | "

                    f"Lon: "
                    f"{longitude:.6f} | "

                    f"Segment: "
                    f"{segments.index[current_segment]}"
                )


            # =================================================
            # CAMERA DATA
            # =================================================

            elif data_type == "camera":

                image_data = data[
                    "image"
                ]


                # =================================================
                # LATEST-FRAME BUFFER
                # =================================================

                try:

                    frame_queue.get_nowait()

                except queue.Empty:

                    pass


                # =================================================
                # PUT NEWEST FRAME INTO QUEUE
                # =================================================

                try:

                    frame_queue.put_nowait(
                        image_data
                    )

                except queue.Full:

                    pass


    except Exception as e:

        import traceback

        print(
            "[WEBSOCKET ERROR]"
        )

        traceback.print_exc()


    finally:

        print(
            "Phone disconnected"
        )


        # ========================================================
        # STOP YOLO WORKER
        # ========================================================

        stop_event.set()


        # ========================================================
        # WAIT FOR WORKER
        # ========================================================

        worker.join(
            timeout=2
        )


        cv2.destroyAllWindows()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print(
        "Starting server..."
    )


    app.run(

        host="0.0.0.0",

        port=5000,

        debug=False,

        ssl_context="adhoc"
    )