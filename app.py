from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import random
import json

app = Flask(__name__)
app.secret_key = 'municipal-safety-dashboard-2026'

# Event log storage
event_log = []

# Safety Risk Engine calculation
def calculate_risk(worker):
    vitals = worker['vitals']
    env = worker['environment']
    exp = worker['exposure']
    
    score = 0
    reasons = []
    
    # Offline check
    if worker['status'] == 'offline':
        return {
            'score': 0,
            'level': 'OFFLINE',
            'reasons': ["Wearable device is offline. Sensor connection lost."],
            'action': "Check wearable battery and connection status.",
            'predictive_warning': None
        }

    # 1. Heart Rate (normal 60-100)
    hr = vitals['heart_rate']
    if hr > 100:
        pts = min(25, (hr - 100) * 1.2)
        score += pts
        reasons.append(f"Elevated heart rate ({hr} bpm)")
    elif hr < 50:
        pts = min(20, (50 - hr) * 1.5)
        score += pts
        reasons.append(f"Low heart rate ({hr} bpm)")
        
    # 2. SpO2 (normal 95-100)
    spo2 = vitals['spo2']
    if spo2 < 95:
        pts = min(40, (95 - spo2) * 6.0)
        score += pts
        reasons.append(f"Low oxygen saturation SpO₂ ({spo2}%)")
        
    # 3. H2S Gas (normal 0-5 ppm)
    h2s = env['h2s']
    if h2s > 5:
        pts = min(35, (h2s - 5) * 1.5)
        score += pts
        reasons.append(f"Toxic H₂S gas detected ({h2s:.1f} ppm)")
        
    # 4. CO Gas (normal 0-25 ppm)
    co = env['co']
    if co > 25:
        pts = min(25, (co - 25) * 0.8)
        score += pts
        reasons.append(f"High CO carbon monoxide ({co} ppm)")
        
    # 5. Methane CH4 (normal 0-1%)
    ch4 = env['ch4']
    if ch4 > 1.0:
        pts = min(25, (ch4 - 1.0) * 15.0)
        score += pts
        reasons.append(f"Combustible methane CH₄ detected ({ch4:.2f}%)")
        
    # 6. Temperature (normal 25-34 C)
    temp = env['temp']
    if temp > 35:
        pts = min(20, (temp - 35) * 3.5)
        score += pts
        reasons.append(f"High sewer temperature ({temp:.1f}°C)")
        
    # 7. Water level
    wl = env['water_level']
    if wl == 'Rising':
        score += 15
        reasons.append("Rising sewer water levels")
    elif wl == 'High':
        score += 35
        reasons.append("Dangerous sewer flooding (High)")
        
    # 8. Exposure Hours
    haz_hours = exp['hazard_hours']
    if haz_hours > 30:
        score += 15
        reasons.append(f"Critical exposure duration ({haz_hours:.1f} hrs)")
    elif haz_hours > 15:
        score += 8
        reasons.append(f"Elevated weekly hazard hours ({haz_hours:.1f} hrs)")
        
    # 9. Fall detection / SOS overrides
    if worker.get('fall_detected'):
        score += 50
        reasons.append("Sensor detected vertical fall / impact")
    if worker.get('sos_triggered'):
        score += 60
        reasons.append("SOS manual panic signal active")
        
    score = min(100, int(score))
    
    # Risk Levels
    if score <= 30:
        level = 'LOW'
        action = "Safe for duty. Routine monitoring."
    elif score <= 60:
        level = 'MEDIUM'
        action = "Limited duty. Alert supervisor. Prepare backup rotation."
    elif score <= 80:
        level = 'HIGH'
        action = "High Risk. Rotate worker to surface. Rest required."
    else:
        level = 'CRITICAL'
        action = "CRITICAL HAZARD. Evacuate immediately and initiate rescue workflow."
        
    # Predictive warning trend (H2S up + SpO2 down + HR up)
    predictive_warning = None
    history = worker.get('history', [])
    if len(history) >= 2:
        prev = history[-1]
        prev2 = history[-2] if len(history) >= 3 else prev
        
        # Check directions
        h2s_up = w_h2s(worker) > w_h2s(prev) and w_h2s(prev) > w_h2s(prev2)
        spo2_down = w_spo2(worker) < w_spo2(prev) and w_spo2(prev) < w_spo2(prev2)
        hr_up = w_hr(worker) > w_hr(prev) and w_hr(prev) > w_hr(prev2)
        
        if h2s_up and spo2_down and hr_up:
            predictive_warning = "PREDICTIVE ALARM: Rapid H₂S increase, oxygen decline, and heart rate acceleration indicate imminent gas distress."
            
    return {
        'score': score,
        'level': level,
        'reasons': reasons if reasons else ["Vitals and environmental parameters are normal."],
        'action': action,
        'predictive_warning': predictive_warning
    }

