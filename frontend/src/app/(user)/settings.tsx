import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "./_layout";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { signOut, token } = useAuth();
  const { profile } = useUserProfile();

  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";

  // Security Obfuscation Utilities
  const obfuscateEmail = (email: string) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    return `${name.charAt(0)}${"*".repeat(name.length - 1)}@${domain}`;
  };

  const obfuscatePhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace("+977", ""); // Stripping code locally
    return `+977 ${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
  };

  const triggerAlert = (title: string, msg: string) => {
    Platform.OS === "web" ? alert(`${title}: ${msg}`) : Alert.alert(title, msg);
  };

  const handleUpdatePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword)
      return triggerAlert("Error", "All fields are required.");
    if (pwdForm.newPassword !== pwdForm.confirmPassword)
      return triggerAlert("Error", "New passwords do not match.");
    if (pwdForm.newPassword.length < 8)
      return triggerAlert("Error", "Password must be at least 8 characters.");

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: pwdForm.oldPassword,
          new_password: pwdForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");

      triggerAlert("Success", "Password updated securely.");
      setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      triggerAlert("Update Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <View>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{profile?.full_name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#6B7280" />
          <View>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>
              {obfuscateEmail(profile?.email || "")}
            </Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="call-outline" size={20} color="#6B7280" />
          <View>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>
              {obfuscatePhone(profile?.phone || "")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security & Credentials</Text>

        <Text style={styles.inputLabel}>Current Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdForm.oldPassword}
          onChangeText={(t) => setPwdForm({ ...pwdForm, oldPassword: t })}
          placeholder="••••••••"
        />

        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdForm.newPassword}
          onChangeText={(t) => setPwdForm({ ...pwdForm, newPassword: t })}
          placeholder="••••••••"
        />

        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={pwdForm.confirmPassword}
          onChangeText={(t) => setPwdForm({ ...pwdForm, confirmPassword: t })}
          placeholder="••••••••"
        />

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out Securely</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 24 },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
  },
  updateBtn: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  updateBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    gap: 8,
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
