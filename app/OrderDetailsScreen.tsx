import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { getStoredToken } from "../services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "./screens/HomeScreen";
import { router } from "expo-router";

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    checkUserRole();
    navigation.setOptions({
      title: "تفاصيل الطلبية",
      headerTitleAlign: "right",
      headerStyle: { backgroundColor: "#0066b3" },
      headerTitleStyle: { fontFamily: "Tajawal", fontSize: 20, color: "#fff" },
      headerTintColor: "#fff",
    });

    fetchOrderDetails();
  }, [navigation, orderId]);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      setIsAdmin(role === "admin");
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const handleAcceptOrder = async () => {
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
        navigation.goBack();
      } else {
        Alert.alert("خطأ", json.message || "فشل في قبول الطلبية");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء قبول الطلبية. يرجى المحاولة مرة أخرى");
    }
  };

  const handleRejectOrder = async () => {
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
        navigation.goBack();
      } else {
        Alert.alert("خطأ", json.message || "فشل في رفض الطلبية");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء رفض الطلبية. يرجى المحاولة مرة أخرى");
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(
        `https://kirovest.org/api/orders/${orderId}`,
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
        console.log("Order data:", json.data);
        setOrder(json.data);
      } else {
        setError("فشل في تحميل تفاصيل الطلب");
      }
    } catch (err) {
      setError("خطأ أثناء تحميل الطلب");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0066b3" style={styles.loader} />
    );


    
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchOrderDetails}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات العميل</Text>
          <Text style={styles.detailText}>👤 الاسم: {order.client.name}</Text>
          <Text style={styles.detailText}>📍 المنطقة: {order.location}</Text>
          <Text style={styles.detailText}>📅 التاريخ: {order.appointment}</Text>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل المنتجات</Text>
          {order.services.length > 0 ? (
            order.services.map((item, index) => (
              console.log("scree", 'Orderdetailsscreen'),
              console.log("price", item.price),
              console.log("image", item.image),
              <View key={index} style={styles.productCard}>
                <Text style={styles.productText}>
                  🔹 اسم المنتج: {item.title}
                </Text>
                <Text style={styles.productText}>
                  📦 الكمية: {item.quantity}
                </Text>
                <Text style={styles.productText}>
                  💰السعر {item.price.amount} جنيه
                </Text>
               
                {item.image && (
                  <Image
                    source={{ uri: item.image.url }}
                    style={styles.productImage}
                  />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noProductsText}>
              لا توجد منتجات في هذا الطلب
            </Text>
          )}
          <Text style={styles.totalText}>
            💵 إجمالي المبلغ: {order.total} جنيه
          </Text>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الدفع</Text>
          <Text style={styles.detailText}>
            💳 طريقة السداد: {order.payment_method === "cash" ? "نقدي" : "آجل"}
          </Text>
          <Text style={styles.detailText}>
            🏦 تحت التحصيل:{" "}
            {order.payment_status === "pending" ? "مُعلق" : "مدفوع"}
          </Text>
          <Text style={styles.detailText}>
            💲 المرتجعات: {order.refund === "yes" ? "نعم" : "لا"}
          </Text>
          {order.refund === "yes" && (
            <Text style={styles.detailText}>
              💵 قيمة المرتجع: {order.refund_amount} جنيه
            </Text>
          )}
        </View>

        {/* Admin Actions */}
        {isAdmin && order?.order_status === "pending" && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.adminButton, styles.acceptButton]}
              onPress={handleAcceptOrder}
            >
              <Icon name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>قبول الطلبية</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminButton, styles.rejectButton]}
              onPress={handleRejectOrder}
            >
              <Icon name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>رفض الطلبية</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonFooter}
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })}
        >
          <Icon name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    direction: "rtl",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#0066b3",
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Tajawal",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#333",
    marginBottom: 5,
  },
  productCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  productText: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#444",
    marginBottom: 5,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 5,
  },
  noProductsText: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    marginTop: 10,
  },
  adminActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  backButtonFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066b3",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal",
    marginLeft: 5,
  },
});
