import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";

interface AppMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: any[];
  onPress?: (e: any) => void;
  style?: any;
}

export default function AppMap({
  region,
  markers = [],
  onPress,
  style,
}: AppMapProps) {
  const [LeafletMap, setLeafletMap] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // We strictly check for window to ensure smooth Static Rendering (SSR)
    if (typeof window !== "undefined") {
      // 1. Dynamically inject the CSS to avoid metro bundler CSS issues
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Dynamically import React-Leaflet and Leaflet to bypass Node SSR environment
      Promise.all([import("react-leaflet"), import("leaflet")])
        .then(([RL, L]) => {
          // Fix for Leaflet's notorious missing default marker images on bundlers
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          });
          setLeafletMap(RL);
        })
        .catch((err) => {
          console.error("Leaflet load error:", err);
          setError(true);
        });
    }
  }, []);

  if (error) {
    return (
      <View style={[style || StyleSheet.absoluteFill, styles.webContainer]}>
        <Text style={styles.webTitle}>Map Failed to Load</Text>
        <Text style={styles.webText}>
          Please run: npm install leaflet react-leaflet
        </Text>
      </View>
    );
  }

  if (!LeafletMap) {
    return (
      <View style={[style || StyleSheet.absoluteFill, styles.webContainer]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ color: "#9CA3AF", marginTop: 12 }}>
          Loading Web Map...
        </Text>
      </View>
    );
  }

  // Destructure after dynamic load
  const { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } =
    LeafletMap;

  // Handles click events on the map and maps it back to Native syntax
  const MapEvents = () => {
    useMapEvents({
      click(e: any) {
        if (onPress) {
          onPress({
            nativeEvent: {
              coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng },
            },
          });
        }
      },
    });
    return null;
  };

  // Makes the map dynamically react and fly to new coordinates
  const MapController = ({
    center,
    zoom,
  }: {
    center: [number, number];
    zoom: number;
  }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center[0], center[1], zoom]);
    return null;
  };

  const center: [number, number] = region
    ? [region.latitude, region.longitude]
    : [27.7172, 85.324];

  // Calculate Map zoom dynamically derived from latitudeDelta
  const zoom = region?.latitudeDelta
    ? Math.max(
        1,
        Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta))),
      )
    : 14;

  return (
    <View style={style || StyleSheet.absoluteFill}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        <MapEvents />

        {markers.map((m: any, i: number) => {
          if (!m.latitude || !m.longitude) return null;

          return (
            <Marker key={m.id || i} position={[m.latitude, m.longitude]}>
              {(m.title || m.description) && (
                <Popup>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.onCalloutPress) m.onCalloutPress();
                    }}
                    style={{
                      cursor: m.onCalloutPress ? "pointer" : "default",
                      minWidth: 160,
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: 15,
                        marginBottom: 6,
                        color: "#111827",
                      }}
                    >
                      {m.title}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 13, color: "#4B5563" }}>
                        {m.description}
                      </div>
                    )}

                    {m.onCalloutPress && (
                      <div
                        style={{
                          marginTop: 14,
                          color: "#059669",
                          fontSize: 14,
                          fontWeight: "900",
                          textAlign: "center",
                          padding: "12px 16px", // Standard CSS padding for HTML div
                          backgroundColor: "#ECFDF5",
                          borderRadius: 8,
                          border: "1px solid #A7F3D0",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        Select / Book
                      </div>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  webText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 300,
  },
});
