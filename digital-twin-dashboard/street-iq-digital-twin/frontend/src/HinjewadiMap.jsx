import { useEffect, useState } from 'react'

import {
  MapContainer,
  TileLayer,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import {
  lineString,
  length,
  lineSliceAlong,
} from '@turf/turf'

import 'leaflet/dist/leaflet.css'
import './HinjewadiMap.css'


// ============================================================
// ROUTE
// ============================================================
 // These coordinate are of the place close by to us.
// You can add coordinates of any place here and the code will generate segments of 500m or less ength by itself on provided coordinates.
// Make sure whene you provide coordinates they are in [longitude, latitude] format
// also if there are curves or turns on routes, add multiple coordinates for the code to generates segments precisely on the route, otherwise it will be jus a straingh line.
const hinjewadiLoop = [
  [73.751141, 18.609011],
  [73.752177, 18.613449],
  [73.751832, 18.614492],
  [73.752007, 18.618812],
  [73.752079, 18.620449],
  [73.751839, 18.621721],
  [73.751503, 18.622539],
  [73.751372, 18.624606],
  [73.751521, 18.62624]


]


const SEGMENT_LENGTH_KM = 0.5


// ============================================================
// CREATE SEGMENTS
// ============================================================

function createSegments(routeCoordinates) {

  const route = lineString(routeCoordinates)

  const totalLength = length(route, {
    units: 'kilometers',
  })

  const segments = []

  let startDistance = 0
  let segmentNumber = 1

  while (startDistance < totalLength) {

    const endDistance = Math.min(
      startDistance + SEGMENT_LENGTH_KM,
      totalLength
    )

    const segmentGeometry = lineSliceAlong(
      route,
      startDistance,
      endDistance,
      {
        units: 'kilometers',
      }
    )

    segments.push({

      id:
        `S${String(segmentNumber).padStart(2, '0')}`,


      startDistance,

      endDistance,

      length:
        endDistance - startDistance,

      geometry:
        segmentGeometry,

    })

    startDistance = endDistance
    segmentNumber++
  }

  return segments
}


const segments = createSegments(
  hinjewadiLoop
)


// ============================================================
// TURF → LEAFLET COORDINATES
// ============================================================

function turfToLeafletCoordinates(coordinates) {

  return coordinates.map(
    ([longitude, latitude]) => [
      latitude,
      longitude,
    ]
  )

}


// ============================================================
// CENTER MAP
// ============================================================

function CenterMap({ centerMap }) {

  const map = useMap()

  useEffect(() => {

    map.setView(
      [
        18.6084,
        73.7386,
      ],
      14
    )

  }, [centerMap, map])

  return null
}


// ============================================================
// MOUSE POSITION TRACKER
// ============================================================

function MousePosition({
  onPositionChange,
}) {

  useMapEvents({

    mousemove: (event) => {

      onPositionChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })

    },

  })

  return null
}


// ============================================================
// HINJEWADI MAP
// ============================================================

function HinjewadiMap({
  selectedSegmentId,
  onSegmentClick,
  centerMap,
}) {

  const [
    hoveredSegmentId,
    setHoveredSegmentId,
  ] = useState(null)


  const [
    mousePosition,
    setMousePosition,
  ] = useState(null)


  return (

    <div className="leaflet-wrapper">

      {/* ================================================== */}
      {/* LEAFLET MAP */}
      {/* ================================================== */}

      <MapContainer
        className="hinjewadi-map"

        center={[
          18.6084,
          73.7386,
        ]}

        zoom={14}

        scrollWheelZoom={true}
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* Center map controller */}

        <CenterMap
          centerMap={centerMap}
        />


        {/* Mouse position listener */}

        <MousePosition
          onPositionChange={
            setMousePosition
          }
        />


        {/* ================================================== */}
        {/* ROAD SEGMENTS */}
        {/* ================================================== */}

        {segments.map((segment) => {

          const isHovered =
            hoveredSegmentId === segment.id


          const isSelected =
            selectedSegmentId === segment.id


          const coordinates =
            segment.geometry.geometry.coordinates


          return (

            <Polyline

              key={segment.id}

              positions={
                turfToLeafletCoordinates(
                  coordinates
                )
              }

              pathOptions={{

                color:
                  isSelected
                    ? '#2563eb'
                    : isHovered
                      ? '#2563eb'
                      : '#64748b',

                weight:
                  isSelected
                    ? 10
                    : isHovered
                      ? 9
                      : 5,

                opacity:
                  isSelected
                    ? 1
                    : isHovered
                      ? 1
                      : 0.8,

              }}


              eventHandlers={{

                mouseover: () => {

                  setHoveredSegmentId(
                    segment.id
                  )

                },


                mouseout: () => {

                  setHoveredSegmentId(
                    null
                  )

                },


                click: () => {

                  onSegmentClick(
                    segment
                  )

                },

              }}

            />

          )

        })}

      </MapContainer>


      {/* ================================================== */}
      {/* COORDINATE DISPLAY */}
      {/* ================================================== */}

      {mousePosition && (

        <div className="map-coordinate-display">

          <span>LAT</span>

          <strong>
            {mousePosition.latitude.toFixed(6)}
          </strong>

          <span>LNG</span>

          <strong>
            {mousePosition.longitude.toFixed(6)}
          </strong>

        </div>

      )}

    </div>

  )
}


export default HinjewadiMap
