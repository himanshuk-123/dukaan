import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Authentication/LoginScreen';
import RegisterScreen from '../screens/Authentication/RegisterScreen';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import CategoryScreen from '../screens/Customers/CategoryScreen';
import ShopsListScreen from '../screens/Customers/ShopsListScreen ';
import ShopDetailScreen from '../screens/Customers/ShopDetailScreen';
import CartScreen from '../screens/Customers/CartScreen';
import CheckoutScreen from '../screens/Customers/CheckoutScreen';
import AddAddressScreen from '../screens/Customers/AddAddressScreen';
import ProfileScreen from '../screens/Customers/ProfileScreen';
import OrdersScreen from '../screens/Customers/OrdersScreen';
const Stack = createNativeStackNavigator();

const AuthNavigator = () =>{
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

const CustomerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
      <Stack.Screen name="ShopsList" component={ShopsListScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  )
}
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }
  return (
    <NavigationContainer>
      {isAuthenticated ? <CustomerNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
export default RootNavigator; 