def w_h2s(wk): return wk['environment'].get('h2s', 0)
def w_spo2(wk): return wk['vitals'].get('spo2', 100)
def w_hr(wk): return wk['vitals'].get('heart_rate', 75)

# Stateful worker simulator
class WorkersSimulator:
    def __init__(self):
        self.workers = {
            'W001': {
                'worker_id': 'W001',
                'name': 'Rajesh Kumar',
                'location': 'Manhole MH-45, MG Road',
                'zone': 'Zone A',
                'status': 'safe',
                'vitals': {'heart_rate': 76, 'spo2': 98, 'body_temp': 36.6, 'stress': 12},
                'environment': {'h2s': 1.1, 'co': 4, 'ch4': 0.08, 'temp': 28.2, 'water_level': 'Normal'},
                'device': {'battery': 95, 'gps_status': 'Connected', 'sensor_status': 'Active', 'network': 'Strong', 'last_sync': 'Just now'},
                'coordinates': {'lat': 28.6150, 'lng': 77.2070},
                'exposure': {'hazard_hours': 14.5, 'gas_exposures': 2, 'oxygen_drops': 1, 'temp_exposures': 2, 'danger_alerts': 0},
                'override': None,
                'history': []
            },
            'W002': {
                'worker_id': 'W002',
                'name': 'Amit Singh',
                'location': 'Manhole MH-12, Park Street',
                'zone': 'Zone B',
                'status': 'safe',
                'vitals': {'heart_rate': 82, 'spo2': 97, 'body_temp': 36.8, 'stress': 16},
                'environment': {'h2s': 0.8, 'co': 3, 'ch4': 0.05, 'temp': 29.1, 'water_level': 'Normal'},
                'device': {'battery': 88, 'gps_status': 'Connected', 'sensor_status': 'Active', 'network': 'Strong', 'last_sync': '1m ago'},
                'coordinates': {'lat': 28.6120, 'lng': 77.2110},
                'exposure': {'hazard_hours': 28.0, 'gas_exposures': 6, 'oxygen_drops': 2, 'temp_exposures': 4, 'danger_alerts': 1},
                'override': None,
                'history': []
            },
            'W003': {
                'worker_id': 'W003',
                'name': 'Suresh Patel',
                'location': 'Drainage Line DL-8, Station Road',
                'zone': 'Zone A',
                'status': 'safe',
                'vitals': {'heart_rate': 72, 'spo2': 99, 'body_temp': 36.4, 'stress': 10},
                'environment': {'h2s': 1.4, 'co': 6, 'ch4': 0.11, 'temp': 27.6, 'water_level': 'Normal'},
                'device': {'battery': 48, 'gps_status': 'Connected', 'sensor_status': 'Active', 'network': 'Medium', 'last_sync': 'Just now'},
                'coordinates': {'lat': 28.6180, 'lng': 77.2030},
                'exposure': {'hazard_hours': 8.2, 'gas_exposures': 1, 'oxygen_drops': 0, 'temp_exposures': 1, 'danger_alerts': 0},
                'override': None,
                'history': []
            },
            'W004': {
                'worker_id': 'W004',
                'name': 'Vijay Sharma',
                'location': 'Manhole MH-23, Gandhi Nagar',
                'zone': 'Zone C',
                'status': 'safe',
                'vitals': {'heart_rate': 85, 'spo2': 96, 'body_temp': 37.1, 'stress': 20},
                'environment': {'h2s': 1.8, 'co': 9, 'ch4': 0.18, 'temp': 30.5, 'water_level': 'Normal'},
                'device': {'battery': 79, 'gps_status': 'Connected', 'sensor_status': 'Active', 'network': 'Strong', 'last_sync': '2m ago'},
                'coordinates': {'lat': 28.6100, 'lng': 77.2150},
                'exposure': {'hazard_hours': 35.5, 'gas_exposures': 12, 'oxygen_drops': 5, 'temp_exposures': 8, 'danger_alerts': 3},
                'override': None,
                'history': []
            },
            'W005': {
                'worker_id': 'W005',
                'name': 'Ramesh Yadav',
                'location': 'Sewer Line SL-15, Market Area',
                'zone': 'Zone B',
                'status': 'safe',
                'vitals': {'heart_rate': 74, 'spo2': 98, 'body_temp': 36.5, 'stress': 13},
                'environment': {'h2s': 0.5, 'co': 4, 'ch4': 0.07, 'temp': 29.4, 'water_level': 'Normal'},
                'device': {'battery': 91, 'gps_status': 'Connected', 'sensor_status': 'Active', 'network': 'Weak', 'last_sync': 'Just now'},
                'coordinates': {'lat': 28.6140, 'lng': 77.2090},
                'exposure': {'hazard_hours': 19.8, 'gas_exposures': 3, 'oxygen_drops': 1, 'temp_exposures': 3, 'danger_alerts': 0},
                'override': None,
                'history': []
            },
            'W006': {
                'worker_id': 'W006',
                'name': 'Prakash Verma',
                'location': 'Manhole MH-67, Civil Lines',
                'zone': 'Zone A',
                'status': 'offline',
                'vitals': {'heart_rate': 0, 'spo2': 0, 'body_temp': 0, 'stress': 0},
                'environment': {'h2s': 0, 'co': 0, 'ch4': 0, 'temp': 0, 'water_level': 'Normal'},
                'device': {'battery': 8, 'gps_status': 'Disconnected', 'sensor_status': 'Offline', 'network': 'No Signal', 'last_sync': '15m ago'},
                'coordinates': {'lat': 28.6160, 'lng': 77.2120},
                'exposure': {'hazard_hours': 22.1, 'gas_exposures': 4, 'oxygen_drops': 2, 'temp_exposures': 3, 'danger_alerts': 0},
                'override': None,
                'history': []
            }
        }

    def reset(self):
        self.__init__()

    def update(self):
        for wid, w in self.workers.items():
            if w['status'] == 'offline':
                # Slowly drop battery even if offline
                w['device']['battery'] = max(0, w['device']['battery'] - random.uniform(0.01, 0.05))
                # Device problem: let's recalculate risk (will return OFFLINE risk parameters)
                risk = calculate_risk(w)
                w['risk_score'] = risk['score']
                w['risk_level'] = risk['level']
                w['risk_reasons'] = risk['reasons']
                w['risk_action'] = risk['action']
                w['predictive_warning'] = risk['predictive_warning']
                continue

            # Record history
            hist_state = {
                'vitals': w['vitals'].copy(),
                'environment': w['environment'].copy(),
                'coordinates': w['coordinates'].copy()
            }
            w['history'].append(hist_state)
            if len(w['history']) > 15:
                w['history'].pop(0)

            # Battery discharge
            w['device']['battery'] = max(0, w['device']['battery'] - random.uniform(0.02, 0.1))
            w['device']['last_sync'] = 'Just now'

            # Mini coordinates movement
            w['coordinates']['lat'] += random.uniform(-0.00004, 0.00004)
            w['coordinates']['lng'] += random.uniform(-0.00004, 0.00004)

            override = w.get('override')
            if override:
                if override == 'gas_leak':
                    w['environment']['h2s'] = min(75.0, w['environment']['h2s'] + random.uniform(5.0, 10.0))
                    w['environment']['ch4'] = min(3.5, w['environment']['ch4'] + random.uniform(0.2, 0.5))
                    w['environment']['co'] = min(110, w['environment']['co'] + random.randint(5, 12))
                    w['vitals']['heart_rate'] = min(138, w['vitals']['heart_rate'] + random.randint(2, 5))
                    w['vitals']['spo2'] = max(82, w['vitals']['spo2'] - random.randint(1, 3))
                    w['vitals']['stress'] = min(96, w['vitals']['stress'] + random.randint(3, 7))
                elif override == 'low_spo2':
                    w['vitals']['spo2'] = max(80, w['vitals']['spo2'] - random.randint(2, 4))
                    w['vitals']['heart_rate'] = min(142, w['vitals']['heart_rate'] + random.randint(2, 6))
                    w['vitals']['stress'] = min(92, w['vitals']['stress'] + random.randint(2, 5))
                elif override == 'fall':
                    w['fall_detected'] = True
                    w['vitals']['heart_rate'] = min(136, w['vitals']['heart_rate'] + random.randint(3, 6))
                    w['vitals']['stress'] = min(98, w['vitals']['stress'] + random.randint(4, 8))
                elif override == 'high_temp':
                    w['environment']['temp'] = min(45.0, w['environment']['temp'] + random.uniform(0.8, 2.0))
                    w['vitals']['body_temp'] = min(41.5, w['vitals']['body_temp'] + random.uniform(0.1, 0.4))
                    w['vitals']['heart_rate'] = min(130, w['vitals']['heart_rate'] + random.randint(2, 5))
                    w['vitals']['stress'] = min(88, w['vitals']['stress'] + random.randint(2, 4))
                elif override == 'flooding':
                    w['environment']['water_level'] = 'High'
                    w['vitals']['heart_rate'] = min(120, w['vitals']['heart_rate'] + random.randint(1, 4))
                    w['vitals']['stress'] = min(80, w['vitals']['stress'] + random.randint(2, 5))
                elif override == 'sos':
                    w['sos_triggered'] = True
                    w['vitals']['heart_rate'] = min(128, w['vitals']['heart_rate'] + random.randint(2, 5))
                    w['vitals']['stress'] = min(94, w['vitals']['stress'] + random.randint(3, 6))
            else:
                # Normal fluctuations
                w['vitals']['heart_rate'] = max(65, min(95, w['vitals']['heart_rate'] + random.randint(-1, 1)))
                w['vitals']['spo2'] = max(96, min(100, w['vitals']['spo2'] + random.choice([-1, 0, 1])))
                w['vitals']['body_temp'] = max(36.2, min(37.2, w['vitals']['body_temp'] + random.uniform(-0.03, 0.03)))
                w['vitals']['stress'] = max(8, min(22, w['vitals']['stress'] + random.randint(-1, 1)))
                
                w['environment']['h2s'] = max(0.2, min(2.5, w['environment']['h2s'] + random.uniform(-0.1, 0.1)))
                w['environment']['co'] = max(1, min(8, w['environment']['co'] + random.randint(-1, 1)))
                w['environment']['ch4'] = max(0.02, min(0.25, w['environment']['ch4'] + random.uniform(-0.01, 0.01)))
                w['environment']['temp'] = max(25.0, min(31.5, w['environment']['temp'] + random.uniform(-0.15, 0.15)))
                w['environment']['water_level'] = 'Normal'
                w.pop('fall_detected', None)
                w.pop('sos_triggered', None)

            # Recalculate risk
            risk = calculate_risk(w)
            w['risk_score'] = risk['score']
            w['risk_level'] = risk['level']
            w['risk_reasons'] = risk['reasons']
            w['risk_action'] = risk['action']
            w['predictive_warning'] = risk['predictive_warning']
            
            # Status update mapping
            if w['risk_level'] == 'CRITICAL':
                w['status'] = 'danger'
            elif w['risk_level'] in ('HIGH', 'MEDIUM'):
                w['status'] = 'warning'
            else:
                w['status'] = 'safe'

            # Accumulate hazard history hours
            if w['status'] == 'warning':
                w['exposure']['hazard_hours'] += 0.02
            elif w['status'] == 'danger':
                w['exposure']['hazard_hours'] += 0.04
                w['exposure']['danger_alerts'] += 1
                if w['vitals']['spo2'] < 90:
                    w['exposure']['oxygen_drops'] += 1
                if w['environment']['h2s'] > 10:
                    w['exposure']['gas_exposures'] += 1

