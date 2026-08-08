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
} from "react-native";
import { useAuth } from "../../context/AuthContext";

type TabTypes = "parking_lot" | "management" | "requests" | "settings";

const NEPAL_DATA: Record<string, Record<string, string[]>> = {
  Koshi: {
    Bhojpur: ["Bhojpur", "Shadanand"],
    Dhankuta: ["Dhankuta", "Pakhribas", "Mahalaxmi"],
    Ilam: ["Ilam", "Deumai", "Mai", "Suryodaya"],
    Jhapa: [
      "Birtamode",
      "Bhadrapur",
      "Damak",
      "Kakarbhitta",
      "Mechinagar",
      "Kankai",
      "Shivasatakshi",
      "Gauradaha",
    ],
    Khotang: ["Diktel", "Halesi Tuwachung"],
    Morang: [
      "Biratnagar",
      "Urlabari",
      "Belbari",
      "Pathari Sanischare",
      "Sundar Haraicha",
      "Ratuwamai",
    ],
    Okhaldhunga: ["Siddhicharan"],
    Panchthar: ["Phidim"],
    Sankhuwasabha: [
      "Khandbari",
      "Chainpur",
      "Dharmadevi",
      "Madi",
      "Panchkhapan",
    ],
    Solukhumbu: ["Salleri", "Solududhkunda"],
    Sunsari: [
      "Dharan",
      "Itahari",
      "Inaruwa",
      "Duhabi",
      "Ramdhuni",
      "Barahachhetra",
    ],
    Taplejung: ["Phungling"],
    Terhathum: ["Myanglung", "Laligurans"],
    Udayapur: ["Gaighat", "Triyuga", "Katari", "Chaudandigadhi", "Belaka"],
  },
  Madhesh: {
    Bara: ["Kalaiya", "Jeetpur Simara", "Kolhabi", "Nijgadh", "Mahagadhimai"],
    Dhanusha: [
      "Janakpur",
      "Mithila",
      "Sabaila",
      "Ganeshman Charnath",
      "Dhanushadham",
    ],
    Mahottari: ["Jaleshwar", "Bardibas", "Gaushala", "Aurahi", "Bhangaha"],
    Parsa: ["Birgunj", "Pokhariya", "Parsagadhi", "Bahudarmai"],
    Rautahat: ["Gaur", "Chandrapur", "Garuda", "Rajpur", "Katahariya"],
    Saptari: [
      "Rajbiraj",
      "Bodebarsain",
      "Dakneshwori",
      "Hanumannagar Kankalini",
      "Kanchanrup",
    ],
    Sarlahi: [
      "Malangwa",
      "Lalbandi",
      "Hariwan",
      "Ishworpur",
      "Bagmati",
      "Barahathwa",
    ],
    Siraha: ["Siraha", "Lahan", "Golbazar", "Mirchaiya", "Dhangadhimai"],
  },
  Bagmati: {
    Bhaktapur: [
      "Bhaktapur",
      "Madhyapur Thimi",
      "Suryabinayak",
      "Changunarayan",
    ],
    Chitwan: [
      "Bharatpur",
      "Ratnanagar",
      "Khairahani",
      "Rapti",
      "Kalika",
      "Madi",
    ],
    Dhading: ["Nilkantha", "Dhunibesi"],
    Dolakha: ["Bhimeshwar", "Jiri"],
    Kathmandu: [
      "Kathmandu",
      "Kirtipur",
      "Budhanilkantha",
      "Gokarneshwar",
      "Chandragiri",
      "Tokha",
      "Tarakeshwar",
    ],
    Kavrepalanchok: [
      "Dhulikhel",
      "Banepa",
      "Panauti",
      "Panchkhal",
      "Namo Buddha",
      "Mandandeupur",
    ],
    Lalitpur: ["Lalitpur", "Godawari", "Mahalaxmi"],
    Makwanpur: ["Hetauda", "Thaha"],
    Nuwakot: ["Bidur", "Belkotgadhi"],
    Ramechhap: ["Manthali", "Ramechhap"],
    Rasuwa: ["Dhunche"],
    Sindhuli: ["Kamalamai", "Dudhauli"],
    Sindhupalchok: ["Chautara", "Bahrabise", "Melamchi"],
  },
  Gandaki: {
    Baglung: ["Baglung", "Galkot", "Jaimini", "Dhorpatan"],
    Gorkha: ["Gorkha", "Palungtar"],
    Kaski: ["Pokhara"],
    Lamjung: ["Besisahar", "Sundarbazar", "Rainas", "Madhya Nepal"],
    Manang: ["Chame"],
    Mustang: ["Jomsom"],
    Myagdi: ["Beni"],
    Nawalpur: ["Kawasoti", "Gaindakot", "Devchuli", "Madhyabindu"],
    Parbat: ["Kushma", "Phalewas"],
    Syangja: ["Putalibazar", "Waling", "Galyang", "Chapakot", "Bhirkot"],
    Tanahun: ["Vyas (Damauli)", "Bhanu", "Shuklagandaki", "Bhimad"],
  },
  Lumbini: {
    Arghakhanchi: ["Sandhikharka", "Sitganga", "Bhumikasthan"],
    Banke: ["Nepalgunj", "Kohalpur"],
    Bardiya: ["Gulariya", "Rajapur", "Madhuwan", "Thakurbaba", "Bansgadhi"],
    Dang: ["Ghorahi", "Tulsipur", "Lamahi"],
    Gulmi: ["Tamghas", "Resunga", "Musikot"],
    Kapilvastu: [
      "Taulihawa",
      "Banganga",
      "Buddhabhumi",
      "Shivraj",
      "Krishnanagar",
    ],
    Parasi: ["Ramgram", "Sunwal", "Bardaghat"],
    Palpa: ["Tansen", "Rampur"],
    Pyuthan: ["Pyuthan", "Swargadwari"],
    Rolpa: ["Liwang", "Rolpa"],
    "Rukum East": ["Rukumkot"],
    Rupandehi: [
      "Butwal",
      "Siddharthanagar",
      "Tillotama",
      "Lumbini Sanskritik",
      "Sainamaina",
      "Devdaha",
    ],
  },
  Karnali: {
    Dailekh: ["Narayan", "Dullu", "Chamunda Bindrasaini", "Aathbis"],
    Dolpa: ["Dunai", "Thuli Bheri", "Tripurasundari"],
    Humla: ["Simikot"],
    Jajarkot: ["Khalanga", "Bheri", "Chhedagad", "Nalgad"],
    Jumla: ["Chandannath"],
    Kalikot: ["Manma", "Khandachakra", "Raskot", "Tilagufa"],
    Mugu: ["Gamgadhi", "Chhayanath Rara"],
    "Rukum West": ["Musikot", "Chaurjahari", "Aathbiskot"],
    Salyan: ["Khalanga", "Shaarda", "Bagchaur", "Bangad Kupinde"],
    Surkhet: [
      "Birendranagar",
      "Bheriganga",
      "Gurbhakot",
      "Panchapuri",
      "Lekbeshi",
    ],
  },
  Sudurpashchim: {
    Achham: ["Mangalsen", "Sanphebagar", "Kamalbazar", "Panchadewal Binayak"],
    Baitadi: ["Dasharathchand", "Patan", "Melauli", "Purchaudi"],
    Bajhang: ["Chainpur", "Jaya Prithvi", "Bungal"],
    Bajura: ["Martadi", "Badimalika", "Triveni", "Budhiganga", "Budhinanda"],
    Dadeldhura: ["Amargadhi", "Parshuram"],
    Darchula: ["Mahakali", "Shailyashikhar"],
    Doti: ["Dipayal Silgadhi", "Shikhar"],
    Kailali: [
      "Dhangadhi",
      "Tikapur",
      "Godawari",
      "Lamki Chuha",
      "Ghodaghodi",
      "Bhajani",
      "Gauriganga",
    ],
    Kanchanpur: [
      "Bhimdatta",
      "Punarbas",
      "Bedkot",
      "Mahakali",
      "Shuklaphanta",
      "Krishnapur",
      "Belauri",
    ],
  },
};

