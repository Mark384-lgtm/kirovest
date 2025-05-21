import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import ApiService, { getStoredToken } from "../services/ApiService";

export default function AddRouteScreen() {
    const [weeks, setWeeks] = useState<{ id: number; title: string }[]>([]);
    const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<string>("الأحد");
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [visitObjective, setVisitObjective] = useState<string>("");
    const [loadingWeeks, setLoadingWeeks] = useState(true);
    const [loadingClients, setLoadingClients] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const navigation = useNavigation();

    useEffect(() => {
          navigation.setOptions({
            title: "إضافة خط سير",
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
                setLoadingWeeks(true);
                const token = await getStoredToken();
                if (!token) throw new Error("User not authenticated");

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
                Toast.show({ type: "error", text1: "خطأ", text2: "فشل في جلب الأسابيع" });
                console.error("Error fetching weeks:", error);
            } finally {
                setLoadingWeeks(false);
            }
        };

        const fetchClients = async () => {
            try {
                setLoadingClients(true);
                const token = await getStoredToken();
                if (!token) throw new Error("User not authenticated");

                const response = await fetch("https://kirovest.com/api/clients", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const json = await response.json();
                if (json.success && json.data.length > 0) {
                    setClients(json.data);
                    setSelectedClient(json.data[0].id); // Set default client
                }
            } catch (error) {
                Toast.show({ type: "error", text1: "خطأ", text2: "فشل في جلب العملاء" });
                console.error("Error fetching clients:", error);
            } finally {
                setLoadingClients(false);
            }
        };

        fetchWeeks();
        fetchClients();

        navigation.setOptions({
            title: "إضافة لخطوط السير",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: "#f0f4f7" },
            headerTitleStyle: { fontFamily: "Tajawal", fontSize: 20 },
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-forward" size={24} color="#0066b3" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleSubmit = async () => {
        if (!selectedWeek || !selectedDay || !selectedClient || !visitObjective) {
            Toast.show({
                type: "error",
                text1: "خطأ",
                text2: "يرجى ملء جميع الحقول",
            });
            return;
        }
    
        try {
            setSubmitting(true);
            const token = await getStoredToken();
            if (!token) throw new Error("User not authenticated");
    
            const requestData = {
                week_id: selectedWeek,
                day: selectedDay,
                client: selectedClient,
                purpose: visitObjective,
            };
    
            const response = await fetch("https://kirovest.com/api/weekly_routes/add", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });
    
            const json = await response.json();
    
            if (json.success) {
                Toast.show({
                    type: "success",
                    text1: "تم الإضافة",
                    text2: "تمت إضافة خط السير بنجاح!",
                });
    
                setTimeout(() => navigation.goBack(), 1500);
            } else {
                // If validation errors exist, show them in the Toast
                let errorMessage = json.message || "حدث خطأ غير متوقع";
    
                if (json.data) {
                    const errors = Object.values(json.data).flat().join("\n");
                    errorMessage += `\n${errors}`;
                    console.log(errorMessage);
                }
    
                Toast.show({
                    type: "error",
                    text1: "خطأ في البيانات",
                    text2: errorMessage,
                });
            }
        } catch (error) {
            console.error("Error submitting route:", error);
            Toast.show({
                type: "error",
                text1: "خطأ",
                text2: "حدث خطأ أثناء الإضافة",
            });
        } finally {
            setSubmitting(false);
        }
    };
    

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Week Picker */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>الأسبوع</Text>
                <View style={styles.pickerWrapper}>
                    {loadingWeeks ? (
                        <ActivityIndicator size="small" color="#0066b3" />
                    ) : (
                        <Picker
                            selectedValue={selectedWeek}
                            onValueChange={(itemValue) => setSelectedWeek(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item key="" label="اختر الاسبوع" value="" />
                            {weeks.map((week) => (
                                <Picker.Item key={week.id} label={week.title} value={week.id} />
                            ))}
                        </Picker>
                    )}
                </View>
            </View>

            {/* Day Picker */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>اليوم</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedDay}
                        onValueChange={(itemValue) => setSelectedDay(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item key="" label="اختر اليوم" value="" />
                        {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(
                            (day, index) => <Picker.Item key={index} label={day} value={day} />
                        )}
                    </Picker>
                </View>
            </View>

            {/* Client Picker */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>اسم العميل</Text>
                <View style={styles.pickerWrapper}>
                    {loadingClients ? (
                        <ActivityIndicator size="small" color="#0066b3" />
                    ) : (
                        <Picker
                            selectedValue={selectedClient}
                            onValueChange={(itemValue) => setSelectedClient(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item key="" label="اختر العميل" value="" />
                            {clients.map((client) => (
                                <Picker.Item key={client.id} label={client.name} value={client.name} />
                            ))}
                        </Picker>
                    )}
                </View>
            </View>

            {/* Visit Objective Input */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>هدف الزيارة</Text>
                <TextInput
                    style={styles.input}
                    value={visitObjective}
                    onChangeText={(text) => setVisitObjective(text)}
                    placeholder="ادخل هدف الزيارة"
                    placeholderTextColor="#aaa"
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                        <Icon name="checkmark" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>إضافة</Text>
                    </>
                )}
            </TouchableOpacity>
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
    backButton: {
        marginLeft: 10,
        padding: 10,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontFamily: "Tajawal",
        marginBottom: 5,
    },
    pickerWrapper: {
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    picker: {
        width: "100%",
        height: 50,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 10,
        height: 50,
        fontFamily: "Tajawal",
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0066b3",
        paddingVertical: 12,
        borderRadius: 8,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Tajawal",
        marginLeft: 5,
    },
});
