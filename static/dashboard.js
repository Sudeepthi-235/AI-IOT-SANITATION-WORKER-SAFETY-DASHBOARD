// SaniSafe AI Dashboard JavaScript
let map;
let markers = {};
let staticMarkers = [];
let routePolyline = null;
let alertSound;
let currentDangerWorkers = new Set();

// Web Audio API Siren controls
let audioCtx = null;
let sirenInterval = null;
let sirenOscillator = null;
let sirenGainNode = null;

// Map Coordinates
const HOSPITAL_LOCS = [
    { name: "City Trauma Center", coords: [28.6200, 77.2000] },
    { name: "Emergency Care Hospital", coords: [28.6050, 77.2200] }
];

const RESCUE_TEAMS = [
    { id: "RT-1", name: "Rescue Station 1 (Central)", coords: [28.6110, 77.2050] },
    { id: "RT-2", name: "Rescue Station 2 (North)", coords: [28.6190, 77.2150] }
];

const SAFE_EXITS = [
    { name: "Sewer Exit A", coords: [28.6170, 77.2080] },
    { name: "Sewer Exit B", coords: [28.6130, 77.2130] }
];

const HAZARD_ZONES = [
    { name: "Hazard Zone 1 (High toxic gas risk)", coords: [28.6150, 77.2070], radius: 200, color: '#ef4444' },
    { name: "Hazard Zone 2 (Flooding warning)", coords: [28.6180, 77.2030], radius: 150, color: '#f59e0b' }
];

