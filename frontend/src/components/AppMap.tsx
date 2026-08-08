import React from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";

interface MarkerData {
  id?: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  pinColor?: string;
  onCalloutPress?: () => void;
}

interface AppMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: MarkerData[];
  onPress?: (e: any) => void;
  style?: any;
}

export default function AppMap({
  region,
  markers = [],
  onPress,
  style,
}: AppMapProps) {
  return (
    <MapView
      style={style || StyleSheet.absoluteFill}
      region={region}
      onPress={onPress}
    >
      {markers.map((m, i) => (
        <Marker
          key={m.id || i}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          description={m.description}
          pinColor={m.pinColor}
          onCalloutPress={m.onCalloutPress}
        />
      ))}
    </MapView>
  );
}
