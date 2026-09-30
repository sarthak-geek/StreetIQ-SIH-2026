#StreetIQ-SIH-2026

# AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet

An AI-powered urban monitoring platform that transforms public transport buses into **mobile urban sensing units** using onboard cameras, GPS, Edge AI and cloud-based analytics.

The system detects road anomalies, monitors traffic conditions, processes accident footage and aggregates observations from multiple buses based on predefined road segments.

---

## 🚍 Overview

Public buses repeatedly travel along fixed routes throughout the day. These routes are divided into predefined road segments, allowing observations collected by different buses to be associated with the same segment.

Instead of continuously sending complete camera footage to cloud servers, our system performs most of the processing on an **Edge device** and transfers only the required information.

This reduces unnecessary **bandwidth usage, cloud processing and storage requirements**.

---

## 🔄 System Workflow

```text
Bus Camera + GPS
       ↓
  5-Minute Buffer
       ↓
    Edge Device
       ↓
   YOLO / AI Model
       ↓
 ┌───────────────┬────────────────┐
 │               │                │
Road Anomalies  Traffic        Accidents
 │               │                │
 ↓               ↓                ↓
Segment-wise   Vehicle Count   5-min Video
Data            & Density       → Cloud AI
 │
 ↓
Cloud Database
       ↓
Segment-wise Data Aggregation
       ↓
Digital Twin / Dashboard
