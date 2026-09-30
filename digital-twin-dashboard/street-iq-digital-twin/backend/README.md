# Street IQ — Urban Digital Twin Backend

Flask backend for the Street IQ Urban Digital Twin dashboard.

The backend connects the React dashboard with the PostgreSQL road-segment dataset. It provides road-condition observations such as potholes and damaged-divider information.

## Main Backend File

```text
backend.py
```

## Technology Stack

- Python
- Flask
- Flask-CORS
- PostgreSQL
- SQL
- Gunicorn

## Features

- Connects Flask API with PostgreSQL road-segment dataset
- Provides road-segment observation data to the frontend
- Supports pothole and damaged-divider data
- Updates dashboard data through API integration
- Keeps database operations on the server side
- Supports secure deployment through environment variables

## Data Flow

```text
PostgreSQL Dataset
        ↓
Flask Backend
        ↓
API Response
        ↓
React Dashboard
        ↓
Map, Observation Table and Road-Anomaly Display
```

## Road Condition Data Format

Example database road-condition data:

```json
{
  "potholes": [[80, 0.10]],
  "damaged_divider": [[25, 0.65]]
}
```

Explanation:

- `80` is the pothole width percentage.
- `0.10` is the pothole position from the beginning of the road segment.
- `0.65` is the damaged-divider position from the beginning of the road segment.

## Local Setup

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
python backend.py
```

## Deployment

The backend can be deployed as a Flask web service.

Production command:

```bash
gunicorn backend:app --bind 0.0.0.0:$PORT
```

## Security

- Do not commit database passwords, API keys, or `.env` files to GitHub.
- Store database credentials in deployment environment variables.
- The frontend must never connect directly to PostgreSQL.
- Enable CORS only for the deployed frontend URL.
- Disable Flask debug mode during deployment.
- Use parameterized SQL queries for all database operations.

## Project Description

Street IQ is an AI-enabled urban digital twin prototype for detecting and visualizing road anomalies in Hinjewadi using vehicle observations, AI processing, PostgreSQL, Flask, and React.