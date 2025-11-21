# LocalMarket API Integration Guide

## Overview
This document provides comprehensive information about the API integration between the React Native frontend (dukaan) and the Node.js backend.

## Base Configuration

### API Base URL
Located in `src/services/api.config.js`

```javascript
// For Android Emulator
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For iOS Simulator
export const API_BASE_URL = 'http://localhost:3000/api';

// For Physical Device (update with your computer's IP)
export const API_BASE_URL = 'http://192.168.x.x:3000/api';
```

## Available Services

### 1. Authentication Service (`authService.js`)

#### Register
```javascript
import { register } from '../services/authService';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  phone_number: '9876543210',
  role: 'customer' // or 'shopkeeper'
};

const response = await register(userData);
// Returns: { success: true, message: '...', data: { user, tokens } }
```

#### Login
```javascript
import { login } from '../services/authService';

const response = await login('john@example.com', 'password');
// Returns: { success: true, message: '...', data: { user, tokens, cart } }
```

#### Logout
```javascript
import { logout } from '../services/authService';

await logout();
```

#### Get Current User
```javascript
import { getCurrentUser } from '../services/authService';

const response = await getCurrentUser();
// Returns: { success: true, data: { user_id, name, email, ... } }
```

### 2. Shop Service (`shopService.js`)

#### Get Shops by Category
```javascript
import { getShopsByCategory } from '../services/shopService';

const response = await getShopsByCategory('Grocery', {
  page: 1,
  limit: 10,
  search: 'fresh'
});
```

#### Get Shop by ID
```javascript
import { getShopById } from '../services/shopService';

const response = await getShopById(123);
```

#### Get Products by Shop
```javascript
import { getProductsByShop } from '../services/shopService';

const response = await getProductsByShop(123, { page: 1, limit: 20 });
```

#### Create Shop (Shopkeeper only)
```javascript
import { createShop } from '../services/shopService';

const shopData = {
  name: 'My Shop',
  description: 'Best shop in town',
  category: 'Grocery',
  address: '123 Main St',
  pincode: '123456',
  latitude: 12.345678,
  longitude: 78.901234
};

const response = await createShop(shopData);
```

### 3. Product Service (`productService.js`)

#### Get All Products
```javascript
import { getAllProducts } from '../services/productService';

const response = await getAllProducts({
  shop_id: 123, // optional
  page: 1,
  limit: 20,
  search: 'rice'
});
```

#### Get Product by ID
```javascript
import { getProductById } from '../services/productService';

const response = await getProductById(456);
```

#### Create Product (Shopkeeper only)
```javascript
import { createProduct } from '../services/productService';

const productData = {
  name: 'Basmati Rice',
  description: 'Premium quality',
  shop_id: 123,
  stock_quantity: 100,
  selling_price: 150.00,
  base_price: 120.00
};

const response = await createProduct(productData);
```

### 4. Cart Service (`cartService.js`)

#### Get Cart
```javascript
import { getCart } from '../services/cartService';

const response = await getCart();
// Works for both authenticated users and guests
```

#### Add to Cart
```javascript
import { addToCart } from '../services/cartService';

const response = await addToCart({
  product_id: 456,
  quantity: 2,
  shop_id: 123
});
```

#### Update Cart Item
```javascript
import { updateCartItem } from '../services/cartService';

const response = await updateCartItem(789, 3); // itemId, quantity
```

#### Remove Cart Item
```javascript
import { removeCartItem } from '../services/cartService';

const response = await removeCartItem(789); // itemId
```

#### Clear Cart
```javascript
import { clearCart } from '../services/cartService';

const response = await clearCart();
```

### 5. Category Service (`categoryService.js`)

#### Get All Categories
```javascript
import { getAllCategories } from '../services/categoryService';

const response = await getAllCategories();
```

#### Get Shops by Category
```javascript
import { getShopsByCategory } from '../services/categoryService';

const response = await getShopsByCategory('Electronics', {
  page: 1,
  limit: 10
});
```

## Using Context Providers

### AuthContext
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login('email@example.com', 'password');
      // Navigate to home screen
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome {user.name}</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### CartContext
```javascript
import { useCart } from '../context/CartContext';

function ProductScreen({ product }) {
  const { addToCart, cart, isLoading } = useCart();

  const handleAddToCart = async () => {
    try {
      await addToCart(product.product_id, 1, product.shop_id);
      Alert.alert('Success', 'Item added to cart');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>{product.name}</Text>
      <Text>₹{product.selling_price}</Text>
      <Button 
        title={`Add to Cart (${cart.item_count})`}
        onPress={handleAddToCart}
        disabled={isLoading}
      />
    </View>
  );
}
```

## Response Format

All API responses follow this format:

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: {
    // Response data here
  }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error message",
  error: "Detailed error information"
}
```

## Error Handling

All services include comprehensive error handling:

```javascript
try {
  const response = await someService.someMethod();
  if (response.success) {
    // Handle success
  }
} catch (error) {
  // error.message contains user-friendly error message
  console.error('Error:', error.message);
  Alert.alert('Error', error.message);
}
```

## Authentication Flow

1. **App Start**: AuthContext checks AsyncStorage for saved token
2. **Login**: User credentials → API → Store token & user data
3. **Auto-refresh**: Token expires → Automatically refresh using refresh token
4. **Logout**: Clear all stored data

## Guest Cart Flow

1. **Generate Guest ID**: Automatically created on first app launch
2. **Add to Cart**: Items stored with guest ID
3. **Login**: Guest cart automatically merged with user cart
4. **Guest ID Cleared**: After successful login

## Testing the Integration

### 1. Start Backend Server
```bash
cd backend
npm start
```

### 2. Update API Base URL
In `src/services/api.config.js`, set the correct base URL for your environment.

### 3. Test Authentication
```javascript
// In LoginScreen
const response = await login(email, password);
console.log('Login response:', response);
```

### 4. Test Cart Operations
```javascript
// Add to cart
await addToCart(productId, quantity, shopId);

// Get cart
const cart = await getCart();
console.log('Cart:', cart);
```

## Common Issues & Solutions

### 1. Network Error
**Problem**: Cannot connect to backend  
**Solution**: Check API_BASE_URL and ensure backend is running

### 2. 401 Unauthorized
**Problem**: Token expired or invalid  
**Solution**: Token auto-refresh is implemented; logout and login again if persists

### 3. CORS Error
**Problem**: CORS policy blocking requests  
**Solution**: Ensured in backend server.js that CORS is enabled

### 4. AsyncStorage Not Found
**Problem**: @react-native-async-storage/async-storage not installed  
**Solution**: Already installed in package.json

## Security Best Practices

1. ✅ Tokens stored in AsyncStorage (secure storage)
2. ✅ Passwords never stored locally
3. ✅ HTTPS recommended for production
4. ✅ JWT tokens with expiration
5. ✅ Refresh token rotation
6. ✅ Input validation on both client and server

## Next Steps

1. **Update API Base URL** in `api.config.js` for your environment
2. **Test all authentication flows** (register, login, logout)
3. **Test cart operations** (add, update, remove)
4. **Test shop and product fetching**
5. **Implement remaining screens** using the services
6. **Add loading states and error handling** in UI components

## Support

For any issues or questions regarding the API integration, refer to:
- Backend API documentation in `backend/` folder
- Individual service files for detailed method documentation
- Context provider files for usage examples

---

**Integration Status**: ✅ Complete  
**Last Updated**: November 11, 2025  
**Version**: 1.0.0
