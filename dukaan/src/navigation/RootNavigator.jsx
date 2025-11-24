import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Authentication/LoginScreen';
import RegisterScreen from '../screens/Authentication/RegisterScreen';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import BottomTabNavigator from './TabRouters/CustomerTab';
import ShopsListScreen from '../screens/Customers/ShopsListScreen ';
import ShopDetailScreen from '../screens/Customers/ShopDetailScreen';
import CartScreen from '../screens/Customers/CartScreen';
import CheckoutScreen from '../screens/Customers/CheckoutScreen';
import AddAddressScreen from '../screens/Customers/AddAddressScreen';
import OrdersScreen from '../screens/Customers/OrdersScreen';
import ShopkeeperDashboard from '../screens/ShopKeeper/ShopkeeperDashboard';
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
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="ShopsList" component={ShopsListScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  )
}

const ShopKeeperNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name='Dashboard' component={ShopkeeperDashboard} />
    </Stack.Navigator>
  )
}

const RootNavigator = () => {
  const { isAuthenticated, isLoading,user } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }
  return (
    <NavigationContainer>
      {isAuthenticated ? (user.role === 'shopkeeper' ? <ShopKeeperNavigator /> : <CustomerNavigator />) : <AuthNavigator />}
    </NavigationContainer>
  );
}
export default RootNavigator; 