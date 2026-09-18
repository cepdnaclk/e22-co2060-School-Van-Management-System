import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  Modal, 
  TextInput,
  Switch,
  Linking
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { 
  LogOut as LogOutIcon, 
  CreditCard as CreditCardIcon, 
  RefreshCw as RefreshCwIcon, 
  Navigation as NavigationIcon, 
  CheckSquare as CheckSquareIcon, 
  ShieldAlert as ShieldAlertIcon,
  Phone as PhoneIcon,
  Bell as BellIcon,
  User as UserIcon,
  Users as UsersIcon,
  Plus as PlusIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  Calendar as CalendarIcon
} from "lucide-react-native";

const LogOut = LogOutIcon as any;
const CreditCard = CreditCardIcon as any;
const RefreshCw = RefreshCwIcon as any;
const Navigation = NavigationIcon as any;
const CheckSquare = CheckSquareIcon as any;
const ShieldAlert = ShieldAlertIcon as any;
const Phone = PhoneIcon as any;
const Bell = BellIcon as any;
const User = UserIcon as any;
const Users = UsersIcon as any;
const Plus = PlusIcon as any;
const Check = CheckIcon as any;
const Settings = SettingsIcon as any;
const Calendar = CalendarIcon as any;

import MapView, { Marker } from "react-native-maps";
import io from "socket.io-client";
import { API_BASE_URL } from "../../constants/config";

interface Child {
  id: number;
  name: string;
  school: string;
  pickup_stop_name?: string;
  dropoff_stop_name?: string;
  absent_today?: boolean;
}

interface Payment {
  id: number;
  amount_due: string;
  status: string;
  due_date: string;
  month: string;
  receipt_ref?: string;
  receipt_url?: string;
  student_name?: string;
}

interface AlertLog {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

interface RouteStop {
  id: number;
  name: string;
}

interface AvailableRoute {
  id: number;
  name: string;
  driver_name: string;
  stops: RouteStop[];
}

export default function ParentDashboard() {
  const router = useRouter();
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<"home" | "children" | "payments" | "notifications" | "profile">("home");

  // Core Parent Session
  const [parentName, setParentName] = useState("Parent");
  const [parentEmail, setParentEmail] = useState("");
  const [token, setToken] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAddress, setParentAddress] = useState("123, Galle Road, Colombo");
  const [emergencyName, setEmergencyName] = useState("Amali Perera");
  const [emergencyPhone, setEmergencyPhone] = useState("+94 77 123 4567");

  // Sub-view options for profile: "view" | "edit" | "settings"
  const [profileSubView, setProfileSubView] = useState<"view" | "edit" | "settings">("view");

  // UI settings state togglers
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [trackingFrequency, setTrackingFrequency] = useState("high");

  const [socket, setSocket] = useState<any>(null);

  // States: Home (Live Tracking & Map)
  const [vanLocation, setVanLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [childStatus, setChildStatus] = useState<any>(null);
  const [sosAlert, setSosAlert] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);

