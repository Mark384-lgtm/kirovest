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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import ApiService, { getStoredToken } from "../services/ApiService";
import Toast from "react-native-toast-message";

export default function ClientsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: number; name: string; city?: string; orders?: number }[]>([]);

  useEffect(() => {
    navigation.setOptions({
      title: "العُملاء",
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

    fetchClients();
  }, [navigation]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("https://kirovest.org/api/clients", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (json.success && json.data.length > 0) {
        setClients(json.data.map(client => ({
          id: client.id,
          name: client.name,
          city: client.nationality || "غير محدد", // Use nationality as city if available
          orders: client.orders || 0, // Default orders count if not available
        })));
      } else {
        throw new Error("No clients found");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "فشل في جلب العملاء",
      });
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن عميل..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Clients List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066b3" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {clients.filter((client) => client.name.includes(searchQuery)).length > 0 ? (
            clients
              .filter((client) => client.name.includes(searchQuery))
              .map((item) => (
                <View key={item.id} style={styles.clientCard}>
                  <View style={styles.clientInfo}>
                    <View style={styles.iconWrapper}>
                      <Icon name="person-circle-outline" size={40} color="#0066b3" />
                    </View>
                    <View>
                      <Text style={styles.clientName}>{item.name}</Text>
                      <Text style={styles.clientDetails}>المدينة: {item.city}</Text>
                      <Text style={styles.clientDetails}>عدد الطلبيات: {item.orders}</Text>
                    </View>
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا يوجد عملاء</Text>
            </View>
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
  clientCard: {
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
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3efff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  clientName: {
    fontSize: 18,
    fontFamily: "Tajawal",
    fontWeight: "bold",
  },
  clientDetails: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#666",
    textAlign: "right",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Tajawal",
    color: "#666",
  },
  backButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
});

