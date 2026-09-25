import { useEffect, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './HinjewadiMap.css'

/*
  Leaflet coordinates always follow this order:
  [latitude, longitude]

  These are prototype route coordinates for the Hinjewadi pilot.
  Later, these will come from our database/API.
*/
const routes = [
  {
    id: 'HIN-R01',
    name: 'Phase 1 to Phase 2 Corridor',
    color: '#34d399',
    points: [
      [18.5917, 73.7388],
      [18.5920, 73.7340],
      [18.5916, 73.7292],
      [18.5904, 73.7252],
    ],
  },
  {
    id: 'HIN-R02',
    name: 'Phase 2 to Phase 3 Corridor',
    color: '#60a5fa',
    points: [
      [18.5904, 73.7252],
      [18.5878, 73.7216],
      [18.5852, 73.7185],
      [18.5828, 73.7159],
    ],
  },
  {
    id: 'HIN-R03',
    name: 'Hinjewadi Loop Return Route',
    color: '#a78bfa',
    points: [
      [18.5917, 73.7388],
      [18.5887, 73.7350],
      [18.5864, 73.7305],
      [18.5852, 73.7185],
    ],
  },
]

const hinjewadiLoop = [
  [18.5917, 73.7388],
  [18.5920, 73.7340],
  [18.5916, 73.7292],
  [18.5904, 73.7252],
  [18.5878, 73.7216],
  [18.5852, 73.7185],
  [18.5828, 73.7159],
  [18.5852, 73.7185],
  [18.5864, 73.7305],
  [18.5887, 73.7350],
  [18.5917, 73.7388],
]

const EARTH_RADIUS_METERS = 6371000

function distanceInMeters(start, end) {
  const [startLat, startLng] = start
  const [endLat, endLng] = end

  const toRadians = Math.PI / 180

  const latitudeDifference = (endLat - startLat) * toRadians
  const longitudeDifference = (endLng - startLng) * toRadians

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(startLat * toRadians) *
      Math.cos(endLat * toRadians) *
      Math.sin(longitudeDifference / 2) ** 2

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  )
}

function interpolatePoint(start, end, fraction) {
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ]
}

function getInitialSegmentState(segmentNumber) {
  /*
    These are only demo states for now.
    Later the backend/database will send actual health data.
  */
  if (segmentNumber === 4) {
    return {
      health: 58,
      status: 'Monitor',
      color: '#fbbf24',
    }
  }

  if (segmentNumber === 8) {
    return {
      health: 43,
      status: 'Critical',
      color: '#fb7185',
    }
  }

  return {
    health: 88,
    status: 'Healthy',
    color: '#34d399',
  }
}

function createSegments(routeId, routePoints, targetLength = 500) {
  const generatedSegments = []

  let currentPoints = [routePoints[0]]
  let accumulatedLength = 0
  let segmentNumber = 1

  for (let pointIndex = 0; pointIndex < routePoints.length - 1; pointIndex += 1) {
    const startPoint = routePoints[pointIndex]
    const endPoint = routePoints[pointIndex + 1]

    const legLength = distanceInMeters(startPoint, endPoint)
    let usedLength = 0

    while (usedLength < legLength) {
      const remainingLength = legLength - usedLength
      const lengthNeeded = targetLength - accumulatedLength
      const lengthToTake = Math.min(remainingLength, lengthNeeded)

      const nextPoint = interpolatePoint(
        startPoint,
        endPoint,
        (usedLength + lengthToTake) / legLength,
      )

      currentPoints.push(nextPoint)
      accumulatedLength += lengthToTake
      usedLength += lengthToTake

      if (accumulatedLength >= targetLength - 0.1) {
        const state = getInitialSegmentState(segmentNumber)

        generatedSegments.push({
          id: `${routeId}-S${String(segmentNumber).padStart(2, '0')}`,
          points: currentPoints,
          length: Math.round(accumulatedLength),
          ...state,
        })

        segmentNumber += 1
        currentPoints = [nextPoint]
        accumulatedLength = 0
      }
    }
  }

  if (currentPoints.length > 1 && accumulatedLength > 1) {
    const state = getInitialSegmentState(segmentNumber)

    generatedSegments.push({
      id: `${routeId}-S${String(segmentNumber).padStart(2, '0')}`,
      points: currentPoints,
      length: Math.round(accumulatedLength),
      ...state,
    })
  }

  return generatedSegments
}

const segments = createSegments('HIN-LOOP-01', hinjewadiLoop)

function findCurrentSegment(position) {
  let nearestSegment = segments[0]
  let shortestDistance = Infinity

  segments.forEach((segment) => {
    segment.points.forEach((segmentPoint) => {
      const distance = distanceInMeters(position, segmentPoint)

      if (distance < shortestDistance) {
        shortestDistance = distance
        nearestSegment = segment
      }
    })
  })

  return nearestSegment
}
const buses = [
  {
    id: 'BUS-02',
    route: 'HIN-LOOP-01',
    path: hinjewadiLoop,
  },
  {
    id: 'BUS-04',
    route: 'HIN-LOOP-01',
    path: hinjewadiLoop,
  },
]

