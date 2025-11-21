# React Native App Implementation Guide

## 📁 Project Structure

```
dukaan/
├── src/
│   ├── constants/          # App constants (colors, config)
│   ├── context/            # Global state management (Auth, Cart)
│   ├── navigation/         # Navigation structure
│   ├── screens/            # All screens
│   ├── services/           # Data services (static data for now)
│   ├── utils/              # Utility functions
│   └── components/         # Reusable components
├── App.jsx                 # Main app entry point
└── package.json
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd dukaan
npm install
```

### 2. Install Required Packages

The following packages are already in `package.json`:
- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`
- `@react-native-async-storage/async-storage`
- `react-native-vector-icons`
- `uuid`

### 3. Run the App

```bash
# For Android
npm run android

# For iOS
npm run ios
```

## 🏗️ Architecture Overview

### State Management

#### AuthContext (`src/context/AuthContext.js`)
- Manages user authentication state
- Provides: `user`, `token`, `isAuthenticated`, `login()`, `register()`, `logout()`, `updateUser()`
- Persists user data and tokens in AsyncStorage

#### CartContext (`src/context/CartContext.js`)
- Manages shopping cart state (works for both guest and authenticated users)
- Provides: `cart`, `guestId`, `addToCart()`, `updateCartItem()`, `removeCartItem()`, `clearCart()`, `mergeGuestCart()`
- Automatically handles guest ID generation
- Merges guest cart when user logs in

### Navigation Structure

```
MainNavigator (Root)
├── AuthNavigator (if not authenticated)
│   ├── LoginScreen
│   └── RegisterScreen
│
├── CustomerNavigator (if authenticated as customer)
│   └── Tab Navigator
│       ├── HomeTab (Stack)
│       │   ├── HomeScreen
│       │   ├── CategoryShopsScreen
│       │   ├── ShopDetailScreen
│       │   ├── ShopProductsScreen
│       │   ├── ProductDetailScreen
│       │   └── SearchScreen
│       ├── CartTab (Stack)
│       │   ├── ShoppingCartScreen
│       │   ├── CheckoutScreen
│       │   └── ProductDetailScreen
│       └── ProfileTab (Stack)
│           ├── ProfileScreen
│           └── SettingsScreen
│
└── ShopkeeperNavigator (if authenticated as shopkeeper)
    └── Tab Navigator
        ├── DashboardTab (Stack)
        │   ├── ShopkeeperDashboard
        │   ├── MyShopsScreen
        │   ├── CreateEditShopScreen
        │   ├── ShopProductsManagementScreen
        │   ├── CreateEditProductScreen
        │   ├── InventoryManagementScreen
        │   └── OrderManagementScreen
        └── ProfileTab (Stack)
            ├── ProfileScreen
            └── SettingsScreen
```

## 📝 How to Update Screens

### Pattern for Customer Screens

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ... } from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { categoryService, shopService, productService } from '../../services/staticData';
import { Colors } from '../../constants/colors';

const YourScreen = ({ navigation, route }) => {
  // Get data from route params if needed
  const { paramName } = route.params || {};
  
  // Use context hooks
  const { cart, addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Local state
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await serviceFunction();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation handlers
  const handleNavigate = () => {
    navigation.navigate('ScreenName', { param: value });
  };
  
  return (
    <View>
      {/* Your UI */}
    </View>
  );
};

export default YourScreen;
```

### Pattern for Shopkeeper Screens

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { shopService, productService } from '../../services/staticData';

const ShopkeeperScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  
  useEffect(() => {
    if (user) {
      loadShops();
    }
  }, [user]);
  
  const loadShops = async () => {
    const data = await shopService.getByOwner(user.user_id);
    setShops(data);
  };
  
  // Rest of your implementation
};
```

## 🎯 Key Features Implemented

### ✅ Authentication Flow
- Login with email/password
- Register as customer or shopkeeper
- Auto-login on app start (if token exists)
- Logout functionality
- Guest user support

### ✅ Cart Management
- Add items to cart (guest or authenticated)
- Update item quantities
- Remove items from cart
- Clear cart
- Guest cart merging on login
- Cart persists in memory (will be replaced with API calls)

### ✅ Navigation
- Automatic navigation based on authentication state
- Role-based navigation (Customer vs Shopkeeper)
- Tab navigation for main flows
- Stack navigation for detailed views

### ✅ Static Data Services
- Category service
- Shop service
- Product service
- Cart service
- Auth service (mock)

## 📋 Screens Status

### ✅ Completed
- [x] App.jsx - Main entry with providers
- [x] AuthContext - Authentication state management
- [x] CartContext - Cart state management
- [x] Navigation structure (Auth, Customer, Shopkeeper)
- [x] LoginScreen - With context integration
- [x] RegisterScreen - With context integration
- [x] ProfileScreen - With auth context
- [x] HomeScreen - With navigation and cart context

### 🔄 In Progress / Needs Update
- [ ] CategoryShopsScreen - Needs navigation and shop service
- [ ] ShopDetailScreen - Needs navigation and shop service
- [ ] ShopProductsScreen - Needs navigation and product service
- [ ] ProductDetailScreen - Needs cart context integration
- [ ] ShoppingCartScreen - Needs cart context integration
- [ ] CheckoutScreen - Needs cart context
- [ ] SearchScreen - Needs search functionality
- [ ] SettingsScreen - Needs navigation
- [ ] ShopkeeperDashboard - Needs shop service
- [ ] MyShopsScreen - Needs shop service
- [ ] CreateEditShopScreen - Needs shop service
- [ ] ShopProductsManagementScreen - Needs product service
- [ ] CreateEditProductScreen - Needs product service
- [ ] InventoryManagementScreen - Needs product service
- [ ] OrderManagementScreen - Needs order service (future)

## 🔌 Integrating APIs (Future)

When ready to integrate APIs:

1. **Update Services** (`src/services/staticData.js`)
   - Replace mock data with API calls
   - Use `API_BASE_URL` from `src/constants/config.js`
   - Add proper error handling

2. **Update Context Providers**
   - Replace static service calls with API calls
   - Add proper error handling and loading states
   - Handle token refresh if needed

3. **Update Screens**
   - Add proper error handling
   - Show loading states
   - Handle network errors

## 🧪 Testing

### Test Accounts (Static Data)

**Customer:**
- Email: `john@example.com`
- Password: `password123`

**Shopkeeper:**
- Email: `jane@example.com`
- Password: `password123`

### Test Flow

1. **Guest Flow:**
   - Open app (should show login screen if not authenticated)
   - Browse categories (as guest)
   - Add items to cart (as guest)
   - Register/Login
   - Cart should merge automatically

2. **Customer Flow:**
   - Login as customer
   - Browse categories
   - View shops
   - View products
   - Add to cart
   - View cart
   - Checkout (future)

3. **Shopkeeper Flow:**
   - Login as shopkeeper
   - View dashboard
   - Manage shops
   - Manage products
   - Update inventory

## 🐛 Troubleshooting

### Navigation Issues
- Make sure screen names match in navigator and navigation.navigate()
- Check if screen is registered in the correct navigator
- Verify route params are passed correctly

### Context Issues
- Ensure component is wrapped in provider (AuthProvider, CartProvider)
- Check if hook is called at the top level (not conditionally)
- Verify context is imported correctly

### State Issues
- Check if state is initialized properly
- Verify useEffect dependencies
- Check if data is loaded correctly from services

## 📚 Next Steps

1. **Update Remaining Screens**
   - Follow the patterns provided above
   - Integrate with context and services
   - Add proper navigation

2. **Add Error Handling**
   - Add error boundaries
   - Show user-friendly error messages
   - Handle network errors

3. **Add Loading States**
   - Show loading indicators
   - Handle empty states
   - Add pull-to-refresh

4. **API Integration**
   - Replace static services with API calls
   - Add authentication headers
   - Handle token refresh

5. **Testing**
   - Test all flows
   - Test guest cart merging
   - Test navigation
   - Test state management

## 🎨 Styling

- Use `Colors` from `src/constants/colors.js`
- Use consistent spacing and typography
- Follow the design patterns in existing screens
- Use `react-native-vector-icons` for icons

## 📱 Platform Considerations

- Test on both iOS and Android
- Handle platform-specific differences
- Use SafeAreaView for proper spacing
- Test on different screen sizes

---

**Note:** This guide assumes you're using static data. When integrating APIs, update the services and add proper error handling and loading states.

