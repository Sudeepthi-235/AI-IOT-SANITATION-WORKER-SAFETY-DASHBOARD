// SaniSafe Safety Reports JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadDailyReport();
});

// Switch Report Types view
function showReport(type) {
    document.querySelectorAll('.report-container-card').forEach(card => {
        card.style.display = 'none';
    });
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${type}-report`).style.display = 'block';
    
    // Add active layout class
    if (type === 'daily') {
        document.getElementById('btn-report-daily').classList.add('active');
        loadDailyReport();
    } else if (type === 'weekly') {
        document.getElementById('btn-report-weekly').classList.add('active');
        loadWeeklyReport();
    } else if (type === 'monthly') {
        document.getElementById('btn-report-monthly').classList.add('active');
        loadMonthlyReport();
    }
}

// Fetch Daily Safety Report
async function loadDailyReport() {
    try {
        const res = await fetch('/api/reports/daily');
        const data = await res.json();
        
        document.getElementById('daily-report-date').textContent = `Date: ${data.date}`;
        document.getElementById('daily-workers').textContent = data.total_workers;
        document.getElementById('daily-incidents').textContent = data.incidents;
        document.getElementById('daily-alerts').textContent = data.alerts;
        document.getElementById('daily-rescues').textContent = data.rescue_events;
        document.getElementById('daily-hours').textContent = data.total_work_hours + ' hrs';
    } catch (e) {
        console.error("Daily report fetch failed:", e);
    }
}

// Fetch Weekly Exposure Report
async function loadWeeklyReport() {
    try {
        const res = await fetch('/api/reports/weekly');
        const data = await res.json();
        
        document.getElementById('weekly-report-date').textContent = `Week audit range: ${data.week}`;
        
        const content = document.getElementById('weekly-content');
        if (!content) return;
        
        let restSection = '';
        if (data.recommended_rest.length > 0) {
            restSection = `
                <div class="high-risk-locations-box" style="margin-bottom:2rem;">
                    <h4 style="color:var(--color-danger); font-size:1.1rem; font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Workers Requiring Mandatory Rest Rotations</h4>
                    <ul style="list-style: square; padding-left:1.5rem; margin-top:0.5rem; line-height:1.6;">
                        ${data.recommended_rest.map(name => `<li style="color:var(--text-primary); font-weight:600;">${name}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            restSection = `
                <div class="high-risk-locations-box" style="margin-bottom:2rem; border-color:var(--color-safe-bg); background:rgba(16, 185, 129, 0.05); color:var(--color-safe);">
                    <h4 style="color:var(--color-safe);"><i class="fa-solid fa-circle-check"></i> Weekly Compliance Check</h4>
                    <p style="color:var(--text-secondary); margin-top:0.25rem;">All active sanitation workers' exposure indices are within safe operating limits. No rest rotations required.</p>
                </div>
            `;
        }
        
        content.innerHTML = `
            ${restSection}
            
            <div class="table-container">
                <table class="exposure-table">
                    <thead>
                        <tr>
                            <th>Worker Name</th>
                            <th>Exposure Score Index</th>
                            <th>Safety Classification</th>
                            <th>Action Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.workers.map(w => `
                            <tr>
                                <td><strong>${w.name}</strong> (ID: ${w.worker_id})</td>
                                <td><strong>Index Score: ${w.risk_score}</strong></td>
                                <td><span class="risk-badge ${w.risk_level.toLowerCase()}">${w.risk_level.toUpperCase()}</span></td>
                                <td>${w.recommendation}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        console.error("Weekly report load failed:", e);
    }
}

// Fetch Monthly Reports
async function loadMonthlyReport() {
    try {
        const res = await fetch('/api/reports/monthly');
        const data = await res.json();
        
        document.getElementById('monthly-report-date').textContent = `Month audit range: ${data.month}`;
        document.getElementById('monthly-ops').textContent = data.hazardous_operations;
        document.getElementById('monthly-incidents').textContent = data.incident_count;
        document.getElementById('monthly-compliance').textContent = data.compliance_rate + '%';
        document.getElementById('monthly-rescue').textContent = data.avg_rescue_time;
        
        const locsList = document.getElementById('monthly-risk-locations-list');
        if (locsList) {
            locsList.innerHTML = '';
            data.high_risk_locations.forEach(loc => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fa-solid fa-circle-nodes" style="color:var(--color-danger); margin-right:8px;"></i> ${loc}`;
                locsList.appendChild(li);
            });
        }
    } catch (e) {
        console.error("Monthly report load failed:", e);
    }
}

// Download PDF trigger
function downloadReport(type) {
    alert(`📥 PDF Audit Report Generation:\n\nPreparing SaniSafe AI formatted ${type} safety PDF.\nDownloading file to local download directories.`);
}
