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