function getPositionOnPath(points, progress) {
  const numberOfLegs = points.length - 1
  const scaledProgress = progress * numberOfLegs

  const legIndex = Math.min(
    Math.floor(scaledProgress),
    numberOfLegs - 1,
  )

  const legProgress = scaledProgress - legIndex

  const [startLat, startLng] = points[legIndex]
  const [endLat, endLng] = points[legIndex + 1]

  return [
    startLat + (endLat - startLat) * legProgress,
    startLng + (endLng - startLng) * legProgress,
  ]
}

    function HinjewadiMap({
      incidentSegmentId,
      segmentUpdates,
      trafficSignal,
      potholeDetection,
      onSelectSegment,
    }) {
  const [movementTick, setMovementTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMovementTick((previousTick) => previousTick + 1)
    }, 1200)

    return () => clearInterval(timer)
  }, [])

const liveBuses = buses.map((bus, index) => {
  const progress = ((movementTick * 0.06) + index * 0.42) % 1

  const position = getPositionOnPath(bus.path, progress)
  const currentSegment = findCurrentSegment(position)
  const potholeSegment = potholeDetection
  ? segments.find((segment) => segment.id === potholeDetection.segmentId)
  : null

const potholePosition = potholeSegment
  ? getPositionOnPath(
      potholeSegment.points,
      potholeDetection.segmentOffset,
    )
  : null

  return {
    ...bus,
    position,
    currentSegment,
  }
})

const activeSegmentIds = new Set(
  liveBuses.map((bus) => bus.currentSegment.id),
)
const potholeSegment = potholeDetection
  ? segments.find((segment) => segment.id === potholeDetection.segmentId)
  : null

const potholePosition = potholeSegment
  ? getPositionOnPath(
      potholeSegment.points,
      potholeDetection.segmentOffset,
    )
  : null

return (
  <div className="leaflet-wrapper">
    <MapContainer
      center={[18.5890, 73.7280]}
      zoom={14}
      scrollWheelZoom
      className="hinjewadi-map"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color,
              weight: 5,
              opacity: 0.65,
            }}
          >
          <Popup>
            <strong>{route.id}</strong>
            <br />
            {route.name}
          </Popup>
        </Polyline>
      ))}

{segments.map((segment) => {
  const displaySegment = {
    ...segment,
    ...(segmentUpdates[segment.id] ?? {}),
  }

  const isActive = activeSegmentIds.has(segment.id)
  const isIncident = incidentSegmentId === segment.id

  return (
        <Polyline
          key={segment.id}
          positions={segment.points}
          pathOptions={{
            color: displaySegment.color,
            weight: isIncident ? 18 : isActive ? 15 : 10,
            opacity: isActive || isIncident ? 1 : 0.75,
          }}
          eventHandlers={{
            click: () => onSelectSegment(displaySegment),
          }}
        >
      <Popup>
        <strong>{displaySegment.id}</strong>
        <br />
        Health: {displaySegment.health}%
        <br />
        Status: {displaySegment.status}
        <br />
        Length: ~{displaySegment.length} m
      </Popup>
    </Polyline>
  )
})}

              {trafficSignal && (
          <CircleMarker
            center={trafficSignal.position}
            radius={14}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#f59e0b',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <strong>{trafficSignal.id}</strong>
              <br />
              Segment: {trafficSignal.segmentId}
              <br />
              Traffic density: {trafficSignal.density}
              <br />
              Signal phase: {trafficSignal.phase}
              <br />
              Green duration: {trafficSignal.greenSeconds} seconds
            </Popup>
          </CircleMarker>
        )}

        {potholeDetection && potholePosition && (
  <CircleMarker
    center={potholePosition}
    radius={Math.max(8, potholeDetection.widthPercent / 5)}
    pathOptions={{
      color: '#ffffff',
      fillColor:
        potholeDetection.verificationStatus === 'Pending verification'
          ? '#fbbf24'
          : '#ef4444',
      fillOpacity: 1,
      weight: 3,
    }}
  >
    <Popup>
      <strong>Pothole detection</strong>
      <br />
      Segment: {potholeDetection.segmentId}
      <br />
      AI output: {JSON.stringify(potholeDetection.output)}
      <br />
      Width: {potholeDetection.widthPercent}%
      <br />
      Position: {potholeDetection.segmentOffset * 100}% from segment start
      <br />
      Confidence: {potholeDetection.confidence}%
      <br />
      Status: {potholeDetection.verificationStatus}
    </Popup>
  </CircleMarker>
)}

      {liveBuses.map((bus) => (
        <CircleMarker
          key={bus.id}
          center={bus.position}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#0f4c81',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>
            <strong>{bus.id}</strong>
            <br />
            Route: {bus.route}
            <br />
            <br />
            Segment: {bus.currentSegment.id}
            <br />
            GPS: {bus.position[0].toFixed(5)}, {bus.position[1].toFixed(5)}
            <br />
            Edge AI: Active
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>

    <div className="map-key">
      <span><i className="key-bus" /> Bus sensing unit</span>
      <span><i className="key-yellow" /> Monitor segment</span>
      <span><i className="key-red" /> Critical segment</span>
    </div>
  </div>
)
}


export default HinjewadiMap