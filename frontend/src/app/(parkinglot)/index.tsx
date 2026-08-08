import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import AppMap from "../../components/AppMap";
import { Ionicons } from "@expo/vector-icons";

type TabTypes =
  | "slots"
  | "location"
  | "bookings"
  | "vehicles"
  | "earnings"
  | "settings";

export default function ParkingLotDashboard() {
  const router = useRouter();
  const { signOut, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabTypes>("slots");

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Forms & Modals
  const [slotsForm, setSlotsForm] = useState({
    car_slots: "0",
    bike_slots: "0",
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationModal, setLocationModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const triggerAlert = (title: string, msg: string) => {
    Platform.OS === "web" ? alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSlotsForm({
          car_slots: data.car_slots.toString(),
          bike_slots: data.bike_slots.toString(),
        });

        if (data.latitude && data.longitude) {
          setMapRegion({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setTempLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          setLocationModal(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/bookings`, {
        headers: getHeaders(),
      });
      if (res.ok) setBookings(await res.json());
    } catch (e) {}
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/sessions`, {
        headers: getHeaders(),
      });
      if (res.ok) setSessions(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchProfile();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "bookings") fetchBookings();
    if (activeTab === "vehicles" || activeTab === "earnings") fetchSessions();
  }, [activeTab]);

  const toggleStatus = async (val: boolean) => {
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ is_open: val }),
      });
      if (res.ok) setProfile({ ...profile, is_open: val });
    } catch (e) {}
  };

  const updateSlots = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/slots`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          car_slots: parseInt(slotsForm.car_slots),
          bike_slots: parseInt(slotsForm.bike_slots),
        }),
      });
      if (!res.ok) throw new Error("Update Failed");
      triggerAlert("Success", "Parking slots availability updated.");
      fetchProfile();
    } catch (e: any) {
      triggerAlert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const saveLocation = async () => {
    if (!tempLocation)
      return triggerAlert("Notice", "Please pin a location on the map.");
    setUpdating(true);
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/location`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      triggerAlert("Success", "Business location successfully registered.");
      setLocationModal(false);
      fetchProfile();
    } catch (e: any) {
      triggerAlert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword)
      return triggerAlert("Error", "Fields required");
    setUpdating(true);
    try {
      const res = await fetch(`${baseUrl}/parkinglot/me/password`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(pwdForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      triggerAlert("Success", "Password updated successfully.");
      setPwdForm({ oldPassword: "", newPassword: "" });
    } catch (e: any) {
      triggerAlert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const obfuscatePhone = (phone: string) => {
    if (!phone) return "";
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );

  return (
    <View style={styles.layout}>
      {/* Location Enforcement Modal */}
      <Modal visible={locationModal} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.cardHeader}>Pinpoint Business Location</Text>
          <Text style={styles.cardDesc}>
            Users need exact coordinates to navigate and book spaces.
          </Text>
          <View style={styles.mapContainer}>
            <AppMap
              region={mapRegion}
              markers={
                tempLocation
                  ? [
                      {
                        latitude: tempLocation.latitude,
                        longitude: tempLocation.longitude,
                        title: "Your Location",
                      },
                    ]
                  : []
              }
              onPress={(e: any) => setTempLocation(e.nativeEvent.coordinate)}
            />
          </View>
          <TouchableOpacity
            onPress={saveLocation}
            disabled={updating}
            style={styles.actionBtnBlock}
          >
            <Text style={styles.actionText}>
              {updating ? "SAVING..." : "SAVE COORDINATES"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Sidebar Navigation */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>
            {profile?.business_name || "Franchise"}
          </Text>
          <Text style={styles.sidebarSubtitle}>Lot Control Panel</Text>
        </View>
        <ScrollView style={styles.navMenu}>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "slots" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("slots")}
          >
            <Ionicons
              name="car-outline"
              size={20}
              color={activeTab === "slots" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "slots" && styles.navTextActive,
              ]}
            >
              Slot Management
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "location" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("location")}
          >
            <Ionicons
              name="map-outline"
              size={20}
              color={activeTab === "location" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "location" && styles.navTextActive,
              ]}
            >
              Location Setup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "bookings" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("bookings")}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={activeTab === "bookings" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "bookings" && styles.navTextActive,
              ]}
            >
              Live Bookings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "vehicles" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("vehicles")}
          >
            <Ionicons
              name="speedometer-outline"
              size={20}
              color={activeTab === "vehicles" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "vehicles" && styles.navTextActive,
              ]}
            >
              Vehicle Logic
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "earnings" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("earnings")}
          >
            <Ionicons
              name="cash-outline"
              size={20}
              color={activeTab === "earnings" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "earnings" && styles.navTextActive,
              ]}
            >
              Gross Earnings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "settings" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("settings")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={activeTab === "settings" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === "settings" && styles.navTextActive,
              ]}
            >
              Account Settings
            </Text>
          </TouchableOpacity>

          {/* QR Scanner Hardware Simulator Button */}
          <View
            style={{
              borderTopWidth: 1,
              borderColor: "#E5E7EB",
              marginVertical: 15,
            }}
          />
          <TouchableOpacity
            style={[styles.navItem, { backgroundColor: "#111827" }]}
            onPress={() => router.push("/(parkinglot)/camera")}
          >
            <Ionicons name="scan-outline" size={20} color="#FFF" />
            <Text style={[styles.navText, { color: "#FFF" }]}>
              Launch QR Scanner
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Workspace */}
      <View style={styles.mainContent}>
        <View style={styles.topHeader}>
          <Text style={styles.greetingText}>
            Welcome, {profile?.owner_name}
          </Text>
          <View style={styles.toggleContainer}>
            <Text
              style={[
                styles.statusText,
                { color: profile?.is_open ? "#059669" : "#DC2626" },
              ]}
            >
              {profile?.is_open ? "GATE OPEN" : "GATE CLOSED"}
            </Text>
            <Switch
              trackColor={{ false: "#FCA5A5", true: "#6EE7B7" }}
              thumbColor={profile?.is_open ? "#059669" : "#DC2626"}
              ios_backgroundColor="#FCA5A5"
              onValueChange={toggleStatus}
              value={profile?.is_open}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 40, paddingBottom: 120 }}>
          {activeTab === "slots" && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Slot Inventory</Text>
              <Text style={styles.cardDesc}>
                Define the maximum available physical capacity for this parking
                hub.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Car Parking Spots</Text>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={slotsForm.car_slots}
                  onChangeText={(t) =>
                    setSlotsForm({ ...slotsForm, car_slots: t })
                  }
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Bike Parking Spots</Text>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={slotsForm.bike_slots}
                  onChangeText={(t) =>
                    setSlotsForm({ ...slotsForm, bike_slots: t })
                  }
                />
              </View>
              <TouchableOpacity
                onPress={updateSlots}
                disabled={updating}
                style={styles.actionBtnBlock}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionText}>SAVE INVENTORY</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "location" && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Location Management</Text>
              <Text style={styles.cardDesc}>
                Map your parking lot to a precise geographical coordinate.
              </Text>
              <View style={styles.mapContainerInline}>
                <AppMap
                  region={mapRegion}
                  markers={
                    tempLocation
                      ? [
                          {
                            latitude: tempLocation.latitude,
                            longitude: tempLocation.longitude,
                            title: "Your Location",
                          },
                        ]
                      : []
                  }
                  onPress={(e: any) =>
                    setTempLocation(e.nativeEvent.coordinate)
                  }
                />
              </View>
              <TouchableOpacity
                onPress={saveLocation}
                disabled={updating}
                style={styles.actionBtnBlock}
              >
                <Text style={styles.actionText}>UPDATE MAP PINS</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "bookings" && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Live Active Bookings</Text>
              <Text style={styles.cardDesc}>
                Users who have currently reserved spots in your lot via the
                mobile app.
              </Text>
              {bookings.length === 0 ? (
                <Text style={{ color: "#6B7280", padding: 20 }}>
                  No active bookings at the moment.
                </Text>
              ) : (
                bookings.map((b, i) => (
                  <View key={i} style={styles.tableRow}>
                    <View>
                      <Text style={styles.rowTitle}>
                        {b.customer_name} •{" "}
                        <Text
                          style={{
                            textTransform: "uppercase",
                            color: "#059669",
                          }}
                        >
                          {b.vehicle_type}
                        </Text>
                      </Text>
                      <Text style={styles.rowSubText}>{b.customer_phone}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        NPR {b.price.toFixed(2)}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}
                      >
                        For {b.hours} Hrs
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "vehicles" && (
            <View style={styles.card}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeader}>Gate Access & Sessions</Text>
                  <Text style={styles.cardDesc}>
                    Live hardware logs triggered by card taps or QR scans at the
                    gate.
                  </Text>
                </View>

                <View style={styles.liveSlotsBadge}>
                  <Text style={styles.liveSlotsLabel}>
                    LIVE AVAILABLE SLOTS
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={styles.liveSlotsText}>
                      🚗 {profile?.car_slots}
                    </Text>
                    <Text style={styles.liveSlotsText}>
                      🏍️ {profile?.bike_slots}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tableContainer}>
                <View style={[styles.tableRow, { backgroundColor: "#F9FAFB" }]}>
                  <Text style={[styles.rowHeader, { flex: 2 }]}>Customer</Text>
                  <Text style={[styles.rowHeader, { flex: 2 }]}>
                    Access Key
                  </Text>
                  <Text style={[styles.rowHeader, { flex: 2 }]}>
                    Entry Time
                  </Text>
                  <Text style={[styles.rowHeader, { flex: 2 }]}>Exit Time</Text>
                  <Text style={[styles.rowHeader, { flex: 1 }]}>Status</Text>
                </View>

                {sessions.length === 0 ? (
                  <Text style={{ padding: 20, color: "#6B7280" }}>
                    No physical gate activity logged yet.
                  </Text>
                ) : (
                  sessions.map((s, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text
                        style={[styles.rowText, { flex: 2, fontWeight: "700" }]}
                      >
                        {s.customer_name}
                      </Text>
                      <View style={{ flex: 2 }}>
                        <Text
                          style={[
                            styles.rowText,
                            { fontFamily: "monospace", fontSize: 12 },
                          ]}
                        >
                          {s.access_key}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#059669",
                            fontWeight: "bold",
                            marginTop: 2,
                          }}
                        >
                          VIA {s.access_method}
                        </Text>
                      </View>
                      <Text style={[styles.rowText, { flex: 2 }]}>
                        {new Date(s.entry_time).toLocaleString()}
                      </Text>
                      <Text style={[styles.rowText, { flex: 2 }]}>
                        {s.exit_time
                          ? new Date(s.exit_time).toLocaleString()
                          : "-"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.statusBadge,
                            s.status === "PARKED"
                              ? styles.badgeActive
                              : styles.badgeComplete,
                          ]}
                        >
                          {s.status}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {activeTab === "earnings" && (
            <View style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: "#111827", borderColor: "#111827" },
                ]}
              >
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 14,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Gross Revenue Collected
                </Text>
                <Text
                  style={{
                    color: "#10B981",
                    fontSize: 48,
                    fontWeight: "900",
                    marginTop: 10,
                  }}
                >
                  NPR {profile?.total_earnings?.toFixed(2) || "0.00"}
                </Text>
                <Text style={{ color: "#6B7280", marginTop: 10, fontSize: 13 }}>
                  Rate: 10 Credits (NPR) per Hour automatically charged on gate
                  exit.
                </Text>
              </View>
              <View style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.cardHeader}>Completed Payments</Text>
                <Text style={styles.cardDesc}>
                  Recent sessions paid and closed at the exit gate.
                </Text>
                {sessions.filter((s) => s.status === "COMPLETED").length ===
                0 ? (
                  <Text style={{ color: "#6B7280", padding: 10 }}>
                    No completed sessions recorded yet.
                  </Text>
                ) : (
                  sessions
                    .filter((s) => s.status === "COMPLETED")
                    .map((s, i) => (
                      <View key={i} style={styles.tableRow}>
                        <View>
                          <Text style={styles.rowTitle}>{s.customer_name}</Text>
                          <Text style={styles.rowSubText}>
                            {new Date(s.exit_time).toLocaleString()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "900",
                            color: "#059669",
                          }}
                        >
                          + NPR {s.total_cost.toFixed(2)}
                        </Text>
                      </View>
                    ))
                )}
              </View>
            </View>
          )}

          {activeTab === "settings" && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Account Configuration</Text>
              <Text style={styles.cardDesc}>
                Manage your sensitive credentials and business information.
              </Text>
              <View style={styles.readOnlyBlock}>
                <Text style={styles.label}>Owner Full Name</Text>
                <Text style={styles.readOnlyText}>{profile?.owner_name}</Text>
              </View>
              <View style={styles.readOnlyBlock}>
                <Text style={styles.label}>Registered Phone</Text>
                <Text style={styles.readOnlyText}>
                  {obfuscatePhone(profile?.owner_phone)}
                </Text>
              </View>
              <View style={[styles.inputGroup, { marginTop: 20 }]}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.inputField}
                  secureTextEntry
                  value={pwdForm.oldPassword}
                  onChangeText={(t) =>
                    setPwdForm({ ...pwdForm, oldPassword: t })
                  }
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.inputField}
                  secureTextEntry
                  value={pwdForm.newPassword}
                  onChangeText={(t) =>
                    setPwdForm({ ...pwdForm, newPassword: t })
                  }
                />
              </View>
              <TouchableOpacity
                onPress={changePassword}
                disabled={updating}
                style={[
                  styles.actionBtnBlock,
                  { backgroundColor: "#111827", shadowColor: "#000" },
                ]}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionText}>UPDATE SECURITY</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  layout: {
    flex: 1,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    backgroundColor: "#F3F4F6",
  },
  sidebar: {
    width: Platform.OS === "web" ? 280 : "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 40,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    zIndex: 100,
  },
  sidebarHeader: { marginBottom: 40 },
  sidebarTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sidebarSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  navMenu: { flex: 1 },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navItemActive: { backgroundColor: "#ECFDF5" },
  navText: { color: "#4B5563", fontSize: 15, fontWeight: "600" },
  navTextActive: { color: "#059669", fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
  mainContent: { flex: 1, zIndex: 1 },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  greetingText: { fontSize: 20, fontWeight: "800", color: "#111827" },
  toggleContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusText: { fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 35,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  cardDesc: {
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 30,
    fontSize: 15,
    lineHeight: 22,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#F9FAFB",
    fontSize: 15,
    color: "#1F2937",
  },
  actionBtnBlock: {
    backgroundColor: "#059669",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    color: "#FFF",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 40,
    justifyContent: "center",
  },
  mapContainer: {
    width: "100%",
    height: 400,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    backgroundColor: "#111827",
  },
  mapContainerInline: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    backgroundColor: "#111827",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  rowText: { fontSize: 14, color: "#1F2937" },
  rowTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  rowSubText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  readOnlyBlock: { marginBottom: 15 },
  readOnlyText: { fontSize: 16, color: "#111827", fontWeight: "600" },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeActive: { backgroundColor: "#FEF3C7", color: "#D97706" },
  badgeComplete: { backgroundColor: "#D1FAE5", color: "#059669" },
  liveSlotsBadge: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  liveSlotsLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  liveSlotsText: { color: "#10B981", fontSize: 20, fontWeight: "900" },
});
