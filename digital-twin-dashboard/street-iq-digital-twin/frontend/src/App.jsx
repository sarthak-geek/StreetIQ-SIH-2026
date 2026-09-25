import { useState } from 'react'
import './App.css'
import HinjewadiMap from './HinjewadiMap'

const metrics = [
  { label: 'Active buses', value: '05', note: 'On Hinjewadi loop' },
  { label: 'Road segments', value: '24', note: '500m intelligent units' },
  { label: 'Open alerts', value: '03', note: 'Needs authority action' },
  { label: 'Road health', value: '78%', note: 'Across active routes' },
]

const serviceProfiles = {
  peak: {
    label: 'Peak service',
    headwayMinutes: 15,
    verificationWindowMinutes: 1440,
  },
  normal: {
    label: 'Normal service',
    headwayMinutes: 30,
    verificationWindowMinutes: 1440,
  },
  offPeak: {
    label: 'Off-peak service',
    headwayMinutes: 60,
    verificationWindowMinutes: 1440,
  },
}

const OBSERVATION_RETENTION_MINUTES = 12 * 60

function removeExpiredObservations(events, currentMinutes) {
  return events.filter((event) => {
    return (
      currentMinutes - event.observedAtMinutes <
      OBSERVATION_RETENTION_MINUTES
    )
  })
}

const initialEvents = [
  {
    id: 'system-online',
    title: 'System online',
    message: 'Hinjewadi mobile sensing fleet is connected.',
    status: 'success',
    time: '09:00',
    observedAtMinutes: 540,
  },
]

function formatSimulationTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}


function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  )
}

