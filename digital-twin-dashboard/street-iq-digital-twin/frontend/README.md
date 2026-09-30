# Street IQ — Urban Digital Twin Frontend

React and Vite frontend for the Street IQ Urban Digital Twin dashboard.

The dashboard visualizes the Hinjewadi road network, road-segment observations, pothole locations, damaged-divider information, and dataset updates received from the Flask backend.

## Technology Stack

- React
- Vite
- React Leaflet
- Leaflet
- Turf.js (`@turf/turf`) for geospatial calculations
- CSS
- Flask API integration

## Features

- Hinjewadi road-network map
- Road-segment visualization
- Pothole location markers on map segments
- Damaged-divider visualization
- Road-anomaly display
- Observation table for the road-segment dataset
- Update Observations button for backend dataset refresh
- Road Anomaly and Traffic Signal controls
- Flask and PostgreSQL dataset integration
- Geospatial calculations for road segments using Turf.js
- Location-based pothole and road-anomaly positioning

## Folder Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── HinjewadiMap.jsx
│   ├── HinjewadiMap.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## Production Build

Create the production build:

```bash
npm run build
```

The final production files are generated inside the `dist` folder.

## Data Flow

```text
Update Observations Button
        ↓
Flask Backend API
        ↓
PostgreSQL Road-Segment Dataset
        ↓
Dashboard Map, Observation Table and Road-Anomaly Display
```

## Security

- The frontend does not connect directly to PostgreSQL.
- Database passwords and secrets must never be stored in frontend code.
- Only the public backend API URL may be used in frontend environment variables.
- Secrets must not use the `VITE_` prefix because those variables are visible in the browser.

## Project Description

Street IQ is an AI-enabled urban digital twin prototype for road-condition monitoring in Hinjewadi. It combines vehicle observations, AI-based anomaly detection, GPS data, Flask APIs, PostgreSQL, and a React dashboard.