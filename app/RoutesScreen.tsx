import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import ApiService, { getStoredToken } from "../services/ApiService";

export default function RouteScreen() {
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [weeks, setWeeks] = useState<{ id: number; title: string }[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
      navigation.setOptions({
        title: "خطوط السير",
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
    }, [navigation]);
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const token = await getStoredToken();

        if (!token) {
          throw new Error("User not authenticated");
        }

        const response = await fetch("https://kirovest.com/api/weekly_routes/weeks", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();

        if (json.success && json.data.length > 0) {
          setWeeks(json.data);
          setSelectedWeek(json.data[0].id); // Set default week
        }
      } catch (error) {
        console.error("Error fetching weeks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek !== null) {
      fetchRoutes(selectedWeek);
    }
  }, [selectedWeek]);

  const fetchRoutes = async (weekId: number) => {
    setRoutesLoading(true);
    try {
      const token = await getStoredToken();

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`https://kirovest.com/api/weekly_routes/${weekId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.success) {
        setRoutes(json.data);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setRoutesLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>خطوط السير الأسبوعية</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("addRoute")}
        >
          <Icon name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {/* Week Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>اختر الاسبوع:</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0066b3" />
        ) : (
          <Picker
            selectedValue={selectedWeek}
            onValueChange={(itemValue) => setSelectedWeek(itemValue)}
            style={styles.picker}
          >
            {weeks.map((week) => (
              <Picker.Item key={week.id} label={week.title} value={week.id} />
            ))}
          </Picker>
        )}
      </View>

      {/* Timeline View */}
      {routesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066b3" />
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {routes.length > 0 ? (
            routes.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                {index !== routes.length && <View style={styles.verticalLine} />}

                <View style={styles.circle}>
                  <Icon name="location" size={20} color="#fff" />
                </View>

                <View style={styles.detailsContainer}>
                  <Text style={styles.cardDay}>{item.day}</Text>
                  <Text style={styles.rowText}>
                    اسم العميل: <Text style={styles.value}>{item.client}</Text>
                  </Text>
                  <Text style={styles.rowText}>
                    هدف الزيارة: <Text style={styles.value}>{item.purpose}</Text>
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا توجد خطوط سير</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: "#333",
    fontFamily: "Tajawal",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0066b3",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Tajawal",
    marginLeft: 5,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: "Tajawal",
    marginRight: 10,
  },
  picker: {
    flex: 1,
  },
  timelineContainer: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  verticalLine: {
    position: "absolute",
    width: 2,
    backgroundColor: "#0066b3",
    height: "120%",
    left: 15,
    top: -5,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0066b3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardDay: {
    fontSize: 18,
    fontFamily: "Tajawal",
    color: "#0066b3",
    marginBottom: 5,
  },
  rowText: {
    fontSize: 14,
    fontFamily: "Tajawal",
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
  },
});