# Instantiate global simulator
simulator = WorkersSimulator()

def calculate_exposure_score(worker_id):
    if worker_id not in simulator.workers:
        return {}
    w = simulator.workers[worker_id]
    data = w['exposure']
    score = int(
        data['hazard_hours'] * 2.5 +
        data['gas_exposures'] * 6 +
        data['oxygen_drops'] * 10 +
        data['temp_exposures'] * 4 +
        data['danger_alerts'] * 12
    )
    
    if score < 80:
        risk_level = 'Low'
        recommendation = 'SAFE FOR DUTY'
    elif score < 160:
        risk_level = 'Medium'
        recommendation = 'LIMITED DUTY'
    elif score < 240:
        risk_level = 'High'
        recommendation = 'ROTATE WORKER'
    else:
        risk_level = 'Critical'
        recommendation = 'TEMPORARILY REMOVE'
        
    return {
        'worker_id': worker_id,
        'name': w['name'],
        'exposure_data': data,
        'risk_score': score,
        'risk_level': risk_level,
        'recommendation': recommendation
    }

# RENDER PAGES
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/live-map')
def live_map():
    return render_template('live_map.html')

@app.route('/worker-health')
def worker_health():
    return render_template('worker_health.html')

@app.route('/health-protection')
def health_protection():
    return render_template('health_protection.html')

