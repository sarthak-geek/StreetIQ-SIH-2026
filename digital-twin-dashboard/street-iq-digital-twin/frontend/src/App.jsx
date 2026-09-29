import { useState } from 'react'
import './App.css'
import HinjewadiMap from './HinjewadiMap'


function App() {

  const [selectedSegment, setSelectedSegment] = useState(null)

  // This will contain the string received from Flask
  const [flaskResponse, setFlaskResponse] = useState('')

  const [centerMap, setCenterMap] = useState(0)


  const handleDatabaseOperation = async () => {
  try {
    await fetch(
      'http://127.0.0.1:5000/database-operation',
      {
        method: 'POST',
      }
    )
  } catch (error) {
    console.error(
      'Could not trigger Flask database operation:',
      error
    )
  }
}


const handleSegmentClick = async (segment) => {

  // Same segment clicked again
  if (selectedSegment?.id === segment.id) {

    setSelectedSegment(null)
    setFlaskResponse('')

    return
  }


  // Select segment
  setSelectedSegment(segment)

  // Clear previous data
  setFlaskResponse('')


  try {

    const response = await fetch(
      'http://127.0.0.1:5000/segment',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          segment_id: segment.id,
        }),
      }
    )


    // Convert Flask response to JavaScript object
    const data = await response.json()


    // Check Flask error
    if (!response.ok) {

      setFlaskResponse({
        error: data.error || 'Unknown Flask error'
      })

      return
    }


    // Store JSON received from Flask
    setFlaskResponse(data)


  } catch (error) {

    console.error(
      'Could not communicate with Flask:',
      error
    )

    setFlaskResponse({
      error: 'Could not connect to Flask'
    })
  }
}


  return (
    <div className="app-shell">

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            SI
          </div>

          <div>
            <h1>Street IQ</h1>
            <p>Digital Twin Model Prototype</p>
          </div>

        </div>


        <div className="system-status">

          <span className="status-dot" />

          dynamic dashboard

        </div>

      </header>


      <div className="dashboard-layout">


        {/* ================================================== */}
        {/* SIDEBAR */}
        {/* ================================================== */}

        <aside className="sidebar">

          <p className="sidebar-label">
            DIGITAL TWIN
          </p>

          <button className="nav-item active">
            Digital Twin
          </button>

        </aside>


        {/* ================================================== */}
        {/* MAIN WORKSPACE */}
        {/* ================================================== */}

        <main className="workspace">

          <div className="workspace-heading">

            <div>

              <p className="eyebrow">
                URBAN DIGITAL TWIN
              </p>

              <h2>
                Public Transport Route Network
              </h2>

              <p>
              network visualization and map view.
              </p>
              <br></br>

            </div>


            <div className="active-bus-status">

              <span>
                ACTIVE BUSES
              </span>

              <strong>
                03
              </strong>

            </div>


            <button
              className="outline-button"
              onClick={() => setCenterMap((value) => value + 1)}
            >
              Center map
            </button>
            <button
    className="outline-button"
    onClick={handleDatabaseOperation}
  >
    Update Database
  </button>

          </div>


          {/* ================================================== */}
          {/* MAP */}
          {/* ================================================== */}

          <section className="map-panel">

            <div className="map-toolbar">

              <div>

                <strong>
                  Map
                </strong>

                <span>
                  Hover over a road segment to highlight it.
                  Click a segment to select it.
                </span>

              </div>

            </div>


            <div className="map-canvas">

              <HinjewadiMap
                selectedSegmentId={
                  selectedSegment?.id
                }

                onSegmentClick={
                  handleSegmentClick
                }

                centerMap={
                  centerMap
                }
              />

            </div>

          </section>


          {/* ================================================== */}
          {/* NETWORK INFORMATION */}
          {/* ================================================== */}

          <section className="segment-details">

            <h3>
              Network Information
            </h3>

            <div className="segment-data-grid">

              <article>
                <span>Map source</span>
                <strong>
                  OpenStreetMap
                </strong>
              </article>


              <article>
                <span>Segmentation</span>
                <strong>
                  500 m
                </strong>
              </article>


              <article>
                <span>Status</span>
                <strong>
                  Dynamic
                </strong>
              </article>

            </div>

          </section>

        </main>


        {/* ================================================== */}
        {/* RIGHT DASHBOARD */}
        {/* ================================================== */}

        <aside className="control-panel">

          <p className="eyebrow">
            DASHBOARD
          </p>

          <h2>
            Digital Twin View
          </h2>

          <p className="panel-copy">
            Select a road segment on the map to inspect
            its digital-twin information.
          </p>


          {/* ================================================== */}
          {/* FLASK RESPONSE BOX */}
          {/* ================================================== */}

          {selectedSegment && (

            <div className="selected-segment-box">

              <p>
                <p>{selectedSegment.id} CONDITION</p>
              </p>


              {!flaskResponse ? (

                <div className="database-loading">
                  Waiting for database...
                </div>

              ) : flaskResponse.error ? (

                <div className="database-error">
                  {flaskResponse.error}
                </div>

              ) : (

                <div className="road-condition-list">

                  {Object.entries(flaskResponse).map(
                    ([anomaly, values]) => (

                      <div
                        className="road-condition-item"
                        key={anomaly}
                      >

                        {/* Anomaly name */}

                        <div className="anomaly-name">
                          {anomaly}
                        </div>


                        {/* Visual representation */}

                        <div className="anomaly-visualization">

                          {/* 100% segment line */}

                          <div className="anomaly-line">


                            {/* Start of line */}

                            <div className="line-start" />


                            {/* Anomaly markers */}

                            {values.map(
                              ([value, position], index) => (

                                <div
                                  className="anomaly-marker"
                                  key={`${anomaly}-${index}`}
                                  style={{
                                    left: `${position}%`,
                                  }}
                                >

                                  <div className="marker-dot" />

                                  <span className="marker-value">
                                    {value}
                                  </span>

                                </div>

                              )
                            )}


                            {/* End of line */}

                            <div className="line-end" />

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}


          <div className="pipeline">

            <p>
              DISPLAYED INFORMATION
            </p>

            <ol>

              <li>
                Map visualization
              </li>

              <li>
                Dashboard metrics
              </li>

              <li>
                Selected road segment
              </li>
              <li>Segments condition visualisation</li>

            </ol>

          </div>

        </aside>

      </div>

    </div>
  )
}


export default App