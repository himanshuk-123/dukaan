# LocalMarket API Integration - Final Checklist

## ✅ COMPLETED TASKS

### 1. API Services Created
- ✅ `src/services/api.config.js` - API configuration and endpoints
- ✅ `src/services/authService.js` - Authentication service
- ✅ `src/services/shopService.js` - Shop operations  
- ✅ `src/services/productService.js` - Product operations
- ✅ `src/services/cartService.js` - Cart management
- ✅ `src/services/categoryService.js` - Category operations
- ✅ `src/services/index.js` - Central export file

### 2. Context Providers Updated
- ✅ `src/context/AuthContext.js` - Uses real authService

## ⚠️ MANUAL ACTIONS REQUIRED

### CRITICAL: Update CartContext.js

**File**: `src/context/CartContext.js`

**Action**: Replace the entire content with the implementation from `CartContext_IMPLEMENTATION.txt`

**Why**: Technical file corruption issue - manual copy required

**Steps**:
1. Open `CartContext_IMPLEMENTATION.txt` (created in project root)
2. Copy ALL content
3. Open `src/context/CartContext.js`
4. Delete any existing content (if any)
5. Paste the copied content
6. Save the file

---

## 🔧 REQUIRED UPDATES TO CUSTOMER SCREENS

The following screens need to be updated to use real API services instead of staticData:

### 1. HomeScreen.jsx
**File**: `src/screens/Customers/HomeScreen.jsx`  
**Line**: 16  
**Change**: 
```javascript
// OLD
import { categoryService } from '../../services/staticData';

// NEW
import { categoryService } from '../../services';
```

### 2. CategoryShopsScreen.jsx
**File**: `src/screens/Customers/CategoryShopsScreen.jsx`  
**Line**: 17  
**Change**: 
```javascript
// OLD
import { shopService, categoryService } from '../../services/staticData';

// NEW
import { shopService, categoryService } from '../../services';
```

### 3. ShopDetailScreen.jsx
**File**: `src/screens/Customers/ShopDetailScreen.jsx`  
**Line**: 18  
**Change**: 
```javascript
// OLD
import { shopService } from '../../services/staticData';

// NEW
import { shopService } from '../../services';
```

### 4. ProductDetailScreen.jsx
**File**: `src/screens/Customers/ProductDetailScreen.jsx`  
**Line**: 17  
**Change**: 
```javascript
// OLD
import { productService, shopService } from '../../services/staticData';

// NEW
import { productService, shopService } from '../../services';
```

### 5. ShopProductsScreen.jsx
**File**: `src/screens/Customers/ShopProductsScreen.jsx`  
**Line**: 17  
**Change**: 
```javascript
// OLD
import { productService, shopService } from '../../services/staticData';

// NEW
import { productService, shopService } from '../../services';
```

---

## 🛠️ REQUIRED UPDATES TO SHOPKEEPER SCREENS

### 6. ShopkeeperDashboard.jsx
**File**: `src/screens/ShopKeeper/ShopkeeperDashboard.jsx`  
**Line**: 17  
**Change**: 
```javascript
// OLD
import { shopService } from '../../services/staticData';

// NEW
import { shopService } from '../../services';
```

### 7. MyShopsScreen.jsx
**File**: `src/screens/ShopKeeper/MyShopsScreen.jsx`  
**Line**: 17  
**Change**: 
```javascript
// OLD
import { shopService, categoryService } from '../../services/staticData';

// NEW
import { shopService, categoryService } from '../../services';
```

---

## ⚙️ CONFIGURATION REQUIRED

### Update API Base URL

**File**: `src/services/api.config.js`

