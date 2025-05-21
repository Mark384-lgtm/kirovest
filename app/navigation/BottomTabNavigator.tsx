import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import AccountScreen from "../screens/AccountScreen";
import AddScreen from "../screens/AddScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.focusedIconContainer,
              ]}
            >
              <View style={[focused && styles.focusedIconBackground]}>
                <Icon
                  name="home-outline"
                  size={24}
                  color={focused ? "#0066b3" : "#fff"}
                />
              </View>
            </View>
          ),
        }}
      />

      {/* Add Tab */}
      <Tab.Screen
        name="AddRoute"
        component={AddScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.focusedIconContainer,
              ]}
            >
              <View style={[focused && styles.focusedIconBackground]}>
                <Icon
                  name="add"
                  size={24}
                  color={focused ? "#0066b3" : "#fff"}
                />
              </View>
            </View>
          ),
        }}
      />

      {/* Account Tab */}
      <Tab.Screen
        name="MyAccount"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.focusedIconContainer,
              ]}
            >
              <View style={[focused && styles.focusedIconBackground]}>
                <Icon
                  name="person-outline"
                  size={24}
                  color={focused ? "#0066b3" : "#fff"}
                />
              </View>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#0066b3", // Main tab bar color
    borderRadius: 40, // Large radius for floating effect
    marginRight: 10,
    marginLeft: 10,
    direction: "rtl",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  focusedIconContainer: {
    transform: [{ translateY: -25 }], // Floating effect for focused icon
  },
  focusedIconBackground: {
    backgroundColor: "#f8f8f8", // Focused tab background color
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
