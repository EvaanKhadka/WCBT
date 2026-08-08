import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserProfile } from "../app/(user)/_layout";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { profile, refreshProfile } = useUserProfile();
  const { token } = useAuth();

  const firstName = profile?.full_name?.split(" ")[0] || "User";
  const balance = profile?.credit_balance?.toFixed(2) || "0.00";

  const [topupVisible, setTopupVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  const triggerAlert = (title: string, message: string) => {
    Platform.OS === "web"
      ? alert(`${title}: ${message}`)
      : Alert.alert(title, message);
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return triggerAlert("Error", "Please enter a valid positive amount.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/credits/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Top up failed.");

      triggerAlert("Success", data.message);
      setTopupVisible(false);
      setAmount("");
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>Hello, {firstName}</Text>
      </View>

      <View style={styles.creditsContainer}>
        <View style={styles.balanceBadge}>
          <Ionicons name="wallet-outline" size={16} color="#059669" />
          <Text style={styles.balanceText}>${balance}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setTopupVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Top Up Overlay Modal */}
      <Modal visible={topupVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Balance</Text>
            <Text style={styles.modalSubText}>
              Add credits directly to your account & connected cards.
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount (e.g. 20)"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setTopupVisible(false);
                  setAmount("");
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTopUp}
                style={styles.confirmBtn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Add Credits</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    zIndex: 10,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  creditsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  addBtn: {
    backgroundColor: "#111827",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    maxWidth: 360,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  modalSubText: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
    color: "#111827",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: { color: "#4B5563", fontWeight: "700", fontSize: 14 },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#111827",
    minWidth: 110,
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
