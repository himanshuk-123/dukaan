import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';

const { width, height } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const { cart, loading, error, updateItem, removeItem, clear, fetchCart } = useCart();
  const cartItems = cart.items || [];

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [selectedAddress, setSelectedAddress] = useState({
    id: '1',
    name: 'Home',
    address: '123 Main Street, Apartment 4B',
    city: 'Bangalore',
    pincode: '560001',
    isDefault: true,
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  // Calculate totals from product data
  const subtotal = cartItems.reduce((sum, item) => {
const price = parseFloat(
  item.product?.selling_price ?? item.product?.base_price ?? 0
);

    return sum + price * (item.quantity || 0);
  }, 0);
  const discount = appliedPromo ? subtotal * 0.1 : 0; // 10% discount for demo
  const total = subtotal + deliveryFee - discount;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const handleAdjustQuantity = useCallback(async (item, delta) => {
    if (loading) return;
    const newQty = (item.quantity || 0) + delta;
    if (newQty < 1) return;
    try {
      await updateItem(item.item_id, newQty);
    } catch (e) {
      Alert.alert('Update Failed', e.message || 'Please try again');
    }
  }, [loading, updateItem]);

  const confirmRemove = useCallback((item) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(item.item_id);
            } catch (e) {
              Alert.alert('Remove Failed', e.message || 'Please try again');
            }
          },
        },
      ]
    );
  }, [removeItem]);

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    // Simulate promo code validation
    if (promoCode.toUpperCase() === 'SAVE10') {
      setAppliedPromo({
        code: 'SAVE10',
        discount: 0.1, // 10% discount
      });
      Alert.alert('Success', 'Promo code applied successfully!');
    } else {
      Alert.alert('Invalid Code', 'The promo code you entered is invalid.');
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart before checkout.');
      return;
    }
    navigation.navigate('Checkout', {
      cartItems,
      subtotal,
      discount,
      deliveryFee,
      total,
      appliedPromo,
    });
  };

  const continueShopping = () => {
    navigation.goBack();
  };

  const renderCartItem = ({ item }) => {
    const price = parseFloat(
      item.product?.selling_price ?? item.product?.price ?? item.product?.base_price ?? 0
    ) || 0;
    const mrp = parseFloat(item.product?.mrp ?? item.product?.original_price ?? price) || price;
    const itemTotal = price * (item.quantity || 0);
    const savings = mrp > price ? (mrp - price) * (item.quantity || 0) : 0;

    return (
      <Animated.View style={styles.cartItem}>
        <View style={styles.itemImageContainer}>
          <Image source={{ uri: item.product?.image_url || item.product?.image || 'https://via.placeholder.com/80' }} style={styles.itemImage} />
          {item.product?.stock_quantity === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || 'Item'}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => confirmRemove(item)}
            >
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {item.product?.shop_name && <Text style={styles.itemShop}>{item.product.shop_name}</Text>}

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{price}</Text>
            {mrp > price && <Text style={styles.originalPrice}>₹{mrp}</Text>}
            {item.product?.unit && <Text style={styles.unit}>/{item.product.unit}</Text>}
          </View>
          {savings > 0 && <Text style={styles.savingsText}>You save ₹{savings}</Text>}

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDisabled]}
              onPress={() => handleAdjustQuantity(item, -1)}
              disabled={item.quantity === 1 || loading}
            >
              <Icon 
                name="remove" 
                size={16} 
                color={item.quantity === 1 ? '#ccc' : '#4CAF50'} 
              />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={[styles.quantityButton, (item.product?.stock_quantity !== undefined && item.quantity >= item.product.stock_quantity) && styles.quantityButtonDisabled]}
              onPress={() => handleAdjustQuantity(item, 1)}
              disabled={(item.product?.stock_quantity !== undefined && item.quantity >= item.product.stock_quantity) || loading}
            >
              <Icon 
                name="add" 
                size={16} 
                color={item.quantity === item.maxQuantity ? '#ccc' : '#4CAF50'} 
              />
            </TouchableOpacity>

            <Text style={styles.itemTotal}>₹{itemTotal}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="cart-outline" size={80} color="#ddd" />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added anything to your cart yet
      </Text>
      <TouchableOpacity 
        style={styles.continueShoppingButton}
        onPress={continueShopping}
      >
        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Cart</Text>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <View style={styles.sectionHeader}>
              <Icon name="location-outline" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity style={styles.changeButton}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{selectedAddress.name}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              <Text style={styles.addressCity}>
                {selectedAddress.city} - {selectedAddress.pincode}
              </Text>
            </View>
          </View>

          {/* Cart Items */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Icon name="bag-outline" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
            </View>
            
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => String(item.item_id)}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Promo Code */}
          <View style={styles.promoSection}>
            <View style={styles.sectionHeader}>
              <Icon name="pricetag-outline" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Promo Code</Text>
            </View>
            
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                editable={!appliedPromo}
              />
              <TouchableOpacity
                style={[styles.applyButton, appliedPromo && styles.appliedButton]}
                onPress={appliedPromo ? () => setAppliedPromo(null) : applyPromoCode}
                disabled={!promoCode.trim() && !appliedPromo}
              >
                <Text style={styles.applyButtonText}>
                  {appliedPromo ? 'Applied' : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>

            {appliedPromo && (
              <View style={styles.promoApplied}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.promoAppliedText}>
                  Promo code {appliedPromo.code} applied (10% off)
                </Text>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceSection}>
            <View style={styles.sectionHeader}>
              <Icon name="receipt-outline" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Price Details</Text>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>₹{subtotal}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>₹{deliveryFee}</Text>
              </View>

              {appliedPromo && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.discountText]}>
                    Discount ({appliedPromo.code})
                  </Text>
                  <Text style={[styles.priceValue, styles.discountText]}>
                    -₹{discount}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          </View>

          {/* Safety Info */}
          <View style={styles.safetySection}>
            <View style={styles.safetyInfo}>
              <Icon name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.safetyText}>
                Safe and Secure Payments. 100% Authentic Products.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutBar}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalAmount}>₹{total}</Text>
            <Text style={styles.totalLabel}>TOTAL</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={proceedToCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  continueShoppingButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  itemsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  promoSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  priceSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  safetySection: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  addressCity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemShop: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    borderColor: '#ccc',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  promoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  appliedButton: {
    backgroundColor: '#8BC34A',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  promoAppliedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  discountText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  safetyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  safetyText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;