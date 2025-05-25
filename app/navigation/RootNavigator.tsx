import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./BottomTabNavigator";
import AddRouteScreen from "../addRoute";
import OrdersScreen from "../OrdersScreen";
import ClientsScreen from "../ClientsScreen";
import RoutesScreen from "../RoutesScreen";
import ProductsScreen from "../ProductsScreen";
import OrderDetailsScreen from "../OrderDetailsScreen";
import EditPriceScreen from "../EditPriceScreen";
import AddScreen from "../screens/AddScreen";
import Login from "../login";

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
    >
      {/* Main Tabs */}
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator} 
        options={{ headerShown: false}}
      />

      {/* Standalone Screens with Headers */}
      <Stack.Screen 
        name="AddRoute" 
        component={AddRouteScreen} 
        options={{ headerShown: true}} 
      />
      <Stack.Screen 
        name="OrdersScreen" 
        component={OrdersScreen} 
        options={{ headerShown: true}} 
      />
      <Stack.Screen 
        name="OrderDetailsScreen" 
        component={OrderDetailsScreen} 
        options={{ headerShown: true}} 
      />
      <Stack.Screen 
        name="ClientsScreen" 
        component={ClientsScreen} 
        options={{ headerShown: true}} 
      />
      <Stack.Screen 
        name="RoutesScreen" 
        component={RoutesScreen} 
        options={{ headerShown: true}} 
      />
      <Stack.Screen 
        name="ProductsScreen" 
        component={ProductsScreen} 
        options={{ headerShown: true}} 
      />


      <Stack.Screen
        name="EditPriceScreen"
        component={EditPriceScreen}
        options={{ title: "تعديل سعر المنتج" }}
    />
  <Stack.Screen 
  name="AddScreen" 
  component={AddScreen}
  />
   <Stack.Screen 
    name="Login" 
    component={Login} 
    options={{ headerShown: false }}
        />
    
    </Stack.Navigator>
    
  );
}
