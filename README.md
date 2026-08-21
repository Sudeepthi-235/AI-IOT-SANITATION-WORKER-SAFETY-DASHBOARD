# Municipal Sanitation Worker Safety Intelligence Platform

A high-fidelity, municipal control-room dashboard for real-time safety monitoring, bio-telemetry, environmental sensing, threat warning, and automated rescue routing for workers operating in sewer systems.

## Features

### 🏠 Safety Control Room View (Home Screen)
- **Real-time Worker Status Panel**: Live telemetry tracking with instant 3-second polling updates.
- **Biometrics & Wearable Telemetry**: Heart rate, SpO₂ oxygen saturation, body temperature, stress indexes, device connection, and battery level tracking.
- **Atmospheric Gas Alerts**: Real-time detection of toxic Hydrogen Sulfide ($H_2S$), Carbon Monoxide ($CO$), and combustible Methane ($CH_4$).
- **Color-coded Status System**:
  - 🟢 **Safe**: Routine monitoring.
  - 🟡 **Warning**: Duty rotation advised.
  - 🔴 **Danger/Critical**: Evacuate and initiate rescue workflow.
  - ⚫ **Offline**: Wearable device disconnected.

### 🧠 Safety Risk Engine (0-100 Score)
- Calculates a dynamic safety index score using biometric readings, gas levels, sewer temperature, and hazard duration.
- **Risk Classification Levels**:
  - **0-30**: LOW (Safe)
  - **31-60**: MEDIUM (Warning)
  - **61-80**: HIGH (Warning/Rotation Mandatory)
  - **81-100**: CRITICAL (Immediate Evacuation)
- **Predictive Threat Alarm**: Detects dangerous biometrics and atmospheric trends (rising $H_2S$ + dropping $SpO_2$ + rising HR) to sound early warning alarms before distress occurs.

### 🤖 Safety AI Assistant
- Local, deterministic dashboard query helper. Requires no external AI API or internet connection.
- Instantly answers supervisor questions such as:
  - *"Who is at highest risk?"*
  - *"Which zone is dangerous?"*
  - *"Why is W004 critical?"*
  - *"Who should be rotated?"*
  - *"How many emergencies occurred today?"*

### 🗺️ Live Tactical Location Map (Leaflet.js)
- Displays active worker coordinates, fixed manhole entries, medical facilities, safe exits, and high-risk hazard zones.
- **Rescue Workflow**: On critical emergency triggers:
  - Focuses/zooms map onto the affected worker.
  - Identifies the **nearest coworker** and distance.
  - Identifies the **nearest rescue team station**.
  - Draws a **tactical route line** on the map from the rescue station to the worker's coordinates.

### 🧪 Emergency Simulation Center (`/emergency-simulation`)
- Active control deck to trigger stateful, realistic emergency scenarios:
  - Gas Leak overrides.
  - Hypoxia (Low $SpO_2$) simulation.
  - vertical Fall Detection alarm.
  - High Sewer Temp alerts.
  - Flooding / Water rising.
  - Manual SOS panic trigger.
  - Concurrent multi-worker emergencies.
  - Reset controls to restore normal operations.

### 📊 Municipal Safety Analytics (`/analytics`)
- High-level dashboards and interactive compliance statistics.
- Responsive **Chart.js** data widgets:
  - Safety Compliance trend line graph.
  - Alarm distribution by operations zone.
  - Worker risk category distributions.
  - Live high-risk locations registry.

### 🛡️ Worker Exposure Management System (WEMS)
- Tracks weekly accumulated exposure metrics: hazard hours, gas exposures, oxygen drops, heat logs, and danger alerts.
- **Duty Rotations**: Automatically suggests backup worker rotation pairs when active workers exceed safe weekly thresholds.

## Project Structure

```
sanitation-safety-dashboard/
│
├── app.py                     # Stateful Python Flask Server & Safety Risk Engine
│
├── templates/                 # Page Layouts (Jinja2 Block Inheritance)
│   ├── layout.html            # Main base shell & sidebar navigation
│   ├── index.html             # Control Room main dashboard
│   ├── live_map.html          # Tactical map view
│   ├── worker_health.html     # Worker biometrics details table
│   ├── health_protection.html # WEMS & Duty Rotation panel
│   ├── emergency_simulation.html # Simulator center control deck
│   ├── analytics.html         # Compliance dashboards (Chart.js)
│   ├── event_history.html     # Log timeline & severity filters
│   └── reports.html           # Daily/Weekly/Monthly safety reporting
│
├── static/                    # Assets & Client-side Scripting
│   ├── style.css              # Control-room dark theme style system
│   ├── dashboard.js           # Map updates, AI assistant, and rescue routes
│   ├── health.js              # WEMS and rotation suggestions
│   └── reports.js             # Reports rendering and PDF alerts
│
└── requirements.txt           # Python dependencies
```

## Installation & Running

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   python app.py
   ```

3. **Access the portal**:
   Open browser at `http://127.0.0.1:5001/`

## API Endpoints

- `GET /api/workers/status` - Stateful updates of all workers.
- `GET /api/worker/<worker_id>` - Fetch specific worker vitals.
- `GET /api/exposure` - WEMS exposure indices and rotation matches.
- `GET /api/events` - Get system log events.
- `POST /api/event/log` - Log a manual/automatic audit event.
- `POST /api/simulation/trigger` - Force hazard overrides.
- `POST /api/assistant/ask` - Local safety helper Q&A processor.
- `GET /api/analytics/data` - Analytics dataset for Chart.js.
- `GET /api/reports/daily` | `/weekly` | `/monthly` - Retrieve audit reports.

---
**Municipal Sanitation Worker Safety Intelligence Platform**
*Protecting those who keep our cities clean and safe*
