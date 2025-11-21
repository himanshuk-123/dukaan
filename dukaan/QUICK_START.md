# 🚀 QUICK START - Just 4 Steps!

## ⏱️ Total Time: 5-10 Minutes

---

## STEP 1: Update CartContext (2 min)

1. **Open** `CartContext_IMPLEMENTATION.txt` (in dukaan folder)
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)
4. **Open** `src/context/CartContext.js`
5. **Select All** (Ctrl+A)
6. **Paste** (Ctrl+V)
7. **Save** (Ctrl+S)

✅ **Done!** CartContext now uses real backend API

---

## STEP 2: Start Backend (1 min)

Open PowerShell in backend folder:

```powershell
cd e:\Projects\LocalMarket\backend
npm start
```

✅ **Check:** You should see "Server is running on port 3000"

---

## STEP 3: Rebuild App (3-5 min)

Open PowerShell in dukaan folder:

```powershell
cd e:\Projects\LocalMarket\dukaan
npx react-native run-android
```

For iOS:
```powershell
npx react-native run-ios
```

✅ **Wait:** App will build and install on your device/emulator

---

## STEP 4: Test It! (2 min)

### Quick Test:
1. **Open app** on your device/emulator
2. **Register** a new account
3. **Browse** shops (should see real data)
4. **Add item** to cart
5. **Check cart** icon (should show count)

✅ **Success!** If you see real shop data, everything is working!

---

## 🔧 Only If Using Physical Device

**Update API Base URL** in `src/services/api.config.js`:

1. Find your computer's IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update the file:
   ```javascript
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

3. Rebuild app (Step 3 again)

---

## ❌ If Something Goes Wrong

### Backend not starting?
```powershell
cd backend
npm install
npm start
```

### App won't build?
```powershell
cd dukaan
npm install
npx react-native run-android --reset-cache
```

### "Network request failed"?
- Check backend is running
- For Android emulator, URL should be `http://10.0.2.2:3000/api`
- For iOS simulator, URL should be `http://localhost:3000/api`

---

## 📖 Need More Help?

Open these files in your project:

- **`COMPLETION_REPORT.md`** - Full integration details & testing guide
- **`API_INTEGRATION_GUIDE.md`** - API usage examples & documentation
- **`MANUAL_ACTIONS_CHECKLIST.md`** - Detailed troubleshooting

---

## ✅ What's Been Integrated?

✨ **Everything!**

- [x] User registration & login
- [x] Browse shops by category
- [x] View products
- [x] Add to cart (guest & logged-in users)
- [x] Shopkeeper dashboard
- [x] Create/manage shops
- [x] Add/manage products
- [x] Token authentication
- [x] Offline cart persistence

---

**That's it! Just 4 simple steps and you're ready to test! 🎉**

Questions? Check the detailed guides mentioned above.