function App() {
  const [events, setEvents] = useState(initialEvents)
  const [scenarioRunning, setScenarioRunning] = useState(false)
  const [incidentSegmentId, setIncidentSegmentId] = useState(null)
  const [segmentUpdates, setSegmentUpdates] = useState({})
  const [trafficSignal, setTrafficSignal] = useState(null)
  const [serviceMode, setServiceMode] = useState('peak')
  const [simulationMinutes, setSimulationMinutes] = useState(550)
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [potholeDetection, setPotholeDetection] = useState(null)
  const [potholeTicketOpen, setPotholeTicketOpen] = useState(false)
  const [trafficTicketOpen, setTrafficTicketOpen] = useState(false)

  const serviceProfile = serviceProfiles[serviceMode]
  function updateSimulationClock(nextMinutes) {
  setSimulationMinutes(nextMinutes)

  setEvents((previousEvents) =>
    removeExpiredObservations(previousEvents, nextMinutes),
  )
}

function addEvent(
  title,
  message,
  status,
  eventMinutes = simulationMinutes,
) {
  const newEvent = {
    id: `${eventMinutes}-${Date.now()}-${title}`,
    title,
    message,
    status,
    time: formatSimulationTime(eventMinutes),
    observedAtMinutes: eventMinutes,
  }

  setEvents((previousEvents) => [
    newEvent,
    ...removeExpiredObservations(previousEvents, eventMinutes),
  ])
}

async function runPotholeScenario() {
  if (scenarioRunning || potholeTicketOpen) {
  return
}

  const targetSegmentId = 'HIN-LOOP-01-S08'
  const potholeOutput = [[80, 0.10]]
  const detectionTime = simulationMinutes
  const verificationDelay = serviceProfile.headwayMinutes
  const verificationTime = detectionTime + verificationDelay
  const alertTime = verificationTime + 5

  setScenarioRunning(true)
  updateSimulationClock(detectionTime)

  addEvent(
    'Possible pothole detected',
    `BUS-02 detected a road anomaly on ${targetSegmentId}. AI output: [[80, 0.10]]. Confidence: 82%. Status: pending verification.`,
    'warning',
    detectionTime,
  )
      setPotholeDetection({
      segmentId: targetSegmentId,
      output: potholeOutput,
      widthPercent: 80,
      segmentOffset: 0.10,
      confidence: 82,
      verificationStatus: 'Pending verification',
    })

  await wait(2200)

  updateSimulationClock(verificationTime)

  addEvent(
    'Second bus observation',
    `BUS-04 crossed ${targetSegmentId} ${verificationDelay} minutes later under the ${serviceProfile.label.toLowerCase()} profile.`,
    'warning',
    verificationTime,
  )

  await wait(1600)

  setIncidentSegmentId(targetSegmentId)
    setPotholeDetection((previousDetection) => ({
    ...previousDetection,
    confidence: 96,
    verificationStatus: 'Verified by BUS-02 and BUS-04',
  }))

  setSegmentUpdates((previousUpdates) => ({
    ...previousUpdates,
    [targetSegmentId]: {
      health: 43,
      status: 'Critical: verified pothole',
      color: '#fb7185',
    },
  }))

  addEvent(
    'Pothole verified',
    `${targetSegmentId} was verified through independent BUS-02 and BUS-04 observations.`,
    'success',
    verificationTime + 2,
  )

  await wait(1400)

  updateSimulationClock(alertTime)

  addEvent(
    'Authority alert created',
    `Maintenance ticket sent to the road repair authority for ${targetSegmentId}.`,
    'critical',
    alertTime,
  )
  setPotholeTicketOpen(true)
  setScenarioRunning(false)
}

  async function runTrafficScenario() {
  if (scenarioRunning || trafficTicketOpen) {
    return
  }

  const targetSegmentId = 'HIN-LOOP-01-S05'

  setScenarioRunning(true)

  addEvent(
    'Low speed threshold reached',
    `BUS-02 average speed fell to 12 km/h on ${targetSegmentId}. Edge traffic analysis activated.`,
    'warning',
  )

  await wait(1800)

  addEvent(
    'High traffic density detected',
    `Camera analysis found a high vehicle queue near signal SIG-HIN-04 on ${targetSegmentId}.`,
    'warning',
  )

  await wait(1800)

  setSegmentUpdates((previousUpdates) => ({
    ...previousUpdates,
    [targetSegmentId]: {
      health: 66,
      status: 'High traffic congestion',
      color: '#f59e0b',
    },
  }))

  setTrafficSignal({
    id: 'SIG-HIN-04',
    segmentId: targetSegmentId,
    position: [18.5888, 73.7232],
    density: 'High',
    phase: 'Adaptive green',
    greenSeconds: 55,
  })

  addEvent(
    'Signal timing updated',
    `SIG-HIN-04 green time increased from 30 seconds to 55 seconds.`,
    'success',
  )

  await wait(1400)

  addEvent(
    'Traffic authority notified',
    `Congestion response logged for ${targetSegmentId}; digital twin state updated.`,
    'critical',
  )
  setTrafficTicketOpen(true)
  setScenarioRunning(false)
}
  function resetReplay() {
  setEvents(initialEvents)
  setScenarioRunning(false)
  setIncidentSegmentId(null)
  setSegmentUpdates({})
  setTrafficSignal(null)
  setPotholeDetection(null)
  setPotholeTicketOpen(false)
  setSelectedSegment(null)
  setSimulationMinutes(550)
  setTrafficTicketOpen(false)
}

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">SI</span>
          <div>
            <h1>Street IQ</h1>
            <p>Hinjewadi Urban Digital Twin</p>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          <span>Fleet replay ready</span>
          <span className="simulation-clock">
            {formatSimulationTime(simulationMinutes)}
          </span>
          <span className="time-scale">12 h rolling window</span>
        </div>
      </header> 

      <div className="dashboard-layout">
        <aside className="sidebar">
          <p className="sidebar-label">COMMAND CENTER</p>

          <button className="nav-item active">Digital Twin</button>
          <button className="nav-item">Fleet Monitor</button>
          <button className="nav-item">Road Health</button>
          <button className="nav-item">Traffic Signals</button>
          <button className="nav-item">Authority Alerts</button>

          <div className="sidebar-footer">
            <p>Coverage area</p>
            <strong>Hinjewadi Pilot</strong>
            <span>Phase 1, 2 and 3</span>
          </div>
        </aside>

        <section className="workspace">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">12-HOUR OPERATIONS VIEW</p>
              <h2>Hinjewadi Route Network</h2>
            </div>

            <button className="outline-button">Center map</button>
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <section className="map-panel">
            <div className="map-toolbar">
              <div>
                <strong>Segment status</strong>
                <span>Click interactions will be added next</span>
              </div>

              <div className="legend">
                <span><i className="healthy" /> Healthy</span>
                <span><i className="watch" /> Monitor</span>
                <span><i className="critical" /> Critical</span>
              </div>
            </div>

            <HinjewadiMap
              incidentSegmentId={incidentSegmentId}
              segmentUpdates={segmentUpdates}
              trafficSignal={trafficSignal}
              potholeDetection={potholeDetection}
              onSelectSegment={setSelectedSegment}
              
            />
          </section>
          <section className="segment-details">
            <div>
              <p className="eyebrow">SELECTED ROAD SEGMENT</p>
              <h3>
                {selectedSegment
                  ? selectedSegment.id
                  : 'Select a coloured segment on the map'}
              </h3>
            </div>

            {selectedSegment ? (
              <div className="segment-data-grid">
                <article>
                  <span>Road health</span>
                  <strong>{selectedSegment.health}%</strong>
                </article>

                <article>
                  <span>Status</span>
                  <strong>{selectedSegment.status}</strong>
                </article>

                <article>
                  <span>Segment length</span>
                  <strong>~{selectedSegment.length} m</strong>
                </article>

                <article>
                  <span>Twin source</span>
                  <strong>Bus GPS + edge AI</strong>
                </article>
              </div>
            ) : (
              <p className="segment-empty">
                Click any coloured road segment to inspect its live digital-twin data.
              </p>
            )}
          </section>

        </section>

        <aside className="control-panel">
          <p className="eyebrow">DEMO CONTROLS</p>
          <h2>Run a system flow</h2>
          <p className="panel-copy">
            Each button will later trigger a bus observation, cloud verification,
            twin update, and authority action.
          </p>
          <label className="service-selector">
          <span>Fleet service profile</span>

          <select
            value={serviceMode}
            onChange={(event) => setServiceMode(event.target.value)}
            disabled={scenarioRunning || potholeTicketOpen}
          >
            <option value="peak">Peak service — 15 min</option>
            <option value="normal">Normal service — 30 min</option>
            <option value="offPeak">Off-peak service — 60 min</option>
          </select>

          <small>
            {scenarioRunning
              ? 'Cloud verification in progress...'
              : potholeTicketOpen
                ? 'Verified pothole · maintenance ticket open'
                : 'Camera event → multi-bus verification'}
          </small>
          </label>
          <button
            className="reset-replay-button"
            onClick={resetReplay}
            disabled={scenarioRunning}
          >
            Reset replay
          </button>
          <button
            className="scenario-card pothole"
            onClick={runPotholeScenario}
disabled={scenarioRunning || potholeTicketOpen}
          >
            <span>01</span>
            <div>
              <strong>Pothole response</strong>
              <small>
                {scenarioRunning
                  ? 'Cloud verification in progress...'
                  : potholeTicketOpen
                    ? 'Verified pothole · maintenance ticket open'
                    : 'Camera event → multi-bus verification'}
              </small>
            </div>
          </button>

          <button
            className="scenario-card traffic"
            onClick={runTrafficScenario}
            disabled={scenarioRunning || trafficTicketOpen}
          >
            <span>02</span>
            <div>
              <strong>Traffic signal response</strong>
          <small>
            {scenarioRunning
              ? 'Traffic analysis in progress...'
              : trafficTicketOpen
                ? 'Adaptive signal active · traffic ticket open'
                : 'Low speed → density → adaptive signal'}
          </small>
            </div>
          </button>


          
          <section className="event-feed">
          <p>RECENT OBSERVATIONS · LAST 12 HOURS</p>

            {events.map((event) => (
              <article key={event.id} className={`event-card ${event.status}`}>
              <strong>{event.title}</strong>
              <span>{event.message}</span>
              <time>{event.time}</time>
              </article>
            ))}
          </section>

          <div className="pipeline">
            <p>EVENT PIPELINE</p>
            <ol>
              <li>Bus camera</li>
              <li>Edge AI detection</li>
              <li>GPS and event data</li>
              <li>Cloud verification</li>
              <li>Digital twin update</li>
              <li>Authority alert</li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  )
}



export default App