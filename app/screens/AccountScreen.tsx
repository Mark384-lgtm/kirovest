import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ApiService, { clearAuthData } from "../../services/ApiService";
import { useRouter } from "expo-router";

export default function AccountScreen() {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await ApiService.getInstance().getUserData();
                console.log("Fetched user data:", data);
                setUserData(data.data);
            } catch (err) {
                setError((err as any)?.message || "فشل تحميل بيانات المستخدم.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        navigation.setOptions({
            title: "حسابي",
            headerTitleAlign: "center",
            headerStyle: {
                backgroundColor: "#f0f4f7",
                writingDirection: "rtl",
            },
            headerTitleStyle: {
                fontFamily: "Tajawal",
                fontSize: 20,
                writingDirection: "rtl",
            },
        });
    }, [navigation]);

    const handleLogout = async () => {
        await clearAuthData();
        Alert.alert("تم تسجيل الخروج", "تم تسجيل الخروج بنجاح.", [
            {
                text: "حسنًا",
                onPress: () => router.push("/login"),
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066b3" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <ScrollView
                contentContainerStyle={styles.scrollContentContainer}
                style={styles.container}
            >
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <Image
                        source={
                            userData.user_image
                                ? { uri: userData.user_image.url }
                                : require("../../assets/images/default-avatar.png")
                        }
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{userData.name}</Text>
                    <Text style={styles.email}>{userData.email}</Text>
                </View>

                {/* Info Section */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>رقم الهاتف</Text>
                        <Text style={styles.infoValue}>{userData.phone || "غير متوفر"}</Text>
                    </View>
                </View>

                {/* Settings List */}
                <View style={styles.settingsList}>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>الوضع الداكن</Text>
                        <Switch
                            value={darkMode}
                            onValueChange={(value) => setDarkMode(value)}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutButtonContainer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Designed By Text ثابت في الأسفل */}
            <Text style={styles.DesignedbyText}>Designed by YWay.co.uk</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: "#f0f4f7",
        position: "relative",
    },
    container: {
        direction: "rtl",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 80, // مساحة تحت عشان النص الثابت ما يغطيش المحتوى
        marginBottom: 10,
    },
    scrollContentContainer: {
        paddingBottom: 20,
    },
    profileCard: {
        backgroundColor: "#ffffff",
        borderRadius: 15,
        alignItems: "center",
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: "#0066b3",
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    email: {
        fontSize: 16,
        color: "#666",
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    infoCard: {
        backgroundColor: "#ffffff",
        borderRadius: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 20,
        writingDirection: "rtl",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 16,
        color: "#333",
        textAlign: "right",
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    infoValue: {
        fontSize: 16,
        color: "#666",
        textAlign: "right",
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    settingsList: {
        backgroundColor: "#ffffff",
        borderRadius: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 20,
        writingDirection: "rtl",
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomColor: "#ddd",
        borderBottomWidth: 1,
    },
    settingLabel: {
        fontSize: 16,
        color: "#333",
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    logoutButton: {
        backgroundColor: "#d9534f",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    logoutButtonContainer: {
        marginBottom: 0,
    },
    logoutButtonText: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "red",
        fontSize: 16,
        fontFamily: "Tajawal",
        writingDirection: "rtl",
    },
    DesignedbyText: {
        position: "absolute",
        bottom: 150,
        alignSelf: "center",
        color: "#D3D3D3",
        fontFamily: "Tajawal",
        fontSize: 14,
    },
});
