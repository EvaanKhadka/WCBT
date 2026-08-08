import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function CameraScannerScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parkingLotId, setParkingLotId] = useState<number | null>(null);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  // Bootstrap Profile fetch to extract ID required for Gate API endpoint
  useEffect(() => {
    const fetchLotIdentity = async () => {
      try {
        const res = await fetch(`${baseUrl}/parkinglot/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setParkingLotId(data.id);
        }
      } catch (e) {
        Alert.alert(
          "Initialization Error",
          "Could not verify hardware endpoint ownership.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchLotIdentity();
  }, [token]);

  if (!permission) {
    return <View style={styles.container} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera" size={80} color="#D1D5DB" />
        <Text style={styles.titleText}>Camera Permission Required</Text>
        <Text style={styles.subText}>
          The gate scanner requires access to the camera system to read user QR
          access tags.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.back()}
        >
          <Text style={styles.btnSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);

    if (!parkingLotId) {
      Alert.alert("System Error", "Parking lot unverified.");
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/parkinglot/hardware/qr-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_key: data, parking_lot_id: parkingLotId }),
      });
      const resData = await res.json();

      if (res.ok && resData.action === "open_gate") {
        Alert.alert("SUCCESS ✔️", resData.message);
      } else {
        Alert.alert(
          "REJECTED ❌",
          resData.message || "Unknown error processing code.",
        );
      }
    } catch (e) {
      Alert.alert(
        "NETWORK ERROR",
        "Unable to establish contact with the gateway server.",
      );
    }

    // Automatically reset scanning loop mechanism after 3 seconds
    setTimeout(() => {
      setScanned(false);
    }, 3000);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* UI Overlay to look like a high-tech terminal */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.scannerFrame}>
          {scanned && (
            <View style={styles.processingBadge}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.processingText}>
                Processing Authorization...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footerPanel}>
          <Ionicons name="qr-code-outline" size={24} color="#10B981" />
          <Text style={styles.footerTitle}>Live Gate Scanner Active</Text>
          <Text style={styles.footerSub}>
            Align the user's digital pass within the frame to authorize
            automatic gate barriers.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 20,
  },
  subText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  btnSecondary: { paddingVertical: 16, marginTop: 10 },
  btnSecondaryText: { color: "#6B7280", fontWeight: "700" },

  overlay: { flex: 1, justifyContent: "space-between", padding: 30 },
  backBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  scannerFrame: { flex: 1, justifyContent: "center", alignItems: "center" },

  processingBadge: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  processingText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  footerPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 0,
  },
  footerTitle: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 10,
  },
  footerSub: {
    color: "#D1D5DB",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
