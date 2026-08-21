# AI-IoT Sanitation Worker Safety Intelligence Platform

> An AI-powered municipal safety monitoring dashboard designed to protect sanitation workers operating inside hazardous sewer and drainage environments.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Dashboard-2563EB?style=for-the-badge)](https://ai-iot-sanitation-worker-safety-dashboard.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Sudeepthi-235/AI-IOT-SANITATION-WORKER-SAFETY-DASHBOARD)

---

## Live Demo

🌐 **https://ai-iot-sanitation-worker-safety-dashboard.onrender.com**

The deployed platform provides a simulated municipal control-room environment where supervisors can monitor worker health, environmental hazards, emergency situations, exposure levels, and rescue operations.

---

## Project Overview

Sanitation workers operating inside sewers, manholes, drainage lines, and underground wastewater systems are exposed to serious occupational hazards.

These include:

- Toxic gases such as H₂S and CO
- Low oxygen levels
- Methane accumulation
- Extreme temperatures
- Sudden flooding
- Falls and physical injuries
- Excessive physiological stress
- Long-term hazardous exposure
- Communication and connectivity failures

Traditional monitoring methods often depend heavily on manual supervision and periodic communication.

This project proposes an **AI-IoT based safety intelligence platform** that continuously monitors simulated wearable and environmental sensor data and provides supervisors with actionable safety information.

The system combines:

**Worker Wearables + Environmental Sensors + Risk Analysis + Location Tracking + Emergency Response + Exposure Management + Analytics**

into a single municipal control-room dashboard.

---

# Objectives

The main objectives of the project are:

1. Monitor sanitation worker health in real time.
2. Detect dangerous environmental conditions.
3. Calculate an individual worker safety risk score.
4. Identify potentially dangerous trends before they become critical.
5. Provide immediate emergency alerts.
6. Assist supervisors during rescue operations.
7. Monitor cumulative worker exposure.
8. Recommend worker rotation when exposure becomes excessive.
9. Provide historical safety and compliance analytics.
10. Reduce response time during worker emergencies.

---

# Key Features

## 1. Control Room Dashboard

The main control room provides supervisors with a centralized view of all workers.

### Monitoring Includes

- Worker status
- Heart rate
- SpO₂
- Body temperature
- Stress level
- H₂S concentration
- CO concentration
- Methane concentration
- Environmental temperature
- Water level
- GPS status
- Battery level
- Network connectivity
- Safety risk score

### Worker Status

| Status | Meaning |
|---|---|
| 🟢 Safe | Worker operating within safe limits |
| 🟡 Warning | Increased risk requiring attention |
| 🔴 Danger | Immediate intervention required |
| ⚫ Offline | Wearable/device unavailable |

---

# AI Safety Risk Engine

The platform includes a local safety risk engine that calculates a safety score from:

**0–100**

The score considers multiple worker and environmental parameters.

### Risk Levels

| Score | Risk Level | Recommended Action |
|---:|---|---|
| 0–30 | LOW | Safe for duty |
| 31–60 | MEDIUM | Monitor and prepare rotation |
| 61–80 | HIGH | Rotate worker to surface |
| 81–100 | CRITICAL | Evacuate and initiate rescue |

The risk engine considers:

- Heart rate
- SpO₂
- H₂S
- CO
- CH₄
- Temperature
- Water level
- Hazard exposure hours
- Fall detection
- SOS activation

---

# Predictive Safety Warning

The system checks for dangerous combinations of sensor trends.

One important combination is:

```text
H₂S increasing
        +
SpO₂ decreasing
        +
Heart rate increasing
When these trends occur together, the system generates a:

Predictive Safety Warning

This helps supervisors identify possible gas-related distress before the situation becomes critical.

Live Map

The Live Map provides a geographic view of the municipal operation.

Built using:

Leaflet.js
OpenStreetMap

The map displays:

Worker locations
Hazard zones
Emergency exits
Hospitals
Rescue teams
Manholes
Sewer/drainage locations
Active worker routes

Critical workers are highlighted so supervisors can quickly identify where assistance is required.

Emergency Response System

The system provides a dedicated emergency workflow for dangerous situations.

Emergency scenarios include:

Gas leak
Low SpO₂
Worker fall
High temperature
Sewer flooding
SOS activation
Multiple worker emergency

When a critical situation occurs, the system can:

Identify the affected worker.
Calculate the current risk level.
Display the reason for the danger.
Identify nearby workers.
Identify the nearest rescue team.
Suggest a rescue route.
Trigger an emergency alert.
Log the event.
Provide recommended action to the supervisor.
Emergency Simulation Center

The project contains a dedicated simulation interface for testing and demonstrations.

Supervisors can simulate:

Gas Leak
Low SpO₂
Fall Detection
High Temperature
Flooding
SOS
Multiple Worker Emergency
Reset Simulation

This allows the complete emergency workflow to be demonstrated without requiring physical wearable devices.

Emergency Audio Alert

The dashboard uses the browser's Web Audio API to generate an emergency siren.

This provides a fallback mechanism when:

An audio file is unavailable.
Browser autoplay restrictions prevent normal audio playback.
The application is running without external audio assets.

The alarm is triggered when a worker enters a critical safety state.

Worker Exposure Management System

The Worker Exposure Management System (WEMS) tracks cumulative exposure.

The system monitors:

Hazardous zone hours
Gas exposure events
Oxygen drop events
High temperature exposure
Critical alerts

An exposure risk score is calculated for each worker.

Exposure Recommendations

Depending on accumulated exposure, the system can recommend:

SAFE FOR DUTY
LIMITED DUTY
ROTATE WORKER
TEMPORARILY REMOVE

This helps prevent workers from repeatedly being assigned to high-risk environments.

Intelligent Worker Rotation

When a worker reaches a high exposure level or enters a warning/danger state, the system searches for available safe workers.

Example:

Worker:
Vijay Sharma (W004)


Status:
High Risk


Recommendation:
Rotate Worker


Suggested Replacement:
Rajesh Kumar (W001)

If no safe replacement is available, the system recommends evacuation instead of rotation.

SaniSafe Safety Assistant

The dashboard includes a lightweight local safety assistant.

The assistant can answer operational questions such as:

Who is at highest risk?


Which zone is dangerous?


Who should be rotated?


Why is W004 critical?


How many emergencies occurred today?

The assistant evaluates the current worker state and returns a deterministic safety response.

The demonstration does not require an external AI API.

Municipal Analytics

The Analytics dashboard provides operational safety insights.

Safety Compliance

Tracks safety compliance over time.

Incidents by Zone

Identifies locations with higher incident frequency.

Worker Risk Distribution

Shows the number of workers in:

Safe
Warning
High
Critical
Rescue Response Time

Displays average emergency response performance.

Municipal Metrics

Examples include:

Total operations
Total incidents
Safety compliance rate
Average rescue response time
High-risk zones
Reports

The platform provides municipal safety reporting.

Daily Report

Includes:

Total workers
Active incidents
Alerts
Rescue events
Total work hours
Weekly Health Report

Includes:

Worker exposure
Exposure risk level
High-risk workers
Recommended rest
Monthly Municipal Report

Includes:

Hazardous operations
Incident count
Compliance rate
Average rescue response time
High-risk locations
Event History

The Event History section maintains a record of operational safety events.

Events can include:

Warnings
Critical alerts
SOS events
Gas leaks
Falls
Emergency responses
Resolved incidents
System events

Supervisors can filter events based on severity and event type.

System Architecture
                  ┌─────────────────────────┐
                  │     Wearable Devices    │
                  │                         │
                  │ HR | SpO₂ | Temperature │
                  │ Stress | GPS | Battery  │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ Environmental Sensors   │
                  │                         │
                  │ H₂S | CO | CH₄ | O₂     │
                  │ Temperature | Water     │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │      Flask Backend       │
                  │                         │
                  │ Worker Simulator        │
                  │ Risk Engine             │
                  │ Exposure Engine         │
                  │ Emergency Engine        │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │   Safety Intelligence   │
                  │                         │
                  │ Risk Score 0–100        │
                  │ Predictive Warning      │
                  │ Worker Rotation         │
                  │ Emergency Response      │
                  └────────────┬────────────┘
                               │
                               ▼
        ┌───────────────────────────────────────────┐
        │          Municipal Control Room           │
        │                                           │
        │ Dashboard | Map | Health | Analytics      │
        │ Emergency | Reports | Event History       │
        └───────────────────────────────────────────┘
Technology Stack
Backend
Python
Flask
REST APIs
Frontend
HTML5
CSS3
JavaScript
Jinja2 Templates
Mapping
Leaflet.js
OpenStreetMap
Charts
Chart.js
Browser APIs
Web Audio API
Current Data Layer
Stateful in-memory simulation
Project Structure
AI-IOT-SANITATION-WORKER-SAFETY-DASHBOARD/
│
├── app.py
├── requirements.txt
├── README.md
│
├── templates/
│   ├── layout.html
│   ├── index.html
│   ├── live_map.html
│   ├── worker_health.html
│   ├── health_protection.html
│   ├── emergency_simulation.html
│   ├── analytics.html
│   ├── reports.html
│   └── event_history.html
│
└── static/
    ├── style.css
    ├── dashboard.js
    ├── health.js
    └── reports.js
Installation
1. Clone the Repository
git clone https://github.com/Sudeepthi-235/AI-IOT-SANITATION-WORKER-SAFETY-DASHBOARD.git
2. Open the Project
cd AI-IOT-SANITATION-WORKER-SAFETY-DASHBOARD
3. Create a Virtual Environment
Windows
python -m venv venv
venv\Scripts\activate
Linux / macOS
python3 -m venv venv
source venv/bin/activate
4. Install Dependencies
pip install -r requirements.txt
5. Start the Application
python app.py
6. Open the Dashboard
http://127.0.0.1:5001
Emergency Scenario Testing

After starting the application, open:

/emergency-simulation

Select an emergency scenario such as:

Gas Leak
Low SpO₂
Fall
High Temperature
Flooding
SOS
Multiple Worker Emergency

Return to the Control Room to observe the change in worker status and risk level.

Use:

Reset Simulation

to restore the workers to their initial state.
