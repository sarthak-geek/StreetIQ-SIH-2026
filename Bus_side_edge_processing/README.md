# Bus-Side Edge Processing

This folder contains the prototype for the **bus-side edge processing system** of StreetIQ.

The system uses a phone/device as a prototype bus camera and GPS sensor. Camera frames and GPS coordinates are sent to a Flask server running the edge-processing code. The YOLO model processes the camera frames, detects road anomalies, and associates each detected anomaly with the current road segment.

The processed road-condition information is then sent to the PostgreSQL database segment-wise.

---

## How It Works

The bus-side prototype follows this flow:

```text
Phone Camera + GPS
        |
        v
   Flask Server
        |
        +------ GPS coordinates
        |          |
        |          v
        |    Identify Segment
        |
        +------ Camera frames
                   |
                   v
              YOLO + Tracker
                   |
                   v
            Detect Anomalies
                   |
                   v
        Calculate Relative Data
        (Width % + Position %)
                   |
                   v
            Segment-wise JSON
                   |
                   v
             PostgreSQL


---
    "dbname": "",
    "user": "",
    "password": ""
}
