import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  SafeAreaView,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useAddress } from '../../context/AddressContext';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Success Modal Component (moved outside to prevent hooks error)
const SuccessModal = ({ visible, onClose, total, currentOrder, navigation }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successMessage}>Your order has been confirmed and will be delivered soon.</Text>
          
          <View style={styles.successDetails}>
            <Text style={styles.successDetail}>Order #: {currentOrder?.order_id || 'Processing'}</Text>
            <Text style={styles.successDetail}>Items: {currentOrder?.item_count || 0}</Text>
            <Text style={styles.successDetail}>Total: ₹{total?.toFixed(2) || '0.00'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.trackOrderButton}
            onPress={() => {
              onClose();
              navigation.navigate('Orders');
            }}
          >
            <Text style={styles.trackOrderText}>View Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => {
              onClose();
              navigation.navigate('CategoryScreen');
            }}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const CheckoutScreen = ({ navigation, route }) => {
  const [expandedSections, setExpandedSections] = useState({
    orderSummary: true,
    deliveryAddress: true,
    paymentMethod: true,
    promoCode: false
  });
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  
  const buttonScale = useRef(new Animated.Value(1)).current;
  const sectionHeights = useRef({
    orderSummary: new Animated.Value(0),
    deliveryAddress: new Animated.Value(0),
    paymentMethod: new Animated.Value(0),
    promoCode: new Animated.Value(0)
  }).current;

  // Get contexts
  const { cart, loading: cartLoading, clear: clearCart } = useCart();
  const { placeOrder, currentOrder, isLoading: orderLoading } = useOrder();
  const { addresses, defaultAddress, isLoading: addressLoading, fetchAddresses, fetchDefaultAddress } = useAddress();
  const { user } = useAuth();

  // Extract cart items and calculate totals
  const cartItems = cart?.items || [];
  const deliveryFee = 0; // Free delivery or calculate based on business logic
  
  // Calculate subtotal from cart items
  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product?.selling_price ?? item.product?.base_price ?? item.product?.price ?? 0);
    return sum + (price * item.quantity);
  }, 0);

  // Extract shop_id from cart items (assuming all items are from the same shop)
  const shopId = cartItems.length > 0 ? cartItems[0]?.product?.shop_id : null;

  const paymentMethods = [
    { id: 'CARD', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'UPI', name: 'UPI', icon: '📱' },
    { id: 'COD', name: 'Cash on Delivery', icon: '💵' }
  ];

  // Calculate order total with discount
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal - discount + deliveryFee;

  // Set default selected address and fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
    fetchDefaultAddress();
  }, []);

  useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });

    // Animate section height
    Animated.timing(sectionHeights[section], {
      toValue: expandedSections[section] ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  // Handle place order button animation
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handlePlaceOrder = async () => {
    // Validation checks
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!shopId) {
      Alert.alert('Error', 'Shop information is missing');
      return;
    }

    // Button animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();

    try {
      // Map payment method to backend format
      const paymentMethodMap = {
        'cash': 'COD',
        'CARD': 'CARD',
        'UPI': 'UPI',
        'COD': 'COD'
      };
      
      const mappedPayment = paymentMethodMap[selectedPayment] || 'COD';

      console.log('Placing order with:', {
        shop_id: shopId,
        payment_method: mappedPayment
      });

      // Place order using OrderContext
      const result = await placeOrder(shopId, mappedPayment);

      if (result?.success) {
        // Clear cart is handled by backend after successful order
        // Show success modal
        setShowSuccess(true);
      } else {
        Alert.alert('Error', result?.message || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to place order. Please try again.';
      Alert.alert('Order Failed', errorMessage);
    }
  };

  const applyPromoCode = () => {
    if (promoCode.trim() !== '') {
      setPromoApplied(true);
    }
  };

  const OrderSummarySection = () => {
    const heightAnim = sectionHeights.orderSummary.interpolate({
      inputRange: [0, 1],
      outputRange: [0, cartItems.length * 80 + 180]
    });

    if (cartLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={[styles.sectionContent, { padding: 20 }]}>
            <ActivityIndicator size="small" color="#1E3A8A" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('orderSummary')}>
          <Text style={styles.sectionTitle}>Order Summary ({cartItems.length} items)</Text>
          <Text style={styles.sectionToggle}>{expandedSections.orderSummary ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {expandedSections.orderSummary && (
          <View style={styles.sectionContent}>
            {cartItems.map(item => {
              const product = item.product || {};
              const price = parseFloat(product.selling_price ?? product.base_price ?? product.price ?? 0);
              const imageUrl = product.image_url || product.primary_image_url || 'https://via.placeholder.com/50';
              
              return (
                <View key={item.item_id || item.product_id} style={styles.orderItem}>
                  <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{product.name || 'Product'}</Text>
                    <Text style={styles.itemPrice}>₹{price.toFixed(2)} x {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>₹{(price * item.quantity).toFixed(2)}</Text>
                </View>
              );
            })}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount (10%)</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>-₹{discount.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const DeliveryAddressSection = () => {
    if (addressLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={[styles.sectionContent, { padding: 20 }]}>
            <ActivityIndicator size="small" color="#1E3A8A" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('deliveryAddress')}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.sectionToggle}>{expandedSections.deliveryAddress ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {expandedSections.deliveryAddress && (
          <View style={styles.sectionContent}>
            {addresses.length === 0 ? (
              <View style={styles.emptyAddressContainer}>
                <Text style={styles.emptyAddressText}>No addresses found</Text>
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={() => navigation.navigate('AddAddress')}
                >
                  <Text style={styles.addAddressText}>+ Add New Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {addresses.map(address => {
                  const fullAddress = `${address.house || ''}, ${address.area || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`.replace(/, ,/g, ',').trim();
                  
                  return (
                    <TouchableOpacity 
                      key={address.address_id} 
                      style={[
                        styles.addressCard,
                        selectedAddress?.address_id === address.address_id && styles.selectedAddressCard
                      ]}
                      onPress={() => setSelectedAddress(address)}
                    >
                      <View style={styles.addressHeader}>
                        <Text style={styles.addressType}>{address.full_name}</Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText}>{fullAddress}</Text>
                      <Text style={styles.addressPhone}>📱 {address.phone}</Text>
                    </TouchableOpacity>
                  );
                })}
                
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={() => navigation.navigate('AddAddress')}
                >
                  <Text style={styles.addAddressText}>+ Add New Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };
  // ...existing code...

  const PaymentMethodSection = () => {
    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('paymentMethod')}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.sectionToggle}>{expandedSections.paymentMethod ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {expandedSections.paymentMethod && (
          <View style={styles.sectionContent}>
            {paymentMethods.map(method => (
              <TouchableOpacity 
                key={method.id} 
                style={[
                  styles.paymentMethod, 
                  selectedPayment === method.id && styles.selectedPayment
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={styles.paymentName}>{method.name}</Text>
                <View style={[
                  styles.radioButton,
                  selectedPayment === method.id && styles.radioButtonSelected
                ]}>
                  {selectedPayment === method.id && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Notes for order */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Order Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Special instructions for delivery..."
                multiline={true}
                numberOfLines={3}
                value={orderNotes}
                onChangeText={setOrderNotes}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const PromoCodeSection = () => {
    return (
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('promoCode')}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <Text style={styles.sectionToggle}>{expandedSections.promoCode ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {expandedSections.promoCode && (
          <View style={styles.sectionContent}>
            {promoApplied ? (
              <View style={styles.promoApplied}>
                <Text style={styles.promoAppliedText}>Promo code applied! 10% discount</Text>
                <TouchableOpacity onPress={() => setPromoApplied(false)}>
                  <Text style={styles.removePromoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoInputContainer}>
                <TextInput
                  placeholder="Enter promo code"
                  style={styles.promoInput}
                  value={promoCode}
                  onChangeText={setPromoCode}
                />
                <TouchableOpacity style={styles.applyButton} onPress={applyPromoCode}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const isLoading = orderLoading || cartLoading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <OrderSummarySection />
        <DeliveryAddressSection />
        <PaymentMethodSection />
        <PromoCodeSection />
      </ScrollView>

      {/* Fixed Place Order Button */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePlaceOrder}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.placeOrderText}>Place Order - ₹{total.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <SuccessModal 
        visible={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        total={total} 
        currentOrder={currentOrder}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E3A8A',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionToggle: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748B',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  discountText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addressCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  emptyAddressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyAddressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-end',
  },
  editButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  addAddressButton: {
    padding: 16,
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  selectedAddressCard: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    backgroundColor: '#F0F9FF',
  },
  notesContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    height: 80,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedPayment: {
    backgroundColor: '#F0F9FF',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3B82F6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  promoInputContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  promoApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ECFDF5',
  },
  promoAppliedText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  removePromoText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  placeOrderButton: {
    backgroundColor: '#1E3A8A',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  successDetail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  trackOrderButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  trackOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueShoppingButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;