// Initialize Control Room / Map elements
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadWorkers();
    
    // Poll every 3 seconds for workers biometrics
    setInterval(loadWorkers, 3000);
    
    // Poll events for log list
    loadEvents();
    setInterval(loadEvents, 4000);
    
    // Load audio tag if exists
    alertSound = document.getElementById('alert-sound');
    
    // Close modal triggers
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('worker-modal').style.display = 'none';
        };
    }
    
    window.onclick = function(event) {
        const modal = document.getElementById('worker-modal');
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

// Initialise Leaflet
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    
    // Center at MG Road, Delhi
    map = L.map('map').setView([28.6139, 77.2090], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Draw static layers
    drawStaticMapLayers();
}

function drawStaticMapLayers() {
    // 1. Safe Exits
    SAFE_EXITS.forEach(ex => {
        L.marker(ex.coords, {
            icon: L.divIcon({
                className: 'static-exit-marker',
                html: `<div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; border: 1px solid white; font-size: 10px; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-door-open"></i> ${ex.name}</div>`,
                iconSize: [80, 20]
            })
        }).addTo(map).bindPopup(`<strong>Safe Exit:</strong> ${ex.name}`);
    });

    // 2. Hospitals
    HOSPITAL_LOCS.forEach(hosp => {
        L.marker(hosp.coords, {
            icon: L.divIcon({
                className: 'static-hosp-marker',
                html: `<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; border: 1px solid white; font-size: 10px; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-square-h"></i> ${hosp.name}</div>`,
                iconSize: [80, 20]
            })
        }).addTo(map).bindPopup(`<strong>Medical Care:</strong> ${hosp.name}`);
    });

    // 3. Rescue Stations
    RESCUE_TEAMS.forEach(team => {
        L.marker(team.coords, {
            icon: L.divIcon({
                className: 'static-rescue-marker',
                html: `<div style="background: #a855f7; color: white; padding: 4px 8px; border-radius: 4px; border: 1px solid white; font-size: 10px; font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-truck-medical"></i> ${team.name}</div>`,
                iconSize: [80, 20]
            })
        }).addTo(map).bindPopup(`<strong>Rescue Unit:</strong> ${team.name}`);
    });

    // 4. Hazard Zones
    HAZARD_ZONES.forEach(zone => {
        L.circle(zone.coords, {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            dashArray: '5, 5'
        }).addTo(map).bindPopup(`<strong>Hazard Zone warning:</strong> ${zone.name}`);
    });
}

// Fetch worker status updates
async function loadWorkers() {
    try {
        const res = await fetch('/api/workers/status');
        const workers = await res.json();
        
        updateKPICards(workers);
        displayWorkersGrid(workers);
        updateMapMarkers(workers);
        evaluateEmergencyStates(workers);
    } catch (e) {
        console.error("Failed to fetch workers:", e);
    }
}

// Update Top KPI counters
function updateKPICards(workers) {
    let total = workers.length;
    let safe = 0, warning = 0, danger = 0, offline = 0;
    
    workers.forEach(w => {
        if (w.status === 'safe') safe++;
        else if (w.status === 'warning') warning++;
        else if (w.status === 'danger') danger++;
        else if (w.status === 'offline') offline++;
    });
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    
    setVal('kpi-total-val', total);
    setVal('kpi-safe-val', safe);
    setVal('kpi-warning-val', warning);
    setVal('kpi-danger-val', danger);
    setVal('kpi-offline-val', offline);
}

// Render worker cards — clean, spacious, minimal information
function displayWorkersGrid(workers) {
    const grid = document.getElementById('workers-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const order = { 'danger': 0, 'warning': 1, 'safe': 2, 'offline': 3 };
    const sorted = [...workers].sort((a, b) => order[a.status] - order[b.status]);

    sorted.forEach(w => {
        const card = document.createElement('div');
        card.className = `worker-card ${w.status}`;
        card.onclick = () => showWorkerDetails(w.worker_id);

        const statusLabels = { safe: 'Safe', warning: 'Warning', danger: 'Critical', offline: 'Offline' };
        const statusIcons  = { safe: 'fa-circle-check', warning: 'fa-triangle-exclamation', danger: 'fa-circle-radiation', offline: 'fa-circle-xmark' };
        const statusPill = `<span class="status-pill ${w.status}"><i class="fa-solid ${statusIcons[w.status]}"></i> ${statusLabels[w.status]}</span>`;

        const rsClass = w.risk_level === 'CRITICAL' || w.risk_level === 'Critical' ? 'rs-crit'
                      : w.risk_level === 'HIGH' || w.risk_level === 'High'         ? 'rs-warn'
                      : w.risk_level === 'MEDIUM' || w.risk_level === 'Medium'     ? 'rs-warn'
                      : 'rs-safe';

        let metricsHtml = '';
        if (w.status !== 'offline') {
            const hrClass   = (w.vitals.heart_rate > 100 || w.vitals.heart_rate < 50) ? 'crit' : '';
            const spo2Class = w.vitals.spo2 < 95 ? 'crit' : '';
            const gasClass  = w.environment.h2s > 5 ? 'crit' : (w.environment.h2s > 2 ? 'warn' : '');

            metricsHtml = `
                <div class="worker-metrics">
                    <div class="metric-row">
                        <span class="m-label">Heart rate</span>
                        <span class="m-value ${hrClass}">${w.vitals.heart_rate} bpm</span>
                    </div>
                    <div class="metric-row">
                        <span class="m-label">SpO₂</span>
                        <span class="m-value ${spo2Class}">${w.vitals.spo2}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="m-label">H₂S</span>
                        <span class="m-value ${gasClass}">${w.environment.h2s.toFixed(1)} ppm</span>
                    </div>
                </div>`;
        } else {
            metricsHtml = `<div class="worker-metrics"><div style="color:var(--text-muted);font-size:.78rem;">Device offline — no telemetry</div></div>`;
        }

        card.innerHTML = `
            <div class="worker-card-top">
                <div class="worker-name-block">
                    <div class="w-name">${w.name}</div>
                    <div class="w-id">${w.worker_id} &mdash; ${w.zone}</div>
                </div>
                ${statusPill}
            </div>
            <div class="risk-score-row">
                Risk score: <strong class="${rsClass}">${w.risk_score} <span style="font-weight:400;color:var(--text-muted);">(${w.risk_level})</span></strong>
            </div>
            ${metricsHtml}
            <button class="btn-view-details" onclick="event.stopPropagation();showWorkerDetails('${w.worker_id}')">
                View details
            </button>`;

        grid.appendChild(card);
    });
}

// Populate the Active Alerts card panel (replaces constant flashing banner)
function updateActiveAlerts(dangerWorkers) {
    const list   = document.getElementById('active-alerts-list');
    const badge  = document.getElementById('alert-count-badge');
    const badgeN = document.getElementById('alert-count-num');
    if (!list) return;

    if (dangerWorkers.length === 0) {
        if (badge) badge.style.display = 'none';
        list.innerHTML = `
            <div class="no-alerts">
                <i class="fa-solid fa-circle-check"></i>
                No active emergencies — all workers within safe parameters
            </div>`;
        return;
    }

    if (badge)  badge.style.display = 'inline-flex';
    if (badgeN) badgeN.textContent   = dangerWorkers.length;

    list.innerHTML = '';
    dangerWorkers.forEach(dw => {
        const card = document.createElement('div');
        card.className = 'emergency-alert-card';
        const topReason = dw.risk_reasons && dw.risk_reasons.length > 0 ? dw.risk_reasons[0] : 'Elevated risk detected';
        card.innerHTML = `
            <div class="alert-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="alert-body">
                <div class="worker-name">${dw.name} (${dw.worker_id})</div>
                <div class="incident-label">${topReason}</div>
                <div class="alert-meta">
                    <span><i class="fa-solid fa-location-dot"></i> ${dw.location}</span>
                    <span>Risk score: <strong>${dw.risk_score}</strong></span>
                    <span>SpO₂: ${dw.vitals.spo2}% &nbsp;|&nbsp; HR: ${dw.vitals.heart_rate} bpm</span>
                </div>
            </div>
            <div class="alert-actions">
                <button class="btn-alert-primary" onclick="initiateRescue()">
                    <i class="fa-solid fa-truck-medical"></i> Start rescue
                </button>
                <button class="btn-alert-secondary" onclick="showWorkerDetails('${dw.worker_id}')">
                    <i class="fa-solid fa-circle-info"></i> View worker
                </button>
            </div>`;
        list.appendChild(card);
    });
}

// Update Map markers dynamically
function updateMapMarkers(workers) {
    if (!map) return;
    
    workers.forEach(w => {
        const coords = [w.coordinates.lat, w.coordinates.lng];
        
        if (markers[w.worker_id]) {
            // Update marker
            markers[w.worker_id].setLatLng(coords);
            const mWrapper = document.getElementById(`marker-wrapper-${w.worker_id}`);
            if (mWrapper) {
                mWrapper.className = `custom-marker-wrapper ${w.status}`;
            }
        } else {
            // Create custom circular marker
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div id="marker-wrapper-${w.worker_id}" class="custom-marker-wrapper ${w.status}"><i class="fa-solid fa-user-ninja" style="color:white; font-size:10px;"></i></div>`,
                iconSize: [24, 24]
            });
            
            const marker = L.marker(coords, { icon: markerIcon }).addTo(map);
            marker.bindPopup(`
                <div style="color:black; font-family:'Outfit';">
                    <strong style="font-size:14px;">${w.name} (${w.worker_id})</strong><br>
                    <span>Status: ${w.status.toUpperCase()}</span><br>
                    <span>Vitals: HR ${w.vitals.heart_rate} | SpO₂ ${w.vitals.spo2}%</span><br>
                    <span>H₂S: ${w.environment.h2s.toFixed(1)} ppm</span>
                </div>
            `);
            
            markers[w.worker_id] = marker;
        }
    });
}


// Evaluate emergencies and coordinate routes
function evaluateEmergencyStates(workers) {
    const dangerWorkers = workers.filter(w => w.status === 'danger');

    // Update the active alerts panel on the control room
    updateActiveAlerts(dangerWorkers);

    // Populate active incidents list on live_map view
    const incidentsPanel = document.getElementById('active-map-incidents');
    if (incidentsPanel) {
        if (dangerWorkers.length === 0) {
            incidentsPanel.innerHTML = '<p class="no-incidents"><i class="fa-solid fa-circle-check"></i> No active emergencies</p>';
        } else {
            incidentsPanel.innerHTML = '';
            dangerWorkers.forEach(dw => {
                const div = document.createElement('div');
                div.style.cssText = 'background:var(--red-light);border-left:3px solid var(--red);padding:10px 12px;border-radius:6px;margin-bottom:8px;font-size:.8rem;';
                div.innerHTML = `
                    <strong>${dw.name} (${dw.worker_id})</strong><br>
                    <span style="color:var(--red)">${dw.risk_reasons[0] || 'Elevated risk'}</span><br>
                    <span style="color:var(--text-muted)">Risk score: ${dw.risk_score}</span>
                `;
                incidentsPanel.appendChild(div);
            });
        }
    }

    if (dangerWorkers.length > 0) {
        const emergencyWorker = dangerWorkers[0];
        if (!currentDangerWorkers.has(emergencyWorker.worker_id)) {
            currentDangerWorkers.add(emergencyWorker.worker_id);
            triggerRescueWorkflow(emergencyWorker, workers);
        }
    } else {
        if (currentDangerWorkers.size > 0) {
            currentDangerWorkers.clear();
            closeEmergency();
        }
    }
}


// Coordinate Rescue Workflow
function triggerRescueWorkflow(w, allWorkers) {
    // 1. Show banner
    const banner = document.getElementById('emergency-banner');
    const details = document.getElementById('emergency-banner-details');
    
    // 2. Play Alarm Siren
    playAlarmSiren();
    
    // 3. Find Nearest Coworker (safe or warning)
    let minCwDist = Infinity;
    let nearestCw = null;
    allWorkers.forEach(cand => {
        if (cand.worker_id !== w.worker_id && cand.status !== 'offline' && cand.status !== 'danger') {
            let dist = getDistance(w.coordinates, cand.coordinates);
            if (dist < minCwDist) {
                minCwDist = dist;
                nearestCw = cand;
            }
        }
    });
    
    // 4. Find Nearest Rescue Team
    let minRtDist = Infinity;
    let nearestRt = null;
    RESCUE_TEAMS.forEach(team => {
        let dist = getDistance(w.coordinates, { lat: team.coords[0], lng: team.coords[1] });
        if (dist < minRtDist) {
            minRtDist = dist;
            nearestRt = team;
        }
    });
    
    const cwText = nearestCw ? `${nearestCw.name} (${Math.round(minCwDist * 1000)}m away)` : "None nearby";
    const rtText = nearestRt ? `${nearestRt.name} (${Math.round(minRtDist * 1000)}m away)` : "Dispatched Dispatchers";
    
    if (details) {
        details.innerHTML = `
            <strong>Worker:</strong> ${w.name} (${w.worker_id}) | <strong>Threat:</strong> ${w.risk_reasons.join(', ')}<br>
            <strong>Nearest Coworker:</strong> ${cwText} | <strong>Rescue Team:</strong> ${rtText} | <strong>Action:</strong> Evacuate immediately!
        `;
    }
    
    if (banner) banner.style.display = 'block';
    
    // 5. Draw Suggested Rescue Route on map
    if (map) {
        map.setView([w.coordinates.lat, w.coordinates.lng], 15);
        
        // Remove old polyline if any
        if (routePolyline) {
            map.removeLayer(routePolyline);
        }
        
        if (nearestRt) {
            // Draw a zig-zag street-like simulation line
            const routePoints = [
                nearestRt.coords,
                [nearestRt.coords[0], w.coordinates.lng],
                [w.coordinates.lat, w.coordinates.lng]
            ];
            
            routePolyline = L.polyline(routePoints, {
                color: '#a855f7',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 10',
                lineJoin: 'round'
            }).addTo(map);
            
            // Pop open emergency popup
            markers[w.worker_id].openPopup();
        }
    }
    
    // Automatically log this incident to system
    fetch('/api/event/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'rescue',
            worker_id: w.worker_id,
            location: w.location,
            message: `AUTOMATIC INCIDENT: Emergency rescue route computed from ${nearestRt.name} to ${w.name}. Dispatched teams.`,
            severity: 'Critical',
            vitals: w.vitals,
            environment: w.environment,
            resolution_status: 'Active'
        })
    }).then(() => loadEvents());
}

// Distance Calculation Helper
function getDistance(c1, c2) {
    const latDiff = c1.lat - c2.lat;
    const lngDiff = c1.lng - c2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Approx km
}

// Synthetic Web Audio Siren player
function playAlarmSiren() {
    // 1. Play alert.mp3 file
    if (alertSound) {
        alertSound.play().catch(e => {
            console.log("Audio play blocked by autoplay rules. Initiating synthetic siren fallback...");
            startSyntheticSiren();
        });
    } else {
        startSyntheticSiren();
    }
}

function startSyntheticSiren() {
    if (sirenInterval) return;
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    sirenOscillator = audioCtx.createOscillator();
    sirenGainNode = audioCtx.createGain();
    
    sirenOscillator.type = 'sine';
    sirenOscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
    
    sirenGainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    
    sirenOscillator.connect(sirenGainNode);
    sirenGainNode.connect(audioCtx.destination);
    sirenOscillator.start();
    
    let state = true;
    sirenInterval = setInterval(() => {
        if (sirenOscillator && audioCtx) {
            // Alternate siren pitch
            sirenOscillator.frequency.setValueAtTime(state ? 783.99 : 587.33, audioCtx.currentTime); // G5 / D5 alternate
            state = !state;
        }
    }, 450);
}

function stopSyntheticSiren() {
    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }
    if (sirenOscillator) {
        try {
            sirenOscillator.stop();
            sirenOscillator.disconnect();
        } catch (e) {}
        sirenOscillator = null;
    }
    if (sirenGainNode) {
        try {
            sirenGainNode.disconnect();
        } catch (e) {}
        sirenGainNode = null;
    }
}

// Close emergency overlays
function closeEmergency() {
    const banner = document.getElementById('emergency-banner');
    if (banner) banner.style.display = 'none';
    
    // Stop Siren
    if (alertSound) {
        alertSound.pause();
        alertSound.currentTime = 0;
    }
    stopSyntheticSiren();
    
    if (routePolyline && map) {
        map.removeLayer(routePolyline);
        routePolyline = null;
    }
}

// Dispatch buttons actions
function initiateRescue() {
    alert("🚑 Dispatching Tactical Rescue Unit to location. GPS route uploaded. Dispatch sirens activated.");
    closeEmergency();
}

function sendVoiceAlert() {
    alert("📢 Voice emergency broadcast sent: 'Attention workers: Danger detected nearby. Report to exit point immediately.'");
}

// Local Safety AI Assistant logic
async function askAssistant() {
    const queryEl = document.getElementById('assistant-query');
    const chatBox = document.getElementById('chat-messages');
    if (!queryEl || !chatBox) return;
    
    const question = queryEl.value.trim();
    if (!question) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);
    
    queryEl.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    
    try {
        const res = await fetch('/api/assistant/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question })
        });
        const data = await res.json();
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message ai';
        aiMsg.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <strong>SaniSafe AI:</strong> ${data.answer}`;
        chatBox.appendChild(aiMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error("AI Assistant request failed:", e);
    }
}

// Display worker modal health details profiles
async function showWorkerDetails(workerId) {
    try {
        const res = await fetch(`/api/worker/${workerId}`);
        const w = await res.json();
        
        const detailsEl = document.getElementById('worker-details');
        const modal = document.getElementById('worker-modal');
        if (!detailsEl || !modal) return;
        
        const isOffline = w.status === 'offline';
        let vitalsHtml = '';
        let envHtml = '';
        
        if (!isOffline) {
            vitalsHtml = `
                <div class="modal-data-row"><span class="lbl">Heart Rate</span><span class="val ${w.vitals.heart_rate > 100 ? 'danger' : ''}">${w.vitals.heart_rate} bpm</span></div>
                <div class="modal-data-row"><span class="lbl">Oxygen Level SpO₂</span><span class="val ${w.vitals.spo2 < 95 ? 'danger' : ''}">${w.vitals.spo2}%</span></div>
                <div class="modal-data-row"><span class="lbl">Core Body Temp</span><span class="val">${w.vitals.body_temp.toFixed(1)}°C</span></div>
                <div class="modal-data-row"><span class="lbl">Workplace Stress</span><span class="val">${w.vitals.stress}%</span></div>
            `;
            envHtml = `
                <div class="modal-data-row"><span class="lbl">Hydrogen Sulfide H₂S</span><span class="val ${w.environment.h2s > 5 ? 'danger' : ''}">${w.environment.h2s.toFixed(1)} ppm</span></div>
                <div class="modal-data-row"><span class="lbl">Carbon Monoxide CO</span><span class="val">${w.environment.co} ppm</span></div>
                <div class="modal-data-row"><span class="lbl">Combustible CH₄</span><span class="val">${w.environment.ch4.toFixed(2)}%</span></div>
                <div class="modal-data-row"><span class="lbl">Ambient Temperature</span><span class="val">${w.environment.temp.toFixed(1)}°C</span></div>
                <div class="modal-data-row"><span class="lbl">Water Level</span><span class="val">${w.environment.water_level}</span></div>
            `;
        } else {
            vitalsHtml = `<p style="font-size:0.85rem; color:var(--text-muted);">Biometric sensors disconnected.</p>`;
            envHtml = `<p style="font-size:0.85rem; color:var(--text-muted);">Environmental array offline.</p>`;
        }
        
        detailsEl.innerHTML = `
            <div class="modal-worker-header">
                <h2>🩺 Worker Health Profile: ${w.name}</h2>
                <div class="sub">${w.worker_id} | Location: ${w.location} | Active Zone: ${w.zone}</div>
            </div>
            
            <div class="modal-grid-vitals">
                <div class="modal-section">
                    <h3><i class="fa-solid fa-heart-pulse"></i> Telemetry Vitals</h3>
                    ${vitalsHtml}
                </div>
                <div class="modal-section">
                    <h3><i class="fa-solid fa-wind"></i> Sewer Atmosphere</h3>
                    ${envHtml}
                </div>
            </div>
            
            <div class="modal-grid-vitals">
                <div class="modal-section">
                    <h3><i class="fa-solid fa-hard-hat"></i> Device Array Diagnostics</h3>
                    <div class="modal-data-row"><span class="lbl">Battery Status</span><span class="val">${Math.round(w.device.battery)}%</span></div>
                    <div class="modal-data-row"><span class="lbl">GPS Signal</span><span class="val">${w.device.gps_status}</span></div>
                    <div class="modal-data-row"><span class="lbl">Wearable Status</span><span class="val">${w.device.sensor_status}</span></div>
                    <div class="modal-data-row"><span class="lbl">Local Sync Status</span><span class="val">${w.device.last_sync}</span></div>
                </div>
                
                <div class="modal-section" style="display:flex; flex-direction:column; gap:0.5rem;">
                    <h3><i class="fa-solid fa-shield-halved"></i> Safety Risk Engine Assessment</h3>
                    <div class="modal-risk-desc ${w.risk_level.toLowerCase()}">
                        <h4>Classification: ${w.risk_level} (Safety Index Score: ${w.risk_score})</h4>
                        <p><strong>Primary factors:</strong> ${w.risk_reasons.join(', ')}</p>
                        <p style="margin-top:0.5rem; font-weight:600; color:white;">Action Recommendation: ${w.risk_action}</p>
                    </div>
                </div>
            </div>
            
            ${w.predictive_warning ? `
                <div class="modal-risk-desc danger" style="margin-bottom:1.5rem; border-left:4px solid #ef4444;">
                    <h4><i class="fa-solid fa-circle-nodes"></i> PREDICTIVE THREAT WARNING DETECTED</h4>
                    <p style="color:white; font-weight:700;">${w.predictive_warning}</p>
                </div>
            ` : ''}
            
            <div class="modal-trend-container">
                <h3>📈 7-Day Trend Chart (Vitals Core Index)</h3>
                <div class="trend-chart-wrapper">
                    <canvas id="worker-trend-chart"></canvas>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Load Sparkline 7-day trend chart
        setTimeout(() => {
            renderWorkerTrendChart(w);
        }, 100);
        
    } catch (e) {
        console.error("Worker Details modal failed:", e);
    }
}

// Render sparkline line charts inside worker details modal using mock historical stats
function renderWorkerTrendChart(worker) {
    const ctx = document.getElementById('worker-trend-chart');
    if (!ctx) return;
    
    // Generate static historical datasets
    let pulseData = [72, 75, 78, 82, 80, 76, worker.vitals.heart_rate || 75];
    let oxygenData = [98, 98, 97, 96, 98, 98, worker.vitals.spo2 || 98];
    
    if (worker.status === 'offline') {
        pulseData = [72, 75, 78, 82, 80, 76, 0];
        oxygenData = [98, 98, 97, 96, 98, 98, 0];
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
            datasets: [
                {
                    label: 'Heart Rate (bpm)',
                    data: pulseData,
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Oxygen SpO₂ (%)',
                    data: oxygenData,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { size: 10 } }
                }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { display: false } },
                y: { ticks: { color: '#64748b' } }
            }
        }
    });
}

// Display recent logs inside Control Room Home sidebar panel
async function loadEvents() {
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        
        const logBox = document.getElementById('event-list');
        if (!logBox) return;
        logBox.innerHTML = '';
        
        // Show last 6 events
        events.reverse().slice(0, 6).forEach(e => {
            const item = document.createElement('div');
            item.className = `event-item ${e.severity.toLowerCase()}`;
            
            const timeStr = new Date(e.timestamp).toLocaleTimeString();
            item.innerHTML = `
                <div class="event-time">${timeStr} - ${e.worker_id}</div>
                <div class="event-message">${e.message}</div>
            `;
            logBox.appendChild(item);
        });
    } catch (e) {
        console.error("Event list loader failed:", e);
    }
}