**For Android Emulator**: Already set correctly
```javascript
export const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

**For iOS Simulator**: Change to
```javascript
export const API_BASE_URL = 'http://localhost:3000/api';
```

**For Physical Device**: Change to your computer's IP
```javascript
// Find your IP: Open cmd > type "ipconfig" > look for IPv4 Address
export const API_BASE_URL = 'http://192.168.x.x:3000/api';
```

---

## 🧪 TESTING CHECKLIST

After completing above changes, test the following:

### Authentication Flow
- [ ] Open app (should work even without backend)
- [ ] Register new user
- [ ] Login with credentials
- [ ] Check if user data is displayed
- [ ] Logout
- [ ] Login again (token persistence)

### Cart Operations (Guest)
- [ ] Browse products without login
- [ ] Add items to cart as guest
- [ ] Update quantities
- [ ] Remove items
- [ ] Check cart persists after app restart

### Cart Operations (Authenticated)
- [ ] Login after adding items as guest
- [ ] Verify guest cart merges with user cart
- [ ] Add more items as logged-in user
- [ ] Complete checkout flow

### Shop & Product Browsing
- [ ] View all categories
- [ ] Click category to see shops
- [ ] View shop details
- [ ] View shop products
- [ ] View product details
- [ ] Search products

### Shopkeeper Features
- [ ] Login as shopkeeper
- [ ] View dashboard
- [ ] Create new shop
- [ ] Add products to shop
- [ ] Update inventory
- [ ] Manage orders

---

## 🚨 COMMON ERRORS & SOLUTIONS

### Error: "Network request failed"
**Cause**: Backend not running or wrong API URL  
**Solution**: 
1. Start backend: `cd backend && npm start`
2. Check API_BASE_URL in api.config.js

### Error: "Cannot read property 'items' of undefined"
**Cause**: CartContext not updated  
**Solution**: Follow "Update CartContext.js" steps above

### Error: "AsyncStorage is not defined"
**Cause**: Expo or React Native setup issue  
**Solution**: Restart Metro bundler and rebuild app

### Error: "401 Unauthorized"
**Cause**: Token expired or invalid  
**Solution**: Logout and login again

### Error: Services not working after update
**Cause**: Import statements still pointing to staticData  
**Solution**: Update all import statements as listed above

---

## 📝 QUICK FIX COMMANDS

### Fix All Import Statements at Once

**Option 1: Manual Find & Replace**
1. Open VS Code
2. Press `Ctrl+Shift+H` (Find & Replace in Files)
3. Find: `from '../../services/staticData'`
4. Replace: `from '../../services'`
5. Click "Replace All"

**Option 2: PowerShell Command**
```powershell
# Run from dukaan folder
Get-ChildItem -Path ".\src\screens" -Recurse -Filter "*.jsx" | ForEach-Object {
    (Get-Content $_.FullName) -replace "from '../../services/staticData'", "from '../../services'" | Set-Content $_.FullName
}
```

---

## ✨ VERIFICATION STEPS

After completing ALL manual actions:

1. **Rebuild the app**:
   ```bash
   cd dukaan
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

2. **Check for errors**:
   - Watch Metro bundler console
   - Check app debug console (React Native Debugger)
   - Look for red screen errors

3. **Test API connectivity**:
   - Start backend server
   - Try login in the app
   - Check network tab in React Native Debugger

4. **Verify cart functionality**:
   - Add item as guest
   - Login
   - Check cart still has items

---

## 📦 FILES CREATED FOR REFERENCE

1. **`API_INTEGRATION_GUIDE.md`** - Complete API usage documentation
2. **`CartContext_IMPLEMENTATION.txt`** - Ready-to-copy CartContext code
3. **`MANUAL_ACTIONS_CHECKLIST.md`** - This file

---

## 📞 SUPPORT

If you encounter any issues:

1. Check backend is running: `http://localhost:3000/api/users/me` should respond
2. Verify all import statements are updated
3. Ensure CartContext.js is properly updated
4. Check API_BASE_URL matches your setup
5. Review error messages in console

---

**Status**: ⚠️ Manual actions required before testing  
**Priority**: HIGH - Complete CartContext.js first  
**Estimated Time**: 15-20 minutes for all updates  
**Last Updated**: November 11, 2025
