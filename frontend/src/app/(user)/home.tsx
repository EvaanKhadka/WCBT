import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useUserProfile } from "./_layout";
import { useAuth } from "../../context/AuthContext";
import AppMap from "../../components/AppMap";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { profile, refreshProfile } = useUserProfile();

  const [location, setLocation] = useState<any>(null);
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  // Booking Modals
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [vType, setVType] = useState<"car" | "bike">("car");
  const [hours, setHours] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // My Bookings Log
  const [bookingsModal, setBookingsModal] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  const triggerAlert = (title: string, msg: string) => {
    Platform.OS === "web" ? alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const loadAppData = async () => {
    try {
      if (Platform.OS !== "web") {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            },
            (error) => {
              setLocation({
                latitude: 27.7172,
                longitude: 85.324,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else {
          setLocation({
            latitude: 27.7172,
            longitude: 85.324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }

      const res = await fetch(`${baseUrl}/auth/parkinglots/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setParkingLots(await res.json());
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingLoc(false);
    }
  };

  const fetchMyBookings = async () => {
    setLoadingLog(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyBookings(await res.json());
    } catch (e) {
    } finally {
      setLoadingLog(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  const calcPrice = () => hours * (vType === "car" ? 10 : 4);

  const confirmBooking = async () => {
    if (!selectedLot) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parking_lot_id: selectedLot.id,
          vehicle_type: vType,
          hours: hours,
          price: calcPrice(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      triggerAlert("Confirmed", data.message);
      setSelectedLot(null);
      await loadAppData();
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Booking Failed", e.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBooking = async (id: number) => {
    const confirmCancel =
      Platform.OS === "web"
        ? window.confirm(
            "Cancel booking? You will incur a 30% penalty deduction fee.",
          )
        : true;

    if (confirmCancel) {
      try {
        const res = await fetch(`${baseUrl}/auth/me/bookings/${id}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        triggerAlert("Cancelled", data.message);

        fetchMyBookings();
        refreshProfile();
        loadAppData();
      } catch (e: any) {
        triggerAlert("Error", e.message);
      }
    }
  };

  if (loadingLoc)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );

  const mapMarkers = [
    ...(location
      ? [
          {
            latitude: location.latitude,
            longitude: location.longitude,
            title: "You are here",
            pinColor: "blue",
          },
        ]
      : []),
    ...parkingLots.map((lot) => ({
      id: lot.id,
      latitude: lot.latitude,
      longitude: lot.longitude,
      title: lot.business_name,
      description: `Available Slots -> Cars: ${lot.car_slots} | Bikes: ${lot.bike_slots}`,
      pinColor: "#EF4444",
      onCalloutPress: () => setSelectedLot(lot),
    })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerStack}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            {/* <Text style={styles.greetText}></Text> */}
            <Text style={styles.subtitle}>
              Locate open hubs and reserve spots instantly.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logIconBtn}
            onPress={() => {
              setBookingsModal(true);
              fetchMyBookings();
            }}
          >
            <Ionicons name="receipt" size={24} color="#111827" />
            <Text style={styles.logText}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapFrame}>
        <AppMap
          region={
            location || {
              latitude: 27.7172,
              longitude: 85.324,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }
          }
          markers={mapMarkers}
        />
      </View>

      <br />
      {/* Booking Overlay Modal */}
      <Modal visible={!!selectedLot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedLot?.business_name}</Text>
            <Text style={styles.modalSubText}>
              Secure your spot immediately before arriving.
            </Text>

            <Text style={styles.label}>Select Vehicle</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.selectBtn,
                  vType === "car" && styles.selectBtnActive,
                ]}
                onPress={() => setVType("car")}
              >
                <Ionicons
                  name="car-sport"
                  size={20}
                  color={vType === "car" ? "#FFF" : "#4B5563"}
                />
                <Text
                  style={[
                    styles.selectBtnText,
                    vType === "car" && { color: "#FFF" },
                  ]}
                >
                  Car
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectBtn,
                  vType === "bike" && styles.selectBtnActive,
                ]}
                onPress={() => setVType("bike")}
              >
                <Ionicons
                  name="bicycle"
                  size={20}
                  color={vType === "bike" ? "#FFF" : "#4B5563"}
                />
                <Text
                  style={[
                    styles.selectBtnText,
                    vType === "bike" && { color: "#FFF" },
                  ]}
                >
                  Bike
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Reservation Time (Hours)</Text>
            <View style={styles.btnRow}>
              {[1, 2, 3, 4].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourBtn, hours === h && styles.hourBtnActive]}
                  onPress={() => setHours(h)}
                >
                  <Text
                    style={[styles.hourText, hours === h && { color: "#FFF" }]}
                  >
                    {h}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.priceStrip}>
              <Text style={styles.priceLabel}>Total Deduction:</Text>
              <Text style={styles.priceValue}>${calcPrice().toFixed(2)}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedLot(null)}
                disabled={bookingLoading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmText}>Book Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Bookings Log Modal */}
      <Modal visible={bookingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "85%" }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <Text style={styles.modalTitle}>Your Book Log</Text>
              <TouchableOpacity onPress={() => setBookingsModal(false)}>
                <Ionicons name="close" size={28} color="#111827" />
              </TouchableOpacity>
            </View>

            {loadingLog ? (
              <ActivityIndicator
                size="large"
                color="#111827"
                style={{ marginTop: 40 }}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {myBookings.length === 0 ? (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#6B7280",
                      marginTop: 30,
                    }}
                  >
                    You have no recorded bookings.
                  </Text>
                ) : (
                  myBookings.map((b, i) => (
                    <View key={i} style={styles.bookingCard}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <Text style={styles.bookingTitle}>
                            {b.business_name}
                          </Text>
                          <Text style={styles.bookingSubText}>
                            {new Date(b.created_at).toLocaleString()}
                          </Text>
                          <Text
                            style={{
                              marginTop: 6,
                              fontWeight: "700",
                              color: "#374151",
                              textTransform: "uppercase",
                            }}
                          >
                            {b.vehicle_type} - {b.hours} Hrs
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={[
                              styles.badge,
                              b.status === "ACTIVE"
                                ? styles.badgeActive
                                : b.status === "CANCELLED"
                                  ? styles.badgeCancelled
                                  : styles.badgeFulfilled,
                            ]}
                          >
                            {b.status}
                          </Text>
                          <Text
                            style={{
                              marginTop: 10,
                              fontWeight: "900",
                              fontSize: 18,
                              color: "#059669",
                            }}
                          >
                            ${b.price.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {b.status === "ACTIVE" && (
                        <TouchableOpacity
                          style={styles.deleteBookingBtn}
                          onPress={() => cancelBooking(b.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#DC2626"
                          />
                          <Text style={styles.deleteBookingText}>
                            Cancel (30% Penalty)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerStack: { padding: 24, paddingBottom: 16 },
  greetText: { fontSize: 24, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4, maxWidth: 250 },
  logIconBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#111827",
    marginTop: 2,
  },
  mapFrame: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 50,
  },
  modalTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  modalSubText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  btnRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  selectBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
  },
  selectBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  selectBtnText: { fontWeight: "700", color: "#4B5563" },
  hourBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
  },
  hourBtnActive: { backgroundColor: "#059669", borderColor: "#059669" },
  hourText: { fontWeight: "700", color: "#4B5563", fontSize: 15 },
  priceStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 24,
  },
  priceLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  priceValue: { fontSize: 24, fontWeight: "900", color: "#059669" },
  actionRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: { fontWeight: "700", color: "#4B5563", fontSize: 16 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  confirmText: { fontWeight: "700", color: "#FFF", fontSize: 16 },

  bookingCard: {
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  bookingTitle: { fontSize: 17, fontWeight: "800", color: "#1F2937" },
  bookingSubText: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeActive: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  badgeCancelled: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  badgeFulfilled: { backgroundColor: "#D1FAE5", color: "#065F46" },
  deleteBookingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  deleteBookingText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
});
