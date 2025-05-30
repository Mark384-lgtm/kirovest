import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { getStoredToken } from "../services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("pending"); // Default to "pending"
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
    navigation.setOptions({
      title: "الطلبيات",
      headerTitleAlign: "right",
      headerStyle: {
        backgroundColor: "#0066b3",
      },
      headerTitleStyle: {
        fontFamily: "Tajawal",
        fontSize: 20,
        color: "#fff",
      },
      headerTintColor: "#fff",
    });

    fetchOrders(selectedStatus);
  }, [selectedStatus]); // Fetch orders when status changes

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      setIsAdmin(role === "admin");
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const fetchOrders = async (status) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(
        `https://kirovest.org/api/orders?status=${status}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();
      if (json.success) {
        setOrders(json.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      console.log("Accepting order:", orderId);
      const response = await fetch(
        `https://kirovest.org/api/orders/${orderId}/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: "finished",
          }),
        }
      );

      console.log("Accept response status:", response.status);
      const responseText = await response.text();
      console.log("Accept response text:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid server response");
      }

      if (json.success) {
        Alert.alert("نجاح", "تم قبول الطلبية بنجاح");
        fetchOrders(selectedStatus); // Refresh orders list
      } else {
        Alert.alert("خطأ", json.message || "فشل في قبول الطلبية");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء قبول الطلبية. يرجى المحاولة مرة أخرى");
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      console.log("Rejecting order:", orderId);
      const response = await fetch(
        `https://kirovest.org/api/orders/${orderId}/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: "cancelled",
          }),
        }
      );

      console.log("Reject response status:", response.status);
      const responseText = await response.text();
      console.log("Reject response text:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid server response");
      }

      if (json.success) {
        Alert.alert("نجاح", "تم رفض الطلبية بنجاح");
        fetchOrders(selectedStatus); // Refresh orders list
      } else {
        Alert.alert("خطأ", json.message || "فشل في رفض الطلبية");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء رفض الطلبية. يرجى المحاولة مرة أخرى");
    }
  };

  const filteredOrders = orders.filter((order) =>
  order.client?.name?.includes(searchQuery) || false
);

  return (
    <View style={styles.container}>
      {/* Filter Tabs for Order Status */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedStatus === "pending" && styles.activeFilter,
          ]}
          onPress={() => setSelectedStatus("pending")}
        >
          <Text
            style={[
              styles.filterText,
              selectedStatus === "pending" && styles.activeFilterText,
            ]}
          >
            مُعلقة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedStatus === "finished" && styles.activeFilter,
          ]}
          onPress={() => setSelectedStatus("finished")}
        >
          <Text
            style={[
              styles.filterText,
              selectedStatus === "finished" && styles.activeFilterText,
            ]}
          >
            مُنتهية
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedStatus === "cancelled" && styles.activeFilter,
          ]}
          onPress={() => setSelectedStatus("cancelled")}
        >
          <Text
            style={[
              styles.filterText,
              selectedStatus === "cancelled" && styles.activeFilterText,
            ]}
          >
            مرفوضة
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن طلبية..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066b3" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Icon
                    name="person-circle-outline"
                    size={40}
                    color="#0066b3"
                  />
                  <View>
                    <Text style={styles.clientName}>
                      طلبية لـ {item.client.name}
                    </Text>
                    <Text style={styles.orderDetails}>
                      📅 التاريخ: {item.appointment}
                    </Text>
                    <Text style={styles.orderDetails}>
                      📍 المدينة: {item.location}
                    </Text>
                    <Text style={styles.orderDetails}>
                      💳 الدفع:{" "}
                      {item.payment_method === "cash" ? "نقدي" : "آجل"}
                    </Text>
                    <Text style={styles.orderDetails}>
                      💰 الإجمالي: {item.total} جنيه
                    </Text>
                  </View>
                </View>
                {/* Admin Actions */}
                {isAdmin && selectedStatus === "pending" && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity
                      style={[styles.adminButton, styles.acceptButton]}
                      onPress={() => handleAcceptOrder(item.id)}
                    >
                      <Icon
                        name="checkmark-circle-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.adminButtonText}>قبول</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.adminButton, styles.rejectButton]}
                      onPress={() => handleRejectOrder(item.id)}
                    >
                      <Icon
                        name="close-circle-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.adminButtonText}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Order Details Button */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() =>
                    navigation.navigate("OrderDetailsScreen", {
                      orderId: item.id,
                    })
                  }
                >
                  <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
                  <Icon name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noOrdersText}>لا توجد طلبات متاحة</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
    direction: "rtl",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    minWidth: 100,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#0066b3",
  },
  filterText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Tajawal",
    fontSize: 16,
    textAlign: "right",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orderCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  clientName: {
    fontSize: 18,
    fontFamily: "Tajawal",
    fontWeight: "bold",
  },
  orderDetails: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#666",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066b3",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal",
    marginLeft: 5,
  },
  noOrdersText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  adminActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  acceptButton: {
    backgroundColor: "#28a745",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal",
  },
});