@app.route('/emergency-simulation')
def emergency_simulation():
    return render_template('emergency_simulation.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

@app.route('/event-history')
def event_history():
    return render_template('event_history.html')

# API ENDPOINTS
@app.route('/api/workers/status')
def get_workers_status():
    """Polled every 3s. Updates simulated values slightly & returns current status."""
    simulator.update()
    return jsonify(list(simulator.workers.values()))

@app.route('/api/worker/<worker_id>')
def get_worker_details(worker_id):
    if worker_id not in simulator.workers:
        return jsonify({'error': 'Worker not found'}), 404
    return jsonify(simulator.workers[worker_id])

@app.route('/api/exposure')
def get_exposure_data():
    exposure_list = [calculate_exposure_score(wid) for wid in simulator.workers.keys()]
    return jsonify(exposure_list)

@app.route('/api/events')
def get_events():
    return jsonify(event_log[-50:])

@app.route('/api/event/log', methods=['POST'])
def log_event():
    data = request.json
    event = {
        'event_id': f"EV-{random.randint(1000, 9999)}",
        'timestamp': datetime.now().isoformat(),
        'type': data.get('type', 'info'),
        'worker_id': data.get('worker_id', 'SYSTEM'),
        'location': data.get('location', 'Control Room'),
        'message': data.get('message', ''),
        'severity': data.get('severity', 'info'),
        'vitals': data.get('vitals', {}),
        'environment': data.get('environment', {}),
        'resolution_status': data.get('resolution_status', 'Active')
    }
    event_log.append(event)
    return jsonify({'success': True, 'event': event})

@app.route('/api/simulation/trigger', methods=['POST'])
def trigger_simulation():
    data = request.json or {}
    scenario = data.get('scenario')
    worker_id = data.get('worker_id')
    
    if scenario == 'reset':
        simulator.reset()
        event_log.append({
            'event_id': f"EV-{random.randint(1000, 9999)}",
            'timestamp': datetime.now().isoformat(),
            'type': 'system',
            'worker_id': 'SYSTEM',
            'location': 'Dashboard',
            'message': 'Simulation state reset. All worker vitals restored to normal.',
            'severity': 'info',
            'resolution_status': 'Resolved'
        })
        return jsonify({'success': True, 'message': 'Simulation reset completed.'})

    if not worker_id:
        # Default to high-risk worker W004 or a random active worker
        active_workers = [wid for wid, w in simulator.workers.items() if w['status'] != 'offline']
        worker_id = 'W004' if 'W004' in active_workers else active_workers[0]

    if worker_id not in simulator.workers:
        return jsonify({'error': 'Worker not found'}), 404

    # Trigger scenarios
    w = simulator.workers[worker_id]
    if scenario == 'multiple':
        # Trigger Gas Leak on W001 and Fall on W002
        simulator.workers['W001']['override'] = 'gas_leak'
        simulator.workers['W002']['override'] = 'fall'
        msg = "Multiple worker emergency triggered: Rajesh Kumar (W001) Gas Leak, Amit Singh (W002) Fall Detected."
    else:
        w['override'] = scenario
        scenarios_desc = {
            'gas_leak': 'Gas Leak alert',
            'low_spo2': 'Hypoxia (Low SpO₂) warning',
            'fall': 'Manhole fall alarm',
            'high_temp': 'Heatstroke / High temperature warning',
            'flooding': 'Sewer flooding / Rising water alert',
            'sos': 'SOS emergency trigger'
        }
        msg = f"{scenarios_desc.get(scenario, 'Unknown event')} triggered for worker {w['name']} ({worker_id})."

    # Log this system simulated event
    log_event_data = {
        'event_id': f"EV-{random.randint(1000, 9999)}",
        'timestamp': datetime.now().isoformat(),
        'type': scenario if scenario != 'multiple' else 'gas_leak',
        'worker_id': worker_id if scenario != 'multiple' else 'W001',
        'location': w['location'],
        'message': msg,
        'severity': 'Critical',
        'vitals': w['vitals'],
        'environment': w['environment'],
        'resolution_status': 'Active'
    }
    event_log.append(log_event_data)
    
    return jsonify({
        'success': True, 
        'message': msg, 
        'worker_id': worker_id,
        'worker_name': w['name']
    })

@app.route('/api/assistant/ask', methods=['POST'])
def assistant_ask():
    data = request.json or {}
    question = data.get('question', '').lower().strip()
    
    # Deterministic Local AI Q&A Engine
    workers = list(simulator.workers.values())
    ans = ""
    
    if not question:
        ans = "Hello, I am SaniSafe Safety AI. How can I assist you in the control room today?"
    
    elif "highest risk" in question or "who is at risk" in question or "dangerous worker" in question:
        critical_workers = [wk for wk in workers if wk['risk_level'] == 'CRITICAL']
        high_workers = [wk for wk in workers if wk['risk_level'] == 'HIGH']
        
        if critical_workers:
            names = ", ".join([f"{wk['name']} (Score: {wk['risk_score']})" for wk in critical_workers])
            ans = f"CRITICAL HAZARD: {names} is/are at critical risk level. Recommended Action: Evacuate immediately."
        elif high_workers:
            names = ", ".join([f"{wk['name']} (Score: {wk['risk_score']})" for wk in high_workers])
            ans = f"HIGH RISK: {names} is/are currently at high risk. They should be rotated to the surface immediately."
        else:
            sorted_workers = sorted(workers, key=lambda x: x.get('risk_score', 0), reverse=True)
            ans = f"Currently, all workers are safe. {sorted_workers[0]['name']} has the highest risk score of {sorted_workers[0]['risk_score']}."
            
    elif "danger" in question or "dangerous zone" in question or "hazardous zone" in question:
        bad_zones = {}
        for wk in workers:
            if wk['status'] != 'safe' and wk['status'] != 'offline':
                bad_zones[wk['zone']] = bad_zones.get(wk['zone'], 0) + 1
        if bad_zones:
            zones_str = ", ".join([f"{z} ({c} worker(s) warning/danger)" for z, c in bad_zones.items()])
            ans = f"Active dangerous zones identified: {zones_str}. Restrict new entries in these areas."
        else:
            ans = "All operational zones (Zone A, B, C) are currently reporting safe levels."
            
    elif "rotate" in question or "rotation" in question:
        need_rotation = []
        for wk in workers:
            if wk['status'] == 'warning' or wk['status'] == 'danger':
                need_rotation.append(wk)
        if need_rotation:
            recs = []
            for wk in need_rotation:
                repl = None
                for cand in workers:
                    if cand['status'] == 'safe' and cand['worker_id'] != wk['worker_id']:
                        repl = cand
                        break
                if repl:
                    recs.append(f"{wk['name']} ({wk['worker_id']}) -> Recommend replacement by {repl['name']} ({repl['worker_id']})")
                else:
                    recs.append(f"{wk['name']} ({wk['worker_id']}) -> No safe replacement available. Evacuate only.")
            ans = "Rotation Recommendations: " + " | ".join(recs)
        else:
            ans = "No workers currently exceed safety exposure thresholds. All workers safe for active duty."
            
    elif "why is " in question:
        found_wk = None
        for wk in workers:
            if wk['worker_id'].lower() in question or wk['name'].lower() in question:
                found_wk = wk
                break
        if found_wk:
            reasons = ", ".join(found_wk.get('risk_reasons', []))
            ans = f"{found_wk['name']} is {found_wk['risk_level']} (Score: {found_wk['risk_score']}) because: {reasons}. Recommended action: {found_wk['risk_action']}."
        else:
            ans = "I couldn't identify the worker you are asking about. Please search by name or worker ID (e.g. W004)."
            
    elif "emergency" in question or "emergencies" in question or "incidents" in question:
        active_danger = [wk for wk in workers if wk['status'] == 'danger']
        if active_danger:
            names = ", ".join([wk['name'] for wk in active_danger])
            ans = f"There is/are currently {len(active_danger)} active life safety emergencies: {names}. Dispatching rescue workflows."
        else:
            today_events = [e for e in event_log if e.get('severity') == 'Critical']
            ans = f"No active emergencies. Today, there were {len(today_events)} critical safety events logged."
            
    else:
        ans = ("I can assist with control room queries. Try asking: "
               "'Who is at highest risk?', 'Which zone is dangerous?', 'Who should be rotated?', "
               "'Why is W004 critical?', or 'How many emergencies occurred today?'")
               
    return jsonify({'answer': ans})

@app.route('/api/analytics/data')
def get_analytics_data():
    workers = list(simulator.workers.values())
    total_workers = len(workers)
    safe = sum(1 for w in workers if w['status'] == 'safe')
    warning = sum(1 for w in workers if w['status'] == 'warning')
    critical = sum(1 for w in workers if w['status'] == 'danger')
    offline = sum(1 for w in workers if w['status'] == 'offline')
    
    avg_risk = sum(w.get('risk_score', 0) for w in workers if w['status'] != 'offline') / max(1, total_workers - offline)
    compliance = max(50, int(100 - avg_risk))
    
    analytics_data = {
        'total_operations': 148,
        'total_incidents': len([e for e in event_log if e['severity'] == 'Critical']),
        'compliance_rate': compliance,
        'avg_rescue_time_seconds': 142,
        'risk_zones': [
            {'zone': 'Zone A (MG Road)', 'incidents': 12, 'risk_level': 'High'},
            {'zone': 'Zone B (Market Area)', 'incidents': 8, 'risk_level': 'Medium'},
            {'zone': 'Zone C (Gandhi Nagar)', 'incidents': 4, 'risk_level': 'Low'}
        ],
        'compliance_history': {
            'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'data': [98, 96, 94, 95, 91, 95, compliance]
        },
        'zone_distribution': {
            'labels': ['Zone A', 'Zone B', 'Zone C'],
            'data': [12, 8, 4]
        },
        'risk_distribution': {
            'labels': ['Safe (0-30)', 'Warning (31-60)', 'High (61-80)', 'Critical (81-100)'],
            'data': [safe, warning, 0 if warning==0 else 1, critical]
        }
    }
    return jsonify(analytics_data)

@app.route('/api/reports/daily')
def daily_report():
    report = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'total_workers': len(simulator.workers),
        'incidents': sum(1 for w in simulator.workers.values() if w['status'] == 'danger'),
        'alerts': sum(1 for w in simulator.workers.values() if w['status'] == 'warning'),
        'rescue_events': len([e for e in event_log if 'rescue' in e.get('type', '')]),
        'total_work_hours': 48 + random.randint(0, 8)
    }
    return jsonify(report)

@app.route('/api/reports/weekly')
def weekly_report():
    workers_health = [calculate_exposure_score(wid) for wid in simulator.workers.keys()]
    report = {
        'week': f"{(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')} to {datetime.now().strftime('%Y-%m-%d')}",
        'workers': workers_health,
        'high_risk_count': sum(1 for w in workers_health if w['risk_level'] in ('High', 'Critical')),
        'recommended_rest': [w['name'] for w in workers_health if w['risk_level'] in ('High', 'Critical')]
    }
    return jsonify(report)

@app.route('/api/reports/monthly')
def monthly_report():
    report = {
        'month': datetime.now().strftime('%B %Y'),
        'hazardous_operations': 164,
        'incident_count': len([e for e in event_log if e['severity'] == 'Critical']) + 4,
        'compliance_rate': 94,
        'avg_rescue_time': "2m 22s",
        'high_risk_locations': [
            'Manhole MH-45, MG Road (Zone A)',
            'Drainage Line DL-8, Station Road (Zone A)',
            'Sewer Line SL-15, Market Area (Zone B)'
        ]
    }
    return jsonify(report)

if __name__ == '__main__':
    import os

    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5001))
    )
