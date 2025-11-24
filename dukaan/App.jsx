import { View, Text, Platform, StatusBar } from 'react-native'
import React from 'react'
import RootNavigator from './src/navigation/RootNavigator'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import { AddressProvider } from './src/context/AddressContext'
import { OrderProvider } from './src/context/OrderContext'

const App = () => {
  return (
    <AuthProvider>
        <AddressProvider>
      <CartProvider>
         <OrderProvider>
        {Platform.OS === 'android' && (
          <View style={{ height: StatusBar.currentHeight, backgroundColor: '#1d740cff' }} />
        )}
        <StatusBar  
          backgroundColor="#086614ff" 
          style="light" 
          barStyle="light-content"
          hidden={false} 
          translucent={true} 
        />
        <RootNavigator />
        </OrderProvider>
      </CartProvider>
      </AddressProvider>
    </AuthProvider>
  )
}

export default App