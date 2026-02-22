
import React, { useEffect, useRef, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import { useTheme } from "../../context/ThemeContext";

// Center hub (e.g., Dushanbe/Tashkent region or just generic Central Asia)
const HUB = { lat: 38.5, lng: 68.8, name: "SoftClub HQ", color: "white" };

// Destinations
const DESTINATIONS = [
  { lat: 40.7128, lng: -74.0060, name: "New York", color: "red" },
  { lat: 51.5074, lng: -0.1278, name: "London", color: "blue" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo", color: "orange" },
  { lat: 55.7558, lng: 37.6173, name: "Moscow", color: "red" },
  { lat: 25.2048, lng: 55.2708, name: "Dubai", color: "gold" },
  { lat: 1.3521, lng: 103.8198, name: "Singapore", color: "cyan" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney", color: "lime" },
  { lat: 48.8566, lng: 2.3522, name: "Paris", color: "pink" },
  { lat: 52.5200, lng: 13.4050, name: "Berlin", color: "yellow" },
];

const arcsData = DESTINATIONS.map((dest) => ({
  startLat: HUB.lat,
  startLng: HUB.lng,
  endLat: dest.lat,
  endLng: dest.lng,
  color: [HUB.color, dest.color],
}));

const ringsData = [HUB, ...DESTINATIONS].map((d) => ({
  lat: d.lat,
  lng: d.lng,
  maxR: 5,
  propagationSpeed: 2,
  repeatPeriod: 1000,
  color: d.color, 
}));

export default function EventsGlobe() {
  const globeEl = useRef();
  const { phase } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();

  useEffect(() => {
    // Auto-rotate
    if (globeEl.current) {
        globeEl.current.controls().autoRotate = true;
        globeEl.current.controls().autoRotateSpeed = 0.8;
        // set initial POV
        globeEl.current.pointOfView({ lat: 30, lng: 40, altitude: 2.5 });
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const globeConfig = useMemo(() => {
    const isNight = phase === "night" || phase === "evening";
    return {
        globeImageUrl: isNight 
            ? "//unpkg.com/three-globe/example/img/earth-night.jpg" 
            : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
        backgroundColor: "rgba(0,0,0,0)",
        atmosphereColor: isNight ? "#4f46e5" : "#0ea5e9",
    };
  }, [phase]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[400px] flex items-center justify-center relative overflow-hidden rounded-3xl">
       {dimensions.width > 0 && (
         <Globe
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            
            globeImageUrl={globeConfig.globeImageUrl}
            backgroundColor={globeConfig.backgroundColor}
            atmosphereColor={globeConfig.atmosphereColor}
            atmosphereAltitude={0.15}

            // Arcs
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcStroke={0.5}

            // Rings
            ringsData={ringsData}
            ringColor={(t) => (t > 0.5 ? `rgba(255,255,255,${1-t})` : `rgba(255,255,255,${t})`)} // varying opacity
            ringMaxRadius="maxR"
            ringPropagationSpeed="propagationSpeed"
            ringRepeatPeriod="repeatPeriod"

            // Labels
            labelsData={[HUB, ...DESTINATIONS]}
            labelLat="lat"
            labelLng="lng"
            labelText="name"
            labelSize={1.5}
            labelDotRadius={0.5}
            labelColor={() => "rgba(255, 255, 255, 0.75)"}
            labelResolution={2}
         />
       )}
       <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
    </div>
  );
}