const FAMOUS_STREETS: Record<string, string[]> = {
  Birtamode: [
    "Old Bhadrapur Road",
    "Mukti Chowk",
    "Sanaischare Road",
    "City Center Road",
    "Shanischare Road",
  ],
  Kathmandu: [
    "Durbar Marg",
    "Thamel",
    "New Road",
    "Putalisadak",
    "Lazimpat",
    "Baneshwor",
    "Koteshwor",
    "Maitidevi",
  ],
  Pokhara: [
    "Lakeside",
    "Mahendrapul",
    "New Road",
    "Prithvi Chowk",
    "Chipledhunga",
    "Srijana Chowk",
  ],
  Biratnagar: [
    "Main Road",
    "Traffic Chowk",
    "Hospital Chowk",
    "Bargachhi",
    "Roadcess Chowk",
  ],
  Dharan: ["Bhanu Chowk", "Chatara Line", "Putali Line", "Macha Bhaudi"],
  Lalitpur: [
    "Jhamsikhel",
    "Pulchowk",
    "Jawalakhel",
    "Mangal Bazar",
    "Kupondole",
  ],
  Bharatpur: [
    "Narayangarh",
    "Chaubiskothi",
    "Hakim Chowk",
    "Lions Chowk",
    "Sahid Chowk",
  ],
  Butwal: [
    "Traffic Chowk",
    "Milan Chowk",
    "Rajmarga Chauraha",
    "Hospital Line",
    "Amarpath",
  ],
};

const CustomDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
  zIndexVal,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder: string;
  zIndexVal: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.inputStack, { zIndex: zIndexVal }]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownToggle}
        activeOpacity={0.9}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={{ color: value ? "#1F2937" : "#9CA3AF", fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Text style={{ color: "#6B7280", fontSize: 12 }}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 220 }}
          >
            {options.length > 0 ? (
              options.map((opt, idx) => (
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
                Select previous field first
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function AdminDashboard() {
  const { signOut, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabTypes>("parking_lot");

  const baseUrl =
    Platform.OS === "android"
      ? "http://10.0.2.2:8000"
      : "http://127.0.0.1:8000";
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    province: "",
    district: "",
    city: "",
    street: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, district: "", city: "", street: "" }));
  }, [createForm.province]);
  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, city: "", street: "" }));
  }, [createForm.district]);
  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, street: "" }));
  }, [createForm.city]);

  const availableProvinces = Object.keys(NEPAL_DATA);
  const availableDistricts = createForm.province
    ? Object.keys(NEPAL_DATA[createForm.province] || {})
    : [];
  const availableCities =
    createForm.province && createForm.district
      ? NEPAL_DATA[createForm.province][createForm.district] || []
      : [];
  const suggestedStreets = createForm.city
    ? FAMOUS_STREETS[createForm.city] || []
    : [];

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });
  const [pwdUpdating, setPwdUpdating] = useState(false);

  const createParkingLotOwner = async () => {
    setCreating(true);
    try {
      const fullLocation = `${createForm.street}, ${createForm.city}, ${createForm.district}, ${createForm.province}`;

      const res = await fetch(`${baseUrl}/admin/parking-lots`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          full_name: createForm.fullName,
          email: createForm.email,
          phone: createForm.phone,
          password: createForm.password,
          business_name: createForm.businessName,
          location_address: fullLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Provision Failed");

      alert("Parking Owner generated securely.");
      setCreateForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        businessName: "",
        province: "",
        district: "",
        city: "",
        street: "",
      });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch(`${baseUrl}/admin/parking-lots`, {
        headers: getHeaders(),
      });
      if (res.ok) setAccounts(await res.json());
    } catch (e) {
    } finally {
      setLoadingAccounts(false);
    }
  };

  const toggleSuspension = async (userId: number) => {
    try {
      const res = await fetch(
        `${baseUrl}/admin/parking-lots/${userId}/suspend`,
        {
          method: "PATCH",
          headers: getHeaders(),
        },
      );
      if (res.ok) fetchAccounts();
    } catch (e) {
      alert("Failed to change suspension status");
    }
  };

  const deleteAccount = async (userId: number) => {
    const proceed =
      Platform.OS === "web"
        ? window.confirm("Permanently delete this account?")
        : true;
    if (!proceed) return;
    try {
      const res = await fetch(`${baseUrl}/admin/parking-lots/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        alert("Account Deleted");
        fetchAccounts();
      }
    } catch (e) {
      alert("Delete failed");
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${baseUrl}/admin/requests`, {
        headers: getHeaders(),
      });
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateRequestStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${baseUrl}/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchRequests();
    } catch (e) {
      alert("Status update failed");
    }
  };

  const changeAdminPassword = async () => {
    setPwdUpdating(true);
    try {
      const res = await fetch(`${baseUrl}/admin/settings/password`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          old_password: pwdForm.oldPassword,
          new_password: pwdForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      alert("Admin password updated.");
      setPwdForm({ oldPassword: "", newPassword: "" });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setPwdUpdating(false);
    }
  };

  useEffect(() => {
    if (activeTab === "management") fetchAccounts();
    if (activeTab === "requests") fetchRequests();
  }, [activeTab]);

  return (
    <View style={styles.layout}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin.</Text>
          <Text style={styles.sidebarSubtitle}>System Control Panel</Text>
        </View>

        <View style={styles.navMenu}>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "parking_lot" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("parking_lot")}
          >
            <Text
              style={[
                styles.navText,
                activeTab === "parking_lot" && styles.navTextActive,
              ]}
            >
              Infrastructure
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "management" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("management")}
          >
            <Text
              style={[
                styles.navText,
                activeTab === "management" && styles.navTextActive,
              ]}
            >
              Accounts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "requests" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.navText,
                activeTab === "requests" && styles.navTextActive,
              ]}
            >
              Card Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === "settings" && styles.navItemActive,
            ]}
            onPress={() => setActiveTab("settings")}
          >
            <Text
              style={[
                styles.navText,
                activeTab === "settings" && styles.navTextActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={{ padding: 40, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "parking_lot" && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>New Parking Lot Site</Text>
            <Text style={styles.cardDesc}>
              Initialize franchise credentials and precise geographical
              locations.
            </Text>

            <View style={[styles.formRowGrid, { zIndex: 1 }]}>
              <View style={styles.inputStack}>
                <Text style={styles.label}>Business / Franchise Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={createForm.businessName}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, businessName: t })
                  }
                  placeholder="e.g. City Mall Parking"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={[styles.sectionDivider, { zIndex: 1 }]}>
              <Text style={styles.sectionDividerText}>
                Geographical Mapping
              </Text>
            </View>

            <View style={[styles.formRowGrid, { zIndex: 20 }]}>
              <CustomDropdown
                label="Province"
                placeholder="Select Province"
                value={createForm.province}
                options={availableProvinces}
                onSelect={(t) => setCreateForm({ ...createForm, province: t })}
                zIndexVal={21}
              />
              <CustomDropdown
                label="District"
                placeholder="Select District"
                value={createForm.district}
                options={availableDistricts}
                onSelect={(t) => setCreateForm({ ...createForm, district: t })}
                zIndexVal={20}
              />
            </View>

            <View style={[styles.formRowGrid, { zIndex: 10 }]}>
              <CustomDropdown
                label="City / Municipality"
                placeholder="Select City"
                value={createForm.city}
                options={availableCities}
                onSelect={(t) => setCreateForm({ ...createForm, city: t })}
                zIndexVal={11}
              />

              <View style={[styles.inputStack, { zIndex: 10 }]}>
                <Text style={styles.label}>Street / Local Area</Text>
                <TextInput
                  style={styles.inputField}
                  value={createForm.street}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, street: t })
                  }
                  placeholder="Manual entry..."
                  placeholderTextColor="#9CA3AF"
                />

                {suggestedStreets.length > 0 && (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionTitle}>
                      Popular in {createForm.city}:
                    </Text>
                    <View style={styles.pillContainer}>
                      {suggestedStreets.map((st, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.pill}
                          onPress={() =>
                            setCreateForm({ ...createForm, street: st })
                          }
                        >
                          <Text style={styles.pillText}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.sectionDivider, { zIndex: 1 }]}>
              <Text style={styles.sectionDividerText}>Manager Credentials</Text>
            </View>

            <View style={[styles.formRowGrid, { zIndex: 1 }]}>
              <View style={styles.inputStack}>
                <Text style={styles.label}>Manager Full Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={createForm.fullName}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, fullName: t })
                  }
                />
              </View>
              <View style={styles.inputStack}>
                <Text style={styles.label}>Access Email</Text>
                <TextInput
                  style={styles.inputField}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={createForm.email}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, email: t })
                  }
                />
              </View>
            </View>

            <View style={[styles.formRowGrid, { zIndex: 1 }]}>
              <View style={styles.inputStack}>
                <Text style={styles.label}>Contact No</Text>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={createForm.phone}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, phone: t })
                  }
                />
              </View>
              <View style={styles.inputStack}>
                <Text style={styles.label}>Starter Password</Text>
                <TextInput
                  style={styles.inputField}
                  secureTextEntry
                  value={createForm.password}
                  onChangeText={(t) =>
                    setCreateForm({ ...createForm, password: t })
                  }
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={createParkingLotOwner}
              disabled={creating}
              style={[styles.actionBtnBlock, { zIndex: 1 }]}
            >
              {creating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.actionText}>INITIALIZE ACCOUNT</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "management" && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Terminal Accounts</Text>
            <Text style={styles.cardDesc}>
              Suspend or permanently delete active parking lot franchises.
            </Text>

            {loadingAccounts ? (
              <ActivityIndicator
                size="large"
                color="#059669"
                style={{ marginVertical: 40 }}
              />
            ) : (
              <View style={styles.tableContainer}>
                {accounts.length === 0 ? (
                  <Text
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#000205",
                    }}
                  >
                    No Parking Lot accounts found.
                  </Text>
                ) : (
                  accounts.map((acc, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={styles.infoCol}>
                        <Text style={styles.rowTitle}>
                          {acc.business_name || "Unnamed Business"}
                        </Text>
                        <Text style={styles.rowSubText}>
                          {acc.full_name} • {acc.phone}
                        </Text>
                        <Text style={styles.rowLocation}>
                          📍 {acc.location_address || "No location set"}
                        </Text>
                        {acc.is_suspended && (
                          <Text style={styles.badgeSuspended}>SUSPENDED</Text>
                        )}
                      </View>

                      <View style={styles.actionCol}>
                        <TouchableOpacity
                          onPress={() => toggleSuspension(acc.user_id)}
                          style={[
                            styles.smallBtn,
                            !acc.is_suspended
                              ? styles.btnWarn
                              : styles.btnSuccess,
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallBtnText,
                              acc.is_suspended && { color: "#161716" },
                            ]}
                          >
                            {!acc.is_suspended ? "Suspend" : "Unsuspend"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteAccount(acc.user_id)}
                          style={[styles.smallBtn, styles.btnDanger]}
                        >
                          <Text style={styles.smallBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === "requests" && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Fulfillment Operations</Text>
            <Text style={styles.cardDesc}>
              Track user hardware requests and update delivery statuses.
            </Text>

            {loadingRequests ? (
              <ActivityIndicator
                size="large"
                color="#059669"
                style={{ marginVertical: 40 }}
              />
            ) : (
              <View style={styles.tableContainer}>
                {requests.length === 0 ? (
                  <Text
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#000",
                    }}
                  >
                    No pending requests found.
                  </Text>
                ) : (
                  requests.map((req, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={styles.infoCol}>
                        <Text style={styles.rowTitle}>{req.owner_name}</Text>
                        <Text style={styles.rowSubText}>
                          {req.phone_with_code}
                        </Text>
                        <Text style={styles.rowLocation}>
                          📍 {req.street_name}, {req.city}, {req.district},{" "}
                          {req.province}
                        </Text>
                        <Text
                          style={[
                            styles.badgeSuspended,
                            { backgroundColor: "#DBEAFE", color: "#1E40AF" },
                          ]}
                        >
                          {req.status}
                        </Text>
                      </View>

                      <View style={styles.actionCol}>
                        {req.status === "PENDING" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateRequestStatus(req.id, "OUT_FOR_DELIVERY")
                            }
                            style={[
                              styles.smallBtn,
                              {
                                backgroundColor: "#10B981",
                                borderColor: "#059669",
                              },
                            ]}
                          >
                            <Text style={styles.smallBtnText}>
                              Mark Out for Delivery
                            </Text>
                          </TouchableOpacity>
                        )}
                        {req.status === "OUT_FOR_DELIVERY" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateRequestStatus(
                                req.id,
                                "DELIVERED_UNCONFIRMED",
                              )
                            }
                            style={[
                              styles.smallBtn,
                              {
                                backgroundColor: "#F59E0B",
                                borderColor: "#D97706",
                              },
                            ]}
                          >
                            <Text style={styles.smallBtnText}>
                              Mark Delivered
                            </Text>
                          </TouchableOpacity>
                        )}
                        {req.status === "DELIVERED_UNCONFIRMED" && (
                          <Text style={{ color: "#F59E0B", fontWeight: "700" }}>
                            Waiting for User Confirmation
                          </Text>
                        )}
                        {req.status === "DELIVERED_CONFIRMED" && (
                          <Text style={{ color: "#10B981", fontWeight: "700" }}>
                            ✔ Confirmed
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === "settings" && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Admin Settings</Text>
            <Text style={styles.cardDesc}>
              Securely update your master credentials.
            </Text>

            <View style={{ maxWidth: 500 }}>
              <View style={styles.inputStack}>
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
              <View style={styles.inputStack}>
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
                onPress={changeAdminPassword}
                disabled={pwdUpdating}
                style={styles.actionBtnBlock}
              >
                {pwdUpdating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionText}>UPDATE PASSWORD</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: "#059669",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sidebarSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  navMenu: { flex: 1 },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
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
  card: {
    backgroundColor: "#FFFFFF",
    padding: 45,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    zIndex: 2,
  },
  cardHeader: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  cardDesc: {
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 35,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  sectionDividerText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formRowGrid: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 24,
    marginBottom: 20,
  },
  inputStack: { flex: 1, position: "relative" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 16,
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
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 15,
    ...(Platform.OS === "web"
      ? { position: "absolute", top: 78, left: 0, right: 0 }
      : {}),
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  suggestionBox: { marginTop: 10 },
  suggestionTitle: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "600",
  },
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    backgroundColor: "#ECFDF5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  pillText: { color: "#059669", fontSize: 12, fontWeight: "600" },
  actionBtnBlock: {
    backgroundColor: "#10B981",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#10B981",
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
  tableContainer: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  infoCol: { flex: 1, paddingRight: 20 },
  rowTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  rowSubText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  rowLocation: { fontSize: 13, color: "#9CA3AF", marginTop: 6 },
  badgeSuspended: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  actionCol: { flexDirection: "row", gap: 10, alignItems: "center" },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    borderWidth: 1,
  },
  smallBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  btnWarn: { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" },
  btnSuccess: { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" },
  btnDanger: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
});
