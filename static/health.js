// SaniSafe WEMS & Duty Rotation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadWemsData();
    setInterval(loadWemsData, 6000); // update every 6 seconds
});

async function loadWemsData() {
    try {
        const res = await fetch('/api/exposure');
        const data = await res.json();
        
        updateWemsSummary(data);
        renderWemsTable(data);
        renderRotationTable(data);
    } catch (e) {
        console.error("WEMS exposure load failed:", e);
    }
}

// Update WEMS Exposure metrics cards
function updateWemsSummary(data) {
    let low = 0, medium = 0, high = 0;
    
    data.forEach(w => {
        if (w.risk_level === 'Low') low++;
        else if (w.risk_level === 'Medium') medium++;
        else if (w.risk_level === 'High' || w.risk_level === 'Critical') high++;
    });
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    
    setVal('low-risk-count', low);
    setVal('medium-risk-count', medium);
    setVal('high-risk-count', high);
}

// Populate Weekly Exposure Table
function renderWemsTable(data) {
    const tbody = document.getElementById('exposure-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    data.forEach(w => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${w.worker_id}</strong></td>
            <td><strong>${w.name}</strong></td>
            <td>${w.exposure_data.hazard_hours.toFixed(1)} hrs</td>
            <td>${w.exposure_data.gas_exposures} times</td>
            <td>${w.exposure_data.oxygen_drops} instances</td>
            <td>${w.exposure_data.temp_exposures} instances</td>
            <td>${w.exposure_data.danger_alerts} alerts</td>
            <td><strong>${w.risk_score}</strong></td>
            <td><span class="risk-badge ${w.risk_level.toLowerCase()}">${w.risk_level.toUpperCase()}</span></td>
            <td>${w.recommendation}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Coordinate Intelligent Worker Rotation suggestions
function renderRotationTable(data) {
    const tbody = document.getElementById('rotation-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Sort candidates for rotation (lower exposure index is better)
    const sortedCandidates = [...data].sort((a, b) => a.risk_score - b.risk_score);
    
    data.forEach(w => {
        const tr = document.createElement('tr');
        
        let needsRotation = w.risk_level === 'High' || w.risk_level === 'Critical';
        let dutyHtml = '';
        let replHtml = '';
        let actionBtn = '';
        
        if (needsRotation) {
            // Find best replacement: lowest risk, available (not itself)
            let replacement = sortedCandidates.find(cand => 
                cand.worker_id !== w.worker_id && 
                cand.risk_level === 'Low'
            );
            
            dutyHtml = `<span class="risk-badge-mini critical" style="background:var(--color-danger-bg); color:var(--color-danger);"><i class="fa-solid fa-person-circle-exclamation"></i> MANDATORY REST</span>`;
            if (replacement) {
                replHtml = `<strong>${replacement.name} (${replacement.worker_id})</strong><br><span style="font-size:0.75rem; color:var(--color-safe);">Backup available (Risk Score: ${replacement.risk_score})</span>`;
                actionBtn = `<button class="btn-table-action" onclick="executeRotation('${w.worker_id}', '${replacement.worker_id}')"><i class="fa-solid fa-rotate"></i> Swap Duty</button>`;
            } else {
                replHtml = `<span class="text-danger fw-bold"><i class="fa-solid fa-triangle-exclamation"></i> No Safe Backup!</span>`;
                actionBtn = `<button class="btn-table-action" style="border-color:#ef4444; color:#ef4444;" onclick="executeRotation('${w.worker_id}', null)"><i class="fa-solid fa-circle-minus"></i> Force Evacuate</button>`;
            }
        } else if (w.risk_level === 'Medium') {
            dutyHtml = `<span class="risk-badge-mini warning" style="background:var(--color-warning-bg); color:var(--color-warning);">LIMITED DUTY</span>`;
            replHtml = `<span style="color:var(--text-secondary);">Rotations prepared</span>`;
            actionBtn = `<span style="color:var(--text-secondary); font-size:0.8rem;">Monitor closely</span>`;
        } else {
            dutyHtml = `<span class="risk-badge-mini safe" style="background:var(--color-safe-bg); color:var(--color-safe);"><i class="fa-solid fa-circle-check"></i> ACTIVE DUTY</span>`;
            replHtml = `<span style="color:var(--text-secondary);">Optimal safety level</span>`;
            actionBtn = `<span style="color:var(--color-safe); font-size:0.8rem;"><i class="fa-solid fa-shield-halved"></i> Active</span>`;
        }
        
        tr.innerHTML = `
            <td>
                <strong>${w.name}</strong><br>
                <span style="font-size:0.75rem; color:var(--text-secondary);">${w.worker_id}</span>
            </td>
            <td><strong>Index: ${w.risk_score}</strong> (${w.risk_level})</td>
            <td>${dutyHtml}</td>
            <td>${replHtml}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function executeRotation(originalId, replacementId) {
    if (replacementId) {
        alert(`🔄 AI Rotation initialized:\n\nActive worker (ID ${originalId}) has been rotated out.\nReplacement worker (ID ${replacementId}) dispatched to site.`);
    } else {
        alert(`🚨 EMERGENCY ORDER:\n\nActive worker (ID ${originalId}) ordered to return to surface immediately! Duty suspended due to excessive index risk.`);
    }
}
