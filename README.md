# StreetIQ – AI-Powered Mobile Urban Intelligence Platform

StreetIQ is an AI-powered urban monitoring platform that transforms public transport buses into **mobile urban sensing units** using onboard cameras, GPS and Edge AI.

The system detects road anomalies, monitors traffic conditions, processes accident/incident footage and aggregates observations from multiple buses using predefined road segments.

---

## 🚍 Overview

Public buses repeatedly travel along assigned routes throughout the day. Each route is divided into predefined road segments with unique segment IDs.

Instead of continuously transferring complete camera footage from every bus to cloud servers, StreetIQ performs most routine processing on an **edge device** and transfers only the required information.

This reduces unnecessary:

- Network bandwidth
- Cloud processing
- Data storage

Observations collected from different buses are grouped by road-segment ID and evaluated centrally.

---

## 🔄 System Workflow

```text
Bus Camera + GPS
       │
       ▼
  5-Minute Buffer
       │
       ▼
   Edge Device
       │
       ▼
 YOLO / AI Model
       │
 ┌─────┼──────────────┐
 ▼     ▼              ▼
Road  Traffic      Accident /
Anomaly Analysis   Incident
 │     │              │
 ▼     ▼              ▼
Segment  Vehicle    5-Minute
Data     Count      Video
 │       & Density     │
 │                     ▼
 │                  Cloud AI
 │
 └──────────┬──────────┘
            ▼
       Cloud Database
            │
            ▼
   Segment-wise Analysis
            │
            ▼
    Digital Twin / GIS
       Dashboard