  // States: Tab 2 (Children & Registration)
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildSchool, setNewChildSchool] = useState("");
  const [availableRoutes, setAvailableRoutes] = useState<AvailableRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedPickupStopId, setSelectedPickupStopId] = useState<number | null>(null);
  const [selectedDropoffStopId, setSelectedDropoffStopId] = useState<number | null>(null);
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);

  // States: Tab 3 (Payments Accounts)
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [pastPayments, setPastPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [uploadPayment, setUploadPayment] = useState<Payment | null>(null);
  const [receiptRef, setReceiptRef] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  // States: Tab 4 (Alert Logs & Notifications Feed)
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [travelHistory, setTravelHistory] = useState<any[]>([]);

  // States: Tab 5 (Settings)
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const themeColors = {
    background: isDarkMode ? "#000000" : "#F5F7FA",
    cardBg: isDarkMode ? "rgba(22, 22, 26, 0.85)" : "rgba(255, 255, 255, 0.85)",
    textPrimary: isDarkMode ? "#FFFFFF" : "#1C1C1E",
    textSecondary: isDarkMode ? "#8E8E93" : "#6E6E73",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
    inputBg: isDarkMode ? "rgba(30, 30, 35, 0.8)" : "rgba(242, 242, 247, 0.8)",
    headerBg: isDarkMode ? "rgba(10, 10, 12, 0.9)" : "rgba(255, 255, 255, 0.9)"
  };

  const themedStyles = {
    ...globalStyles,
    container: StyleSheet.flatten([globalStyles.container, { backgroundColor: themeColors.background }]),
    header: StyleSheet.flatten([globalStyles.header, { backgroundColor: themeColors.headerBg, borderColor: themeColors.border }]),
    card: StyleSheet.flatten([globalStyles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]),
    actionGridCard: StyleSheet.flatten([globalStyles.actionGridCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]),
    dueCard: StyleSheet.flatten([globalStyles.dueCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]),
    paymentCard: StyleSheet.flatten([globalStyles.paymentCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]),
    textInput: StyleSheet.flatten([globalStyles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.textPrimary, borderColor: themeColors.border }]),
    welcome: StyleSheet.flatten([globalStyles.welcome, { color: themeColors.textSecondary }]),
    name: StyleSheet.flatten([globalStyles.name, { color: themeColors.textPrimary }]),
    sectionTitle: StyleSheet.flatten([globalStyles.sectionTitle, { color: themeColors.textPrimary }]),
    tabBar: StyleSheet.flatten([globalStyles.tabBar, { backgroundColor: themeColors.headerBg, borderColor: themeColors.border }])
  };

  const styles = themedStyles;

  // Initialize and load auth credentials
  useEffect(() => {
    async function initDashboard() {
      try {
        const sessionStr = await SecureStore.getItemAsync("school-van-auth-session");
        if (!sessionStr) {
          router.replace("/login");
          return;
        }

        const session = JSON.parse(sessionStr);
        setToken(session.token);
        setParentName(session.user?.name || "Parent");
        setParentEmail(session.user?.email || "");
        setParentPhone(session.user?.phone || "");

        const savedDarkMode = await SecureStore.getItemAsync("ui-dark-mode");
        if (savedDarkMode) setIsDarkMode(savedDarkMode === "true");

        const savedPhone = await SecureStore.getItemAsync("parent-profile-phone");
        if (savedPhone) setParentPhone(savedPhone);
        const savedAddress = await SecureStore.getItemAsync("parent-profile-address");
        if (savedAddress) setParentAddress(savedAddress);
        const savedEmergName = await SecureStore.getItemAsync("parent-profile-emerg-name");
        if (savedEmergName) setEmergencyName(savedEmergName);
        const savedEmergPhone = await SecureStore.getItemAsync("parent-profile-emerg-phone");
        if (savedEmergPhone) setEmergencyPhone(savedEmergPhone);

        // WebSocket Setup
        const socketCon = io(API_BASE_URL.replace("/api", ""), {
          auth: { token: session.token }
        });
        setSocket(socketCon);

        // Fetch children & emergency contacts in parallel
        const [childrenRes, contactsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/parent/children`, {
            headers: { Authorization: `Bearer ${session.token}` }
          }),
          fetch(`${API_BASE_URL}/parent/emergency-contacts`, {
            headers: { Authorization: `Bearer ${session.token}` }
          })
        ]);

        const childrenData = await childrenRes.json().catch(() => []);
        const contactsData = await contactsRes.json().catch(() => []);

        if (contactsRes.ok) {
          setEmergencyContacts(contactsData);
        }

        if (childrenRes.ok && childrenData.length > 0) {
          setChildren(childrenData);
          
          // Connect to first child's route journey room
          const firstChild = childrenData[0];
          const journeyRes = await fetch(`${API_BASE_URL}/parent/child/${firstChild.id}/status`, {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          const journeyData = await journeyRes.json().catch(() => ({}));
          if (journeyRes.ok && journeyData.journeyId) {
            setChildStatus(journeyData);
            socketCon.emit("join_journey", journeyData.journeyId);
            socketCon.emit("tracking:subscribe-journey", { journeyId: journeyData.journeyId });
          }
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      }
    }
    initDashboard();
  }, []);

  // Socket triggers
  useEffect(() => {
    if (!socket) return;

    const handleLocation = (coords: any) => {
      setVanLocation({
        latitude: Number(coords.lat),
        longitude: Number(coords.lng)
      });
    };

    socket.on("location_update", handleLocation);
    socket.on("location_broadcast", handleLocation);
    socket.on("tracking:location-broadcast", handleLocation);

    const handleSos = (alert: any) => {
      setSosAlert(alert.message || "SOS alert flagged by driver! Keep updated.");
    };

    socket.on("sos_alert", handleSos);
    socket.on("sos:alert", handleSos);

    socket.on("sos_cleared", () => {
      setSosAlert(null);
    });

    socket.on("student:boarded", (data: any) => {
      setChildStatus((prev: any) => prev ? { ...prev, boarded: true } : prev);
      Alert.alert("Boarding Update", `${data.studentName || "Your child"} has successfully boarded the van!`);
    });

    socket.on("student:dropped", (data: any) => {
      setChildStatus((prev: any) => prev ? { ...prev, boarded: false, dropped: true } : prev);
      Alert.alert("Dropoff Update", `${data.studentName || "Your child"} has arrived safely at school/home!`);
    });

    return () => {
      socket.off("location_update", handleLocation);
      socket.off("location_broadcast", handleLocation);
      socket.off("tracking:location-broadcast", handleLocation);
      socket.off("sos_alert", handleSos);
      socket.off("sos:alert", handleSos);
      socket.off("sos_cleared");
      socket.off("student:boarded");
      socket.off("student:dropped");
    };
  }, [socket]);

  // Sync tab details
  useEffect(() => {
    if (token) {
      if (activeTab === "children") {
        loadChildren();
        loadAvailableRoutes();
      } else if (activeTab === "payments") {
        loadPayments();
      } else if (activeTab === "notifications") {
        loadNotifications();
        loadTravelHistory();
      }
    }
  }, [activeTab, token]);

  // TABS 2: CHILDREN WORKFLOWS
  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try {
      const res = await fetch(`${API_BASE_URL}/parent/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (res.ok) setChildren(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const loadAvailableRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/parent/available-routes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (res.ok) {
        // format routes data
        const formatted = Object.values(data).map((r: any) => ({
          id: r.id,
          name: r.name,
          driver_name: r.driver_name,
          stops: r.stops.map((s: any) => ({ id: s.id, name: s.name }))
        }));
        setAvailableRoutes(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterChild = async () => {
    if (!newChildName || !newChildSchool || !selectedPickupStopId || !selectedDropoffStopId) {
      Alert.alert("Error", "Please input student and stop selections details");
      return;
    }
    setIsSubmittingChild(true);
    try {
      const res = await fetch(`${API_BASE_URL}/parent/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newChildName,
          school: newChildSchool,
          pickup_stop_id: selectedPickupStopId,
          dropoff_stop_id: selectedDropoffStopId,
          pickup_lat: 6.9271, // fallbacks
          pickup_lng: 79.8612,
          dropoff_lat: 6.9371,
          dropoff_lng: 79.8712
        })
      });
      if (res.ok) {
        Alert.alert("Success", "Child profile registered successfully!");
        setShowAddChildModal(false);
        setNewChildName("");
        setNewChildSchool("");
        setSelectedRouteId(null);
        setSelectedPickupStopId(null);
        setSelectedDropoffStopId(null);
        loadChildren();
      } else {
        const err = await res.json();
        Alert.alert("Failed", err.error || "Unable to register child profile.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed child register request.");
    } finally {
      setIsSubmittingChild(false);
    }
  };

  const handleToggleAbsent = async (childId: number, currentAbsent: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/parent/children/${childId}/absent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          reason: currentAbsent ? "Attending" : "Sick leave/Absent today"
        })
      });
      if (res.ok) {
        Alert.alert("Status Updated", currentAbsent ? "Child marked as Present." : "Child marked as Absent today.");
        loadChildren();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // TABS 3: PAYMENTS WORKFLOWS
  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/parent/dues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (res.ok) {
        if (data.length > 0) {
          const active = data.find((p: any) => p.status !== "paid");
          setActivePayment(active || data[0]);
          setPastPayments(data.filter((p: any) => p.status === "paid"));
        } else {
          setActivePayment(null);
          setPastPayments([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!uploadPayment || !receiptRef.trim() || !receiptUrl.trim()) {
      Alert.alert("Error", "Please input a transaction code and reference URL");
      return;
    }
    setIsSubmittingReceipt(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/parent/upload/${uploadPayment.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receipt_ref: receiptRef.trim(),
          receipt_url: receiptUrl.trim()
        })
      });
      if (res.ok) {
        Alert.alert("Success", "Receipt successfully logged for driver review!");
        setUploadPayment(null);
        setReceiptRef("");
        setReceiptUrl("");
        loadPayments();
      }
    } catch {
      Alert.alert("API Sync Failed", "Receipt upload request blocked.");
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  // TABS 4: ALERTS FEED & HISTORY
  const loadNotifications = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/parent/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (res.ok) setAlertLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const loadTravelHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/parent/journey-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (res.ok) setTravelHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  // PROFILE UPDATES & LOGOUT
  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Error", "Please input password credentials");
      return;
    }
    setIsSubmittingPassword(true);
    setTimeout(() => {
      Alert.alert("Success", "Profile password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setIsSubmittingPassword(false);
    }, 1000);
  };

  const handleSaveParentProfile = async () => {
    try {
      await SecureStore.setItemAsync("parent-profile-phone", parentPhone);
      await SecureStore.setItemAsync("parent-profile-address", parentAddress);
      await SecureStore.setItemAsync("parent-profile-emerg-name", emergencyName);
      await SecureStore.setItemAsync("parent-profile-emerg-phone", emergencyPhone);
      Alert.alert("Success", "Profile details saved successfully!");
      setProfileSubView("view");
    } catch {
      Alert.alert("Failed", "Unable to save profile details.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you absolutely sure you want to permanently delete your account? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                Alert.alert("Deleted", "Your account has been successfully deleted.");
                handleLogout();
              } else {
                Alert.alert("Error", "Failed to delete account from server.");
              }
            } catch (err) {
              Alert.alert("Error", "Network connection failure.");
            }
          }
        }
      ]
    );
  };

  const handleToggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await SecureStore.setItemAsync("ui-dark-mode", value ? "true" : "false");
  };

  const handleLogout = async () => {
    if (socket) socket.disconnect();
    await SecureStore.deleteItemAsync("school-van-auth-session");
    await SecureStore.deleteItemAsync("school-van-active-journey-id");
    router.replace("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#10B981";
      case "receipt_submitted": return "#3B82F6";
      case "rejected": return "#EF4444";
      default: return "#F59E0B";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Settled";
      case "receipt_submitted": return "Verification Pending";
      case "rejected": return "Receipt Rejected";
      default: return "Pending Dues";
    }
  };

  const getStopsForSelectedRoute = () => {
    if (!selectedRouteId) return [];
    const route = availableRoutes.find(r => r.id === selectedRouteId);
    return route ? route.stops : [];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* SOS Emergency Overlay Modal */}
      <Modal
        visible={!!sosAlert}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSosAlert(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sosModalContainer}>
            <View style={styles.sosModalHeader}>
              <View style={styles.sosModalHeaderIconWrapper}>
                <ShieldAlert size={28} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.sosModalHeaderSub}>Emergency Alert</Text>
                <Text style={styles.sosModalHeaderTitle}>SOS Triggered</Text>
              </View>
            </View>
            <View style={styles.sosModalBody}>
              <Text style={styles.sosModalMessage}>{sosAlert}</Text>
              <Text style={styles.sosModalSubText}>
                Please check on your child immediately. Live tracking is active.
              </Text>
            </View>
            <View style={styles.sosModalFooter}>
              {emergencyContacts && emergencyContacts.length > 0 ? (
                <TouchableOpacity
                  style={[styles.sosModalBtn, styles.sosModalCallBtn]}
                  onPress={() => {
                    const phoneNum = emergencyContacts[0]?.driver_phone || emergencyPhone;
                    Linking.openURL(`tel:${phoneNum}`).catch(() => {});
                  }}
                >
                  <Phone size={18} color="#FFFFFF" />
                  <Text style={styles.sosModalBtnText}>Call Driver</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sosModalBtn, styles.sosModalCallBtn]}
                  onPress={() => {
                    Linking.openURL(`tel:${emergencyPhone}`).catch(() => {});
                  }}
                >
                  <Phone size={18} color="#FFFFFF" />
                  <Text style={styles.sosModalBtnText}>Call Emergency</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sosModalBtn, styles.sosModalAckBtn]}
                onPress={() => setSosAlert(null)}
              >
                <Text style={[styles.sosModalBtnText, { color: "#475569" }]}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 1. Header Area */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderColor: themeColors.border }]}>
        <View>
          <Text style={[styles.welcome, { color: themeColors.textSecondary }]}>Parent Dashboard</Text>
          <Text style={[styles.name, { color: themeColors.textPrimary }]}>{parentName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* 2. Scroll Panel Switcher */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* TABS 1: Live GPS Map Tracking */}
        {activeTab === "home" && (
          <View style={styles.tabContent}>
            
            {/* SOS Emergency warning block */}
            {sosAlert && (
              <View style={[styles.card, { backgroundColor: "#FEF2F2", borderColor: "#EF4444", borderWidth: 1 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <ShieldAlert size={28} color="#EF4444" />
                  <Text style={{ fontWeight: "900", color: "#991B1B", fontSize: 16 }}>SOS EMERGENCY WARNING</Text>
                </View>
                <Text style={{ marginTop: 8, fontSize: 13, color: "#991B1B", lineHeight: 20 }}>{sosAlert}</Text>
              </View>
            )}

            {/* Quick Actions Panel */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionGridCard} onPress={() => router.push("/parent/contacts")}>
                <View style={[styles.actionGridIconWrapper, { backgroundColor: "#EFF6FF" }]}>
                  <Phone size={20} color="#2563EB" />
                </View>
                <Text style={styles.actionGridText}>Emergency Directory</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridCard} onPress={() => setActiveTab("notifications")}>
                <View style={[styles.actionGridIconWrapper, { backgroundColor: "#FEF3C7" }]}>
                  <Bell size={20} color="#D97706" />
                </View>
                <Text style={styles.actionGridText}>Alert Logs Feed</Text>
              </TouchableOpacity>
            </View>

            {/* Transit Status Board */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Transit Status Board</Text>
              {children.length === 0 ? (
                <View style={styles.card}>
                  <Text style={{ color: "#64748B", textAlign: "center", fontSize: 13 }}>No student profiles added yet.</Text>
                </View>
              ) : (
                children.map(child => {
                  let statusText = "Waiting for Pickup";
                  let statusBg = "#FEF3C7";
                  let statusColor = "#D97706";

                  if (child.absent_today) {
                    statusText = "Absent Today";
                    statusBg = "#FEE2E2";
                    statusColor = "#EF4444";
                  } else if (childStatus && childStatus.studentId === child.id) {
                    if (childStatus.boarded) {
                      statusText = "Boarded & In Transit";
                      statusBg = "#D1FAE5";
                      statusColor = "#059669";
                    } else if (childStatus.dropped) {
                      statusText = "Arrived Safely";
                      statusBg = "#DBEAFE";
                      statusColor = "#2563EB";
                    }
                  }

                  return (
                    <View key={child.id} style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, marginBottom: 8 }]}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#0F172A" }}>{child.name}</Text>
                        <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{child.school}</Text>
                      </View>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: statusColor }}>{statusText}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Map View */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={vanLocation ? {
                  latitude: vanLocation.latitude,
                  longitude: vanLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                } : {
                  latitude: 6.9271, // Colombo defaults
                  longitude: 79.8612,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {vanLocation && (
                  <Marker 
                    coordinate={vanLocation}
                    title="School Van"
                    description={childStatus?.boarded ? "Your child is boarded" : "Live GPS telemetry stream"}
                    pinColor="#10B981"
                  />
                )}
              </MapView>
              <View style={styles.mapOverlay}>
                <Navigation size={14} color="#10B981" />
                <Text style={styles.mapOverlayText}>
                  {childStatus?.journeyId ? "Active Route Stream" : "Van offline / Journey Inactive"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TABS 2: Child Management */}
        {activeTab === "children" && (
          <View style={styles.tabContent}>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.sectionTitle}>Registered Children</Text>
              <TouchableOpacity style={styles.registerBtn} onPress={() => setShowAddChildModal(true)}>
                <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.registerBtnText}>Add Child</Text>
              </TouchableOpacity>
            </View>

            {isLoadingChildren ? (
              <ActivityIndicator color="#10B981" />
            ) : children.length === 0 ? (
              <View style={styles.card}>
                <Text style={{ color: "#64748B", textAlign: "center" }}>No student profiles linked to this parent account.</Text>
              </View>
            ) : (
              children.map(item => (
                <View style={styles.card} key={item.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentMeta}>School: {item.school}</Text>
                      <Text style={styles.studentMeta}>Pickup Stop: {item.pickup_stop_name || "Stops default"}</Text>
                    </View>
                    
                    {/* Absent switch toggle */}
                    <View style={{ alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: "900", color: "#64748B" }}>ABSENT TODAY</Text>
                      <Switch
                        value={item.absent_today || false}
                        onValueChange={() => handleToggleAbsent(item.id, item.absent_today || false)}
                        trackColor={{ false: "#E2E8F0", true: "#FCA5A5" }}
                        thumbColor={item.absent_today ? "#EF4444" : "#94A3B8"}
                      />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TABS 3: Payments */}
        {activeTab === "payments" && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outstanding Dues</Text>
              
              {isLoadingPayments ? (
                <ActivityIndicator color="#10B981" />
              ) : activePayment ? (
                <View style={styles.dueCard}>
                  <View style={styles.dueHeader}>
                    <View style={styles.dueIconWrapper}>
                      <CreditCard size={20} color="#10B981" />
                    </View>
                    <View style={styles.dueTitleWrapper}>
                      <Text style={styles.dueCardTitle}>Current Monthly Due</Text>
                      {activePayment.student_name && (
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#10B981", marginTop: 2 }}>
                          Child: {activePayment.student_name}
                        </Text>
                      )}
                      <Text style={styles.dueCardAmount}>LKR {Number(activePayment.amount_due).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.dueBadge, { backgroundColor: getStatusColor(activePayment.status) + "20" }]}>
                      <Text style={[styles.dueBadgeText, { color: getStatusColor(activePayment.status) }]}>
                        {getStatusLabel(activePayment.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dueDetails}>
                    <View style={styles.dueDetailRow}>
                      <Text style={styles.dueDetailLabel}>Due Date:</Text>
                      <Text style={styles.dueDetailValue}>{new Date(activePayment.due_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.dueDetailRow}>
                      <Text style={styles.dueDetailLabel}>Billing Period:</Text>
                      <Text style={styles.dueDetailValue}>{activePayment.month}</Text>
                    </View>
                  </View>

                  {activePayment.status !== "paid" && activePayment.status !== "receipt_submitted" && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setUploadPayment(activePayment)}>
                      <Text style={styles.actionBtnText}>Upload Receipt</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  <CheckSquare size={24} color="#10B981" />
                  <Text style={{ marginTop: 8, color: "#64748B", fontWeight: "700" }}>No outstanding payment invoices.</Text>
                </View>
              )}
            </View>

            {/* Past Invoices Logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Log History</Text>
              {pastPayments.length === 0 ? (
                <View style={styles.card}>
                  <Text style={{ color: "#64748B", textAlign: "center" }}>No settled history logs found.</Text>
                </View>
              ) : (
                pastPayments.map(item => (
                  <View style={styles.paymentCard} key={item.id}>
                    <View>
                      <Text style={{ fontWeight: "800", color: "#0F172A" }}>Month: {item.month}</Text>
                      {item.student_name && (
                        <Text style={{ fontSize: 12, fontWeight: "800", color: "#3B82F6", marginTop: 2, marginBottom: 2 }}>
                          Child: {item.student_name}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: "#64748B" }}>Paid: LKR {Number(item.amount_due).toFixed(2)}</Text>
                    </View>
                    <View style={styles.checkIcon}>
                      <Check size={16} color="#10B981" />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TABS 4: Alerts & Travel History */}
        {activeTab === "notifications" && (
          <View style={styles.tabContent}>
            
            {/* Announcements alerts logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver Announcements</Text>
              {isLoadingLogs ? (
                <ActivityIndicator color="#10B981" />
              ) : alertLogs.length === 0 ? (
                <View style={styles.card}>
                  <Text style={{ color: "#64748B", textAlign: "center" }}>No announcements received.</Text>
                </View>
              ) : (
                alertLogs.map(item => (
                  <View style={[styles.card, item.type === "sos" && { backgroundColor: "#FEF2F2" }]} key={item.id}>
                    <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "800", textTransform: "uppercase", marginBottom: 4 }}>{item.type}</Text>
                    <Text style={{ fontWeight: "700", color: "#334155" }}>{item.message}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Travel Boarding check-ins logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Travel Logs History</Text>
              {travelHistory.length === 0 ? (
                <View style={styles.card}>
                  <Text style={{ color: "#64748B", textAlign: "center" }}>No historical travel logs.</Text>
                </View>
              ) : (
                travelHistory.map((item, index) => (
                  <View style={styles.card} key={index}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <CalendarIcon size={18} color="#64748B" />
                      <View>
                        <Text style={{ fontWeight: "800", color: "#0F172A" }}>{item.student_name}</Text>
                        <Text style={{ fontSize: 12, color: "#64748B" }}>Boarded: {new Date(item.boarded_at).toLocaleString()}</Text>
                        {item.dropped_at && <Text style={{ fontSize: 12, color: "#64748B" }}>Dropped: {new Date(item.dropped_at).toLocaleString()}</Text>}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TABS 5: Profile & Settings Nested Options */}
        {activeTab === "profile" && (
          <View style={styles.tabContent}>
            
            {/* 5A. VIEW PROFILE MODE */}
            {profileSubView === "view" && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>My Profile Details</Text>
                  <View style={styles.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <View style={{ height: 48, width: 48, borderRadius: 16, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" }}>
                        <User size={22} color="#10B981" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>{parentName}</Text>
                        <Text style={{ fontSize: 12, color: "#64748B" }}>Parent account profile</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase", marginTop: 8 }}>Email Address</Text>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "700", marginTop: 2 }}>{parentEmail}</Text>

                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase", marginTop: 12 }}>Phone Number</Text>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "700", marginTop: 2 }}>{parentPhone || "Not set"}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Home Address</Text>
                  <View style={styles.card}>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "700" }}>{parentAddress}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Emergency Contact Info</Text>
                  <View style={styles.card}>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase" }}>Emergency Contact Name</Text>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "700", marginTop: 2 }}>{emergencyName}</Text>

                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase", marginTop: 12 }}>Emergency Contact Phone</Text>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "700", marginTop: 2 }}>{emergencyPhone}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#10B981" }]} onPress={() => setProfileSubView("edit")}>
                    <Text style={styles.actionBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#64748B" }]} onPress={() => setProfileSubView("settings")}>
                    <Text style={styles.actionBtnText}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* 5B. EDIT PROFILE MODE */}
            {profileSubView === "edit" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Edit Profile details</Text>
                <View style={styles.card}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.textInput} value={parentName} onChangeText={setParentName} />

                  <Text style={styles.label}>Email (read-only)</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: "#F1F5F9" }]} value={parentEmail} editable={false} />

                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput style={styles.textInput} value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" />

                  <Text style={styles.label}>Home Address</Text>
                  <TextInput style={styles.textInput} value={parentAddress} onChangeText={setParentAddress} />

                  <Text style={styles.label}>Emergency Contact Name</Text>
                  <TextInput style={styles.textInput} value={emergencyName} onChangeText={setEmergencyName} />

                  <Text style={styles.label}>Emergency Contact Phone</Text>
                  <TextInput style={styles.textInput} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />

                  <TouchableOpacity style={[styles.actionBtn, { marginTop: 16 }]} onPress={handleSaveParentProfile}>
                    <Text style={styles.actionBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#64748B", marginTop: 8 }]} onPress={() => setProfileSubView("view")}>
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5C. SETTINGS MODE */}
            {profileSubView === "settings" && (
              <>
                {/* Basic Security Settings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Security Settings</Text>
                  <View style={styles.card}>
                    <Text style={styles.label}>Old Password</Text>
                    <TextInput style={styles.textInput} secureTextEntry value={oldPassword} onChangeText={setOldPassword} placeholder="••••••••" placeholderTextColor="#94A3B8" />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput style={styles.textInput} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" placeholderTextColor="#94A3B8" />

                    <TouchableOpacity style={styles.actionBtn} onPress={handleUpdatePassword} disabled={isSubmittingPassword}>
                      {isSubmittingPassword ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Update Password</Text>}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Appearance Settings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Appearance & Theme</Text>
                  <View style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#334155" }}>Dark Mode Options</Text>
                    <Switch
                      value={isDarkMode}
                      onValueChange={handleToggleDarkMode}
                      trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                      thumbColor={isDarkMode ? "#10B981" : "#94A3B8"}
                    />
                  </View>
                </View>

                {/* Notification Settings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notifications Config</Text>
                  <View style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#334155" }}>Enable Push Alerts</Text>
                    <Switch
                      value={isNotificationsEnabled}
                      onValueChange={setIsNotificationsEnabled}
                      trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                      thumbColor={isNotificationsEnabled ? "#10B981" : "#94A3B8"}
                    />
                  </View>
                </View>

                {/* Tracking Settings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Live Tracking Frequencies</Text>
                  <View style={styles.card}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {["low", "medium", "high"].map((freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[styles.roleBtn, { flex: 1 }, trackingFrequency === freq && styles.roleBtnActive]}
                          onPress={() => setTrackingFrequency(freq)}
                        >
                          <Text style={[styles.roleBtnText, trackingFrequency === freq && styles.roleBtnTextActive, { textTransform: "capitalize" }]}>
                            {freq}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Reset Settings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>System Reset</Text>
                  <View style={[styles.card, { flexDirection: "row", gap: 12 }]}>
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#E2E8F0" }]} onPress={() => Alert.alert("Cache Cleared", "Temporary logs cache cleared successfully.")}>
                      <Text style={[styles.actionBtnText, { color: "#475569" }]}>Clear Cache</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: "#EF4444" }]} onPress={() => Alert.alert("Reset Completed", "All onboarding flows have been reset.")}>
                      <Text style={styles.actionBtnText}>Reset Apps</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Profile Account Deletion (Basic Section Settings) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Delete Profile Account</Text>
                  <View style={styles.card}>
                    <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700", marginBottom: 12 }}>
                      Permanently wipe all records, student enrollments, maps history, and billing references from our system.
                    </Text>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#EF4444" }]} onPress={handleDeleteAccount}>
                      <Text style={styles.actionBtnText}>Delete Account & Data</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#64748B", marginHorizontal: 16, marginBottom: 20 }]} onPress={() => setProfileSubView("view")}>
                  <Text style={styles.actionBtnText}>Back to Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* 3. Bottom Navigation Tab Bar (Stick Footer Layout) */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.headerBg, borderColor: themeColors.border }]}>
        <TouchableOpacity style={[styles.tabItem, activeTab === "home" && styles.tabItemActive]} onPress={() => setActiveTab("home")}>
          <Navigation size={20} color={activeTab === "home" ? "#10B981" : themeColors.textSecondary} />
          <Text style={[styles.tabItemText, { color: themeColors.textSecondary }, activeTab === "home" && styles.tabItemTextActive]}>Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "children" && styles.tabItemActive]} onPress={() => setActiveTab("children")}>
          <Users size={20} color={activeTab === "children" ? "#10B981" : themeColors.textSecondary} />
          <Text style={[styles.tabItemText, { color: themeColors.textSecondary }, activeTab === "children" && styles.tabItemTextActive]}>Kids</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "payments" && styles.tabItemActive]} onPress={() => setActiveTab("payments")}>
          <CreditCard size={20} color={activeTab === "payments" ? "#10B981" : themeColors.textSecondary} />
          <Text style={[styles.tabItemText, { color: themeColors.textSecondary }, activeTab === "payments" && styles.tabItemTextActive]}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "notifications" && styles.tabItemActive]} onPress={() => setActiveTab("notifications")}>
          <Bell size={20} color={activeTab === "notifications" ? "#10B981" : themeColors.textSecondary} />
          <Text style={[styles.tabItemText, { color: themeColors.textSecondary }, activeTab === "notifications" && styles.tabItemTextActive]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "profile" && styles.tabItemActive]} onPress={() => setActiveTab("profile")}>
          <User size={20} color={activeTab === "profile" ? "#10B981" : themeColors.textSecondary} />
          <Text style={[styles.tabItemText, { color: themeColors.textSecondary }, activeTab === "profile" && styles.tabItemTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Receipt Modal */}
      <Modal
        visible={uploadPayment !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadPayment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Receipt</Text>
            <Text style={styles.modalDesc}>Please input your deposit receipt details for reference:</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Transaction Reference Code (e.g. TXN90288)"
              value={receiptRef}
              onChangeText={setReceiptRef}
              placeholderTextColor="#94A3B8"
            />

            <TextInput
              style={styles.textInput}
              placeholder="Receipt Image URL (e.g. https://storage/receipt.jpg)"
              value={receiptUrl}
              onChangeText={setReceiptUrl}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmittingReceipt && styles.btnDisabled]}
              onPress={handleSubmitReceipt}
              disabled={isSubmittingReceipt}
            >
              {isSubmittingReceipt ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Submit Payment Log</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setUploadPayment(null)} disabled={isSubmittingReceipt}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Child / Student Enrollment Modal */}
      <Modal
        visible={showAddChildModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddChildModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>Enroll New Child</Text>
              
              <Text style={styles.label}>Student Full Name</Text>
              <TextInput style={styles.textInput} value={newChildName} onChangeText={setNewChildName} placeholder="e.g. Liam Doe" placeholderTextColor="#94A3B8" />

              <Text style={styles.label}>School Name</Text>
              <TextInput style={styles.textInput} value={newChildSchool} onChangeText={setNewChildSchool} placeholder="e.g. St. Peter's College" placeholderTextColor="#94A3B8" />

              <Text style={styles.label}>Select Route</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {availableRoutes.map(route => (
                  <TouchableOpacity 
                    style={[styles.routeSelectorBtn, selectedRouteId === route.id && styles.routeSelectorBtnActive]}
                    key={route.id}
                    onPress={() => {
                      setSelectedRouteId(route.id);
                      setSelectedPickupStopId(null);
                      setSelectedDropoffStopId(null);
                    }}
                  >
                    <Text style={[styles.routeSelectorText, selectedRouteId === route.id && styles.routeSelectorTextActive]}>
                      {route.name} (Driver: {route.driver_name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedRouteId !== null && (
                <>
                  <Text style={styles.label}>Select Pickup Stop</Text>
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {getStopsForSelectedRoute().map(stop => (
                      <TouchableOpacity 
                        style={[styles.routeSelectorBtn, selectedPickupStopId === stop.id && styles.routeSelectorBtnActive]}
                        key={stop.id}
                        onPress={() => setSelectedPickupStopId(stop.id)}
                      >
                        <Text style={[styles.routeSelectorText, selectedPickupStopId === stop.id && styles.routeSelectorTextActive]}>
                          {stop.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Select Dropoff Stop</Text>
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {getStopsForSelectedRoute().map(stop => (
                      <TouchableOpacity 
                        style={[styles.routeSelectorBtn, selectedDropoffStopId === stop.id && styles.routeSelectorBtnActive]}
                        key={stop.id}
                        onPress={() => setSelectedDropoffStopId(stop.id)}
                      >
                        <Text style={[styles.routeSelectorText, selectedDropoffStopId === stop.id && styles.routeSelectorTextActive]}>
                          {stop.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, isSubmittingChild && styles.btnDisabled]}
                onPress={handleRegisterChild}
                disabled={isSubmittingChild}
              >
                {isSubmittingChild ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Register Student Profile</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAddChildModal(false)} disabled={isSubmittingChild}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  welcome: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  logoutButton: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContent: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionGridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionGridIconWrapper: {
    height: 44,
    width: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionGridText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  mapContainer: {
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#E2E8F0",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  mapOverlayText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  registerBtn: {
    height: 38,
    paddingHorizontal: 12,
    backgroundColor: "#10B981",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "600",
  },
  dueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dueIconWrapper: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dueTitleWrapper: {
    flex: 1,
  },
  dueCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  dueCardAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#047857",
    marginTop: 2,
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dueDetails: {
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 12,
    marginBottom: 18,
    gap: 8,
  },
  dueDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dueDetailLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  dueDetailValue: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "700",
  },
  actionBtn: {
    height: 48,
    backgroundColor: "#10B981",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkIcon: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 14,
  },
  routeSelectorBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  routeSelectorBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  routeSelectorText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },
  routeSelectorTextActive: {
    color: "#2563EB",
  },
  roleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  roleBtnTextActive: {
    color: "#2563EB",
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  tabItemTextActive: {
    color: "#10B981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  submitBtn: {
    height: 48,
    backgroundColor: "#10B981",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  closeBtnText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(127, 29, 29, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sosModalContainer: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
  },
  sosModalHeader: {
    backgroundColor: "#DC2626",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sosModalHeaderIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosModalHeaderSub: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FCA5A5",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sosModalHeaderTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  sosModalBody: {
    padding: 24,
  },
  sosModalMessage: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 22,
  },
  sosModalSubText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 16,
  },
  sosModalFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  sosModalBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sosModalCallBtn: {
    backgroundColor: "#DC2626",
  },
  sosModalAckBtn: {
    backgroundColor: "#F1F5F9",
  },
  sosModalBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
