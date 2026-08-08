import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserProfile } from "./_layout";
import { useAuth } from "../../context/AuthContext";
import * as Linking from "expo-linking";

// (Abbreviated NEPAL_DATA mapping kept exactly same to comply)
const NEPAL_DATA: Record<string, Record<string, string[]>> = {
  Koshi: {
    Bhojpur: ["Bhojpur", "Shadanand"],
    Dhankuta: ["Dhankuta", "Pakhribas", "Mahalaxmi"],
    Ilam: ["Ilam", "Deumai", "Mai", "Suryodaya"],
    Jhapa: ["Birtamode", "Bhadrapur", "Damak", "Kakarbhitta", "Mechinagar"],
    Morang: ["Biratnagar", "Urlabari", "Belbari"],
    Sunsari: ["Dharan", "Itahari", "Inaruwa"],
  },
  Bagmati: {
    Kathmandu: ["Kathmandu", "Kirtipur", "Budhanilkantha"],
    Lalitpur: ["Lalitpur", "Godawari"],
    Bhaktapur: ["Bhaktapur", "Madhyapur Thimi"],
    Chitwan: ["Bharatpur", "Ratnanagar"],
  },
  Gandaki: {
    Kaski: ["Pokhara"],
    Tanahun: ["Vyas (Damauli)", "Bhanu"],
  },
  Lumbini: {
    Rupandehi: ["Butwal", "Siddharthanagar", "Tillotama"],
    Banke: ["Nepalgunj", "Kohalpur"],
    Dang: ["Ghorahi", "Tulsipur"],
  },
};

const CustomDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
  zIndexVal,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.inputStack, { zIndex: zIndexVal }]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownToggle}
        activeOpacity={0.9}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={{ color: value ? "#111827" : "#9CA3AF", fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 200 }}
          >
            {options.length > 0 ? (
              options.map((opt: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                >
                  <Text style={{ color: "#374151", fontSize: 15 }}>{opt}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ padding: 15, color: "#9CA3AF" }}>
                Select previous field
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function CardRequestScreen() {
  const { profile, refreshProfile } = useUserProfile();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"RFID" | "QR">("RFID");

  const [loading, setLoading] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);

  const [cardInput, setCardInput] = useState("");
  const [verifiedCard, setVerifiedCard] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const [form, setForm] = useState({
    name: profile?.full_name || "",
    phoneCode: "+977",
    phone: profile?.phone.replace("+977", "") || "",
    province: "",
    district: "",
    city: "",
    street: "",
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, district: "", city: "" }));
  }, [form.province]);
  useEffect(() => {
    setForm((prev) => ({ ...prev, city: "" }));
  }, [form.district]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const text = cardInput.trim();
      if (text.length >= 8) {
        setIsVerifying(true);
        try {
          const res = await fetch(`${baseUrl}/auth/me/cards/verify`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ card_key: text }),
          });
          const data = await res.json();
          if (res.ok && data.valid) setVerifiedCard(data.card_key);
          else setVerifiedCard(null);
        } catch (e) {
          setVerifiedCard(null);
        } finally {
          setIsVerifying(false);
        }
      } else {
        setVerifiedCard(null);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [cardInput]);

  const triggerAlert = (title: string, message: string) => {
    Platform.OS === "web"
      ? alert(`${title}: ${message}`)
      : Alert.alert(title, message);
  };

  const loadQR = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`${baseUrl}/credits/qr/me`, {
        headers: getHeaders(),
      });
      if (res.ok) setQrData(await res.json());
      else setQrData(null);
    } catch (e) {
      setQrData(null);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "QR") loadQR();
  }, [activeTab]);

  const generateQRCode = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`${baseUrl}/credits/qr/generate`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (res.ok) {
        setQrData(await res.json());
        triggerAlert("Success", "Digital QR Generated successfully.");
      }
    } catch (e) {
      triggerAlert("Error", "Could not generate QR Code.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    /* Standard Form logic */
    if (
      !form.name ||
      !form.phone ||
      !form.province ||
      !form.district ||
      !form.city ||
      !form.street
    ) {
      return triggerAlert("Error", "Please fill in all location details.");
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          owner_name: form.name,
          phone_with_code: `${form.phoneCode}${form.phone}`,
          province: form.province,
          district: form.district,
          city: form.city,
          street_name: form.street,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      triggerAlert("Success", "RFID Card Request Submitted.");
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/requests/confirm`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Confirmation Failed");
      triggerAlert("Success", "Delivery Confirmed!");
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/cards/link`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ card_key: verifiedCard }),
      });
      if (!res.ok) throw new Error("Link Failed");
      triggerAlert("Success", "Card Bound Successfully.");
      setCardInput("");
      setVerifiedCard(null);
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDisconnect = async () => {
    setLoadingDisconnect(true);
    try {
      const res = await fetch(`${baseUrl}/auth/me/cards/disconnect`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Disconnection failed");
      triggerAlert("Success", "Card Disconnected");
      await refreshProfile();
    } catch (e: any) {
      triggerAlert("Error", e.message);
    } finally {
      setLoadingDisconnect(false);
    }
  };

  const renderRFIDPhase = () => {
    if (profile?.rfid_card) {
      return (
        <View style={styles.contentWrap}>
          <Text style={styles.heading}>Your Hardware Key</Text>
          <Text style={styles.subtext}>
            Your credit line is exclusively mapped to this physical node.
          </Text>
          <View style={styles.cardRender}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.cardType}>RFID Access Key</Text>
              <TouchableOpacity
                onPress={confirmDisconnect}
                disabled={loadingDisconnect}
              >
                {loadingDisconnect ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSerial}>{profile.rfid_card.card_key}</Text>
            <View style={styles.cardStatusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: profile.rfid_card.is_active
                      ? "#10B981"
                      : "#EF4444",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {profile.rfid_card.is_active ? "Active & Linked" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (profile?.card_request) {
      const req = profile.card_request;
      const isOut = req.status === "OUT_FOR_DELIVERY";
      const isDelivered = req.status === "DELIVERED_UNCONFIRMED";
      const isConfirmed = req.status === "DELIVERED_CONFIRMED";

      return (
        <View style={styles.contentWrap}>
          <Text style={styles.heading}>Order Tracking Log</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Route</Text>
            <Text style={styles.addressText}>
              {req.street_name}, {req.city}
            </Text>
            <Text style={styles.addressSubText}>
              {req.district}, {req.province}
            </Text>

            {isDelivered && (
              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={handleConfirmDelivery}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Confirm Delivery</Text>
                )}
              </TouchableOpacity>
            )}

            {isConfirmed && (
              <View style={styles.actionBoxSuccess}>
                <Text style={styles.actionSuccessText}>
                  Delivery confirmed. Pair your hardware key.
                </Text>
                <View style={{ marginTop: 24, width: "100%" }}>
                  <TextInput
                    style={[
                      styles.inputField,
                      verifiedCard && { borderColor: "#10B981" },
                    ]}
                    value={cardInput}
                    onChangeText={setCardInput}
                    placeholder="e.g. 9B 20 C8 05"
                  />
                  {verifiedCard && cardInput.trim() === verifiedCard && (
                    <TouchableOpacity
                      style={styles.btnSubmit}
                      onPress={handleLinkCard}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.btnText}>
                          Connect {verifiedCard}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      );
    }

    const availableProvinces = Object.keys(NEPAL_DATA);
    const availableDistricts = form.province
      ? Object.keys(NEPAL_DATA[form.province] || {})
      : [];
    const availableCities =
      form.province && form.district
        ? NEPAL_DATA[form.province][form.district] || []
        : [];

    return (
      <View style={styles.contentWrap}>
        <Text style={styles.heading}>Card Fulfillment</Text>
        <Text style={styles.subtext}>
          Enter your precise location to receive your NFC tag.
        </Text>
        <View style={styles.card}>
          <View style={styles.inputStack}>
            <Text style={styles.label}>Recipient Name</Text>
            <TextInput
              style={styles.inputField}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
          </View>
          <CustomDropdown
            label="Province"
            placeholder="Select Province"
            value={form.province}
            options={availableProvinces}
            onSelect={(t: string) => setForm({ ...form, province: t })}
            zIndexVal={30}
          />
          <CustomDropdown
            label="District"
            placeholder="Select District"
            value={form.district}
            options={availableDistricts}
            onSelect={(t: string) => setForm({ ...form, district: t })}
            zIndexVal={20}
          />
          <CustomDropdown
            label="City / Municipality"
            placeholder="Select City"
            value={form.city}
            options={availableCities}
            onSelect={(t: string) => setForm({ ...form, city: t })}
            zIndexVal={10}
          />
          <View style={[styles.inputStack, { zIndex: 1 }]}>
            <Text style={styles.label}>Street Details</Text>
            <TextInput
              style={styles.inputField}
              value={form.street}
              onChangeText={(t) => setForm({ ...form, street: t })}
            />
          </View>

          <TouchableOpacity
            style={styles.btnSubmit}
            onPress={handleRequestSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQRPhase = () => {
    return (
      <View style={styles.contentWrap}>
        <Text style={styles.heading}>Digital Pass (QR)</Text>
        <Text style={styles.subtext}>
          Instantly generate your dynamic gate pass code to enter and exit
          connected lots.
        </Text>

        {qrLoading ? (
          <ActivityIndicator
            size="large"
            color="#111827"
            style={{ marginTop: 40 }}
          />
        ) : qrData ? (
          <View style={styles.card}>
            <View style={styles.qrContainer}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData.qr_key}`,
                }}
                style={{ width: 250, height: 250 }}
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                marginTop: 15,
                fontFamily: "monospace",
                fontWeight: "800",
                color: "#374151",
                fontSize: 16,
              }}
            >
              {qrData.qr_key}
            </Text>

            <TouchableOpacity
              style={[
                styles.btnSubmit,
                { marginTop: 30, backgroundColor: "#059669" },
              ]}
              onPress={() =>
                Linking.openURL(
                  `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData.qr_key}`,
                )
              }
            >
              <Ionicons
                name="download-outline"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnText}>Download Secure QR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[styles.card, { alignItems: "center", paddingVertical: 40 }]}
          >
            <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
            <Text
              style={{
                marginTop: 20,
                color: "#6B7280",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              You do not have a digital QR key registered on your account.
            </Text>

            <TouchableOpacity
              style={[styles.btnSubmit, { width: "100%" }]}
              onPress={generateQRCode}
            >
              <Text style={styles.btnText}>Generate Instantly</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "RFID" && styles.tabBtnActive]}
          onPress={() => setActiveTab("RFID")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "RFID" && styles.tabTextActive,
            ]}
          >
            Physical Card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "QR" && styles.tabBtnActive]}
          onPress={() => setActiveTab("QR")}
        >
          <Text
            style={[styles.tabText, activeTab === "QR" && styles.tabTextActive]}
          >
            Digital QR Code
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "RFID" ? renderRFIDPhase() : renderQRPhase()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  tabContainer: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: { fontWeight: "700", color: "#6B7280" },
  tabTextActive: { color: "#111827" },
  contentWrap: { paddingHorizontal: 20 },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  subtext: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    zIndex: 1,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderRadius: 16,
  },
  inputStack: { marginBottom: 16, position: "relative" },
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
    padding: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#1F2937",
  },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  dropdownMenu: {
    position: "absolute",
    top: 72,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  btnSubmit: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "center",
  },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  cardRender: {
    width: "100%",
    height: 220,
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 10,
  },
  cardType: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardSerial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  cardStatusContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  addressText: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  addressSubText: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  actionBoxSuccess: {
    marginTop: 30,
    padding: 24,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
  },
  actionSuccessText: { color: "#065F46", fontWeight: "700", fontSize: 15 },
});
