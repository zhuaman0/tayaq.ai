"""
Tayaq.ai — H3 Geospatial Microservice
=====================================
Uses Uber's H3 hexagonal indexing to index student locations,
school branches, and events across Kazakhstan.

H3 converts lat/lng coordinates → hexagonal cell IDs for fast
spatial queries (nearby searches, density heatmaps, clustering).

Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import h3
import os
import json
from datetime import datetime

app = FastAPI(
    title="Tayaq.ai Geo Service",
    description="H3 hexagonal geospatial indexing for student locations, schools & events",
    version="1.0.0",
)

# Allow Nuxt dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# H3 Resolution Guide:
#   Resolution 4 → ~1,770 km² (country-level overview)
#   Resolution 7 → ~5.16 km²  (city/district level) ← we use this
#   Resolution 9 → ~0.1 km²   (neighborhood level)
# ---------------------------------------------------------------------------

H3_RESOLUTION = 7  # Good for city-level clustering

# ---------------------------------------------------------------------------
#  DATA MODELS
# ---------------------------------------------------------------------------


class LocationInput(BaseModel):
    """Input model for converting a coordinate to H3 index."""

    lat: float
    lng: float
    name: Optional[str] = None
    type: Optional[str] = "student"  # student | school | event


class SchoolBranch(BaseModel):
    """A school or learning center location."""

    id: int
    name: str
    city: str
    lat: float
    lng: float
    h3_index: str
    student_count: int


class Event(BaseModel):
    """A learning event or meetup."""

    id: int
    title: str
    description: str
    city: str
    lat: float
    lng: float
    h3_index: str
    date: str
    attendees: int


# ---------------------------------------------------------------------------
#  SEED DATA — Real Kazakhstan locations
# ---------------------------------------------------------------------------

SCHOOLS_DATA = [
    {
        "id": 1,
        "name": "SDU (Suleyman Demirel University)",
        "city": "Almaty",
        "lat": 43.2068,
        "lng": 76.6695,
        "student_count": 450,
    },
    {
        "id": 2,
        "name": "Nazarbayev University",
        "city": "Astana",
        "lat": 51.0905,
        "lng": 71.3965,
        "student_count": 620,
    },
    {
        "id": 3,
        "name": "KBTU (Kazakh-British Technical University)",
        "city": "Almaty",
        "lat": 43.2383,
        "lng": 76.9455,
        "student_count": 380,
    },
    {
        "id": 4,
        "name": "Satbayev University (KazNRTU)",
        "city": "Almaty",
        "lat": 43.2364,
        "lng": 76.9093,
        "student_count": 290,
    },
    {
        "id": 5,
        "name": "Al-Farabi Kazakh National University",
        "city": "Almaty",
        "lat": 43.2220,
        "lng": 76.9243,
        "student_count": 530,
    },
    {
        "id": 6,
        "name": "KIMEP University",
        "city": "Almaty",
        "lat": 43.2409,
        "lng": 76.9271,
        "student_count": 310,
    },
    {
        "id": 7,
        "name": "ENU (Eurasian National University)",
        "city": "Astana",
        "lat": 51.1258,
        "lng": 71.4306,
        "student_count": 400,
    },
    {
        "id": 8,
        "name": "AITU (Astana IT University)",
        "city": "Astana",
        "lat": 51.0901,
        "lng": 71.4183,
        "student_count": 280,
    },
    {
        "id": 9,
        "name": "Turan University",
        "city": "Almaty",
        "lat": 43.2285,
        "lng": 76.9455,
        "student_count": 190,
    },
    {
        "id": 10,
        "name": "Karaganda Technical University",
        "city": "Karaganda",
        "lat": 49.8047,
        "lng": 73.1094,
        "student_count": 210,
    },
]

EVENTS_DATA = [
    {
        "id": 1,
        "title": "English Speaking Marathon",
        "description": "24-hour English-only speaking challenge. Survive the roasts!",
        "city": "Almaty",
        "lat": 43.2380,
        "lng": 76.9455,
        "date": "2026-03-15",
        "attendees": 85,
    },
    {
        "id": 2,
        "title": "Tayaq.ai Launch Party",
        "description": "Official launch event with live roasting sessions and prizes",
        "city": "Astana",
        "lat": 51.0905,
        "lng": 71.3965,
        "date": "2026-04-01",
        "attendees": 120,
    },
    {
        "id": 3,
        "title": "Grammar Battle Royale",
        "description": "Students compete in timed grammar challenges. Last one standing wins!",
        "city": "Almaty",
        "lat": 43.2220,
        "lng": 76.9243,
        "date": "2026-03-20",
        "attendees": 60,
    },
    {
        "id": 4,
        "title": "IELTS Prep Workshop",
        "description": "Intensive IELTS speaking practice with Tayaq.ai AI assistance",
        "city": "Karaganda",
        "lat": 49.8047,
        "lng": 73.1094,
        "date": "2026-03-25",
        "attendees": 45,
    },
    {
        "id": 5,
        "title": "University English Club Meetup",
        "description": "Monthly meetup for university students to practice English",
        "city": "Astana",
        "lat": 51.1258,
        "lng": 71.4306,
        "date": "2026-03-10",
        "attendees": 35,
    },
]

# Simulated student locations (spread across Kazakhstan)
STUDENT_LOCATIONS = [
    {"lat": 43.2380, "lng": 76.9300, "city": "Almaty"},
    {"lat": 43.2100, "lng": 76.8700, "city": "Almaty"},
    {"lat": 43.2500, "lng": 76.9500, "city": "Almaty"},
    {"lat": 43.2200, "lng": 76.9100, "city": "Almaty"},
    {"lat": 43.2600, "lng": 76.9200, "city": "Almaty"},
    {"lat": 43.2150, "lng": 76.9600, "city": "Almaty"},
    {"lat": 43.2050, "lng": 76.8900, "city": "Almaty"},
    {"lat": 43.2450, "lng": 76.9350, "city": "Almaty"},
    {"lat": 51.0900, "lng": 71.4000, "city": "Astana"},
    {"lat": 51.1000, "lng": 71.4200, "city": "Astana"},
    {"lat": 51.1200, "lng": 71.4100, "city": "Astana"},
    {"lat": 51.0800, "lng": 71.4300, "city": "Astana"},
    {"lat": 51.1100, "lng": 71.4500, "city": "Astana"},
    {"lat": 49.8000, "lng": 73.1000, "city": "Karaganda"},
    {"lat": 49.8100, "lng": 73.1200, "city": "Karaganda"},
    {"lat": 42.3150, "lng": 69.5970, "city": "Shymkent"},
    {"lat": 42.3200, "lng": 69.6050, "city": "Shymkent"},
    {"lat": 50.2839, "lng": 57.2100, "city": "Aktobe"},
    {"lat": 51.7180, "lng": 51.3630, "city": "Oral"},
    {"lat": 47.0945, "lng": 51.9238, "city": "Atyrau"},
]


def add_h3_index(item: dict) -> dict:
    """Add H3 hex cell ID to any item with lat/lng."""
    item["h3_index"] = h3.latlng_to_cell(item["lat"], item["lng"], H3_RESOLUTION)
    return item


# Pre-compute H3 indexes
SCHOOLS = [add_h3_index(s) for s in SCHOOLS_DATA]
EVENTS = [add_h3_index(e) for e in EVENTS_DATA]
STUDENTS = [add_h3_index(s) for s in STUDENT_LOCATIONS]


# ---------------------------------------------------------------------------
#  API ENDPOINTS
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    """Health check — confirms the H3 service is running."""
    return {
        "service": "Tayaq.ai Geo Service",
        "status": "running",
        "h3_library": "h3 v4.x",
        "resolution": H3_RESOLUTION,
        "hex_area_km2": round(
            h3.cell_area(h3.latlng_to_cell(43.24, 76.94, H3_RESOLUTION), unit="km^2"), 2
        ),
    }


@app.post("/index-location")
def index_location(loc: LocationInput):
    """
    Convert a lat/lng coordinate to an H3 hexagonal cell ID.

    This is the core H3 operation: given any point on Earth, H3 returns
    a unique hexagonal cell identifier at the specified resolution.
    """
    h3_index = h3.latlng_to_cell(loc.lat, loc.lng, H3_RESOLUTION)

    # Get the hexagon boundary (polygon vertices) for map rendering
    boundary = h3.cell_to_boundary(h3_index)

    # Get neighboring hexagons (useful for "nearby" queries)
    neighbors = list(h3.grid_disk(h3_index, 1))

    # Get the center point of the hex cell
    center = h3.cell_to_latlng(h3_index)

    return {
        "input": {"lat": loc.lat, "lng": loc.lng, "name": loc.name},
        "h3": {
            "index": h3_index,
            "resolution": H3_RESOLUTION,
            "center": {"lat": center[0], "lng": center[1]},
            "boundary": [{"lat": b[0], "lng": b[1]} for b in boundary],
            "neighbors": neighbors,
            "area_km2": round(h3.cell_area(h3_index, unit="km^2"), 2),
        },
    }


@app.get("/schools")
def get_schools():
    """
    Return all school branches with their H3 cell IDs.
    Each school is indexed into a hexagonal cell for spatial queries.
    """
    return {
        "count": len(SCHOOLS),
        "resolution": H3_RESOLUTION,
        "schools": SCHOOLS,
    }


@app.get("/events")
def get_events():
    """
    Return all upcoming events with their H3 cell IDs.
    Events are indexed by location for proximity-based discovery.
    """
    return {
        "count": len(EVENTS),
        "resolution": H3_RESOLUTION,
        "events": EVENTS,
    }


@app.get("/students/nearby")
def find_nearby_students(lat: float, lng: float, ring_size: int = 1):
    """
    Find students near a given location using H3 grid_disk.

    H3's grid_disk returns all hex cells within `ring_size` rings
    of the target cell — this is MUCH faster than computing distances
    for every student (O(1) vs O(n)).
    """
    target_cell = h3.latlng_to_cell(lat, lng, H3_RESOLUTION)

    # Get all hex cells within the ring (including the center)
    search_cells = set(h3.grid_disk(target_cell, ring_size))

    # Find students whose H3 cell is in the search area
    nearby = [s for s in STUDENTS if s["h3_index"] in search_cells]

    return {
        "target": {"lat": lat, "lng": lng, "h3_index": target_cell},
        "search_radius_cells": ring_size,
        "cells_searched": len(search_cells),
        "students_found": len(nearby),
        "students": nearby,
    }


@app.get("/heatmap")
def get_student_heatmap():
    """
    Generate a student density heatmap using H3 hex cells.

    Groups students by their H3 cell and returns the count per cell,
    along with the cell boundary polygon for map visualization.
    """
    # Count students per hex cell
    cell_counts: dict[str, int] = {}
    for student in STUDENTS:
        cell = student["h3_index"]
        cell_counts[cell] = cell_counts.get(cell, 0) + 1

    # Build heatmap data with hex boundaries
    heatmap = []
    for cell_id, count in cell_counts.items():
        boundary = h3.cell_to_boundary(cell_id)
        center = h3.cell_to_latlng(cell_id)
        heatmap.append(
            {
                "h3_index": cell_id,
                "student_count": count,
                "center": {"lat": center[0], "lng": center[1]},
                "boundary": [{"lat": b[0], "lng": b[1]} for b in boundary],
            }
        )

    # Sort by density (highest first)
    heatmap.sort(key=lambda x: x["student_count"], reverse=True)

    return {
        "total_students": len(STUDENTS),
        "unique_cells": len(cell_counts),
        "resolution": H3_RESOLUTION,
        "heatmap": heatmap,
    }


@app.get("/schools/nearby")
def find_nearby_schools(lat: float, lng: float, ring_size: int = 2):
    """
    Find schools near a location using H3 spatial indexing.
    Searches hex cells within `ring_size` rings of the target location.
    """
    target_cell = h3.latlng_to_cell(lat, lng, H3_RESOLUTION)
    search_cells = set(h3.grid_disk(target_cell, ring_size))

    nearby = [s for s in SCHOOLS if s["h3_index"] in search_cells]

    return {
        "target": {"lat": lat, "lng": lng, "h3_index": target_cell},
        "search_radius_cells": ring_size,
        "schools_found": len(nearby),
        "schools": nearby,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
