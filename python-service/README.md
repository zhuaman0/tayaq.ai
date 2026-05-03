# Tayaq.ai — H3 Geospatial Python Service

This microservice uses **Uber's H3** hexagonal indexing to spatially organize student locations, school branches, and events across Kazakhstan.

## Setup

```bash
cd python-service
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check + H3 version |
| POST | `/index-location` | Convert lat/lng → H3 cell |
| GET | `/schools` | All school branches with H3 cells |
| GET | `/events` | All events with H3 cells |
| GET | `/students/nearby?lat=43.24&lng=76.94` | Find students nearby |
| GET | `/schools/nearby?lat=43.24&lng=76.94` | Find schools nearby |
| GET | `/heatmap` | Student density heatmap by hex cell |

## Interactive Docs

Open `http://localhost:8000/docs` for auto-generated Swagger UI.
