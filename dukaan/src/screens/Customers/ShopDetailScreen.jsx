import React, { useState, useRef, useEffect } from 'react';
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
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ShopService from '../../services/ShopService';
import { useCart } from '../../context/CartContext';
const { width, height } = Dimensions.get('window');

const ShopDetailScreen = ({ route, navigation }) => {
  const { addItem, cart } = useCart();   // <== ADD THIS at top inside component
  const { shop: initialShop } = route.params;
  const [shop, setShop] = useState(initialShop || null);
  const [activeTab, setActiveTab] = useState('products');
  const [favorite, setFavorite] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loadingShop, setLoadingShop] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    console.log('=== ShopDetailScreen useEffect ===');
    console.log('initialShop:', JSON.stringify(initialShop, null, 2));
    console.log('shop_id:', initialShop?.shop_id);
    
    if (initialShop?.shop_id) {
        // fetchShop();
      fetchProducts();
    } else {
      console.error('No shop_id found in route params!');
      Alert.alert('Error', 'Shop ID is missing. Cannot load shop details.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialShop?.shop_id]);

  const fetchProducts = async () => {
    try {
      console.log('=== fetchProducts called ===');
      console.log('Fetching products for shop ID:', initialShop?.shop_id);
      
      if (!initialShop?.shop_id) {
        console.error('shop_id is null/undefined');
        return;
      }
      
      setLoadingProducts(true);
      console.log('Calling ShopService.getProductsByShop...');
      const res = await ShopService.getProductsByShop(initialShop.shop_id, { page: 1, limit: 20 });
      console.log('Products API Response:', JSON.stringify(res, null, 2));
      
      if (res?.success) {
        console.log('Products received:', res.data?.products?.length || 0, 'items');
        console.log('First product:', res.data?.products?.[0]);
        setProducts(res.data?.products || []);
        setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        console.error('API returned success: false');
        Alert.alert('Error', res?.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('=== fetchProducts ERROR ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load products.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([ fetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  const shareShop = async () => {
    try {
      await Share.share({
        message: `Check out ${shop?.name || 'this shop'} on Local Market! ${shop?.description || ''}`,
        url: shop?.image_url,
        title: shop?.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share shop');
    }
  };

  const contactShop = () => {
    Alert.alert('Contact Shop', `Call ${shop?.name || 'Shop'} at +91 XXXXXXX${shop?.shop_id || ''}9`);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image source={{uri: item.image_url}} style={styles.productImage} />
        {!(item.stock_quantity > 0) && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteProduct}>
          <Icon 
            name="heart-outline" 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.productInfo}>
        {!!item.shop_name && <Text style={styles.productCategory}>{item.shop_name}</Text>}
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{item.selling_price ?? item.Base_Price ?? item.price ?? 0}</Text>
          {item.Base_Price && item.selling_price && item.Base_Price > item.selling_price && (
            <Text style={styles.originalPrice}>₹{item.Base_Price}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.addToCartBtn,
            !(item.stock_quantity > 0) && styles.disabledBtn
          ]}
          disabled={!(item.stock_quantity > 0)}
          onPress={() => addItem(item.product_id, 1)} 
        >
          <Text style={styles.addToCartText}>
            {item.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      {shop?.delivery_time && <InfoRow icon="time-outline" title="Delivery Time" value={shop.delivery_time} />}
      {shop?.min_order && <InfoRow icon="pricetag-outline" title="Minimum Order" value={`₹${shop.min_order}`} />}
      {shop?.address && <InfoRow icon="location-outline" title="Address" value={shop.address} />}
      <InfoRow icon="call-outline" title="Contact" value="+91 XXXXXXX789" />
      {shop?.created_at && (
        <InfoRow icon="calendar-outline" title="Since" value={new Date(shop.created_at).getFullYear()} />
      )}
      
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About Shop</Text>
        <Text style={styles.aboutText}>
          {shop?.description} We pride ourselves on providing the freshest products 
          with excellent customer service. All our items are sourced locally and 
          delivered with care.
        </Text>
      </View>

      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>Business Hours</Text>
        <InfoRow icon="time" title="Monday - Friday" value="7:00 AM - 10:00 PM" />
        <InfoRow icon="time" title="Saturday - Sunday" value="8:00 AM - 11:00 PM" />
      </View>
    </View>
  );

  const InfoRow = ({ icon, title, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Icon name={icon} size={20} color="#4CAF50" />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>{shop?.name || 'Shop'}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={shareShop}>
            <Icon name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setFavorite(!favorite)}
          >
            <Icon 
              name={favorite ? "heart" : "heart-outline"} 
              size={20} 
              color={favorite ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Image */}
        <Animated.View 
          style={[
            styles.heroContainer,
            { opacity: imageOpacity, transform: [{ scale: imageScale }] }
          ]}
        >
          <Image source={{ uri: shop?.image_url || 'https://via.placeholder.com/800x300?text=No+Image' }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => setFavorite(!favorite)}
          >
            <Icon 
              name={favorite ? "heart" : "heart-outline"} 
              size={24} 
              color={favorite ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        </Animated.View>
        {/* Shop Info Card */}
        <View style={styles.shopInfoCard}>
          <View style={styles.shopHeader}>
            <View style={styles.shopTitleContainer}>
              <Text style={styles.shopName}>{shop?.name || 'Shop'}</Text>
            </View>
            <View style={[styles.statusBadge, shop?.is_active && styles.activeBadge]}>
              <Text style={styles.statusText}>
                {shop?.is_active ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {!!shop?.description && <Text style={styles.shopDescription}>{shop.description}</Text>}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.5K+</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3.4</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.5K+</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={contactShop}>
              <Icon name="call-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Call Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={shareShop}>
              <Icon name="share-outline" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Shop Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'products' ? (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Products</Text>
              <Text style={styles.productCount}>{products.length} items</Text>
            </View>
            
            {loadingProducts ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => String(item.product_id || item.id)}
                scrollEnabled={false}
                numColumns={2}
                contentContainerStyle={styles.productsGrid}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Icon name="cube-outline" size={48} color="#ccc" />
                    <Text style={{ marginTop: 8, color: '#999' }}>No products found</Text>
                  </View>
                }
              />
            )}
          </View>
        ) : (
          renderInfoSection()
        )}
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartButton}>
          <Icon name="cart-outline" size={24} color="#4CAF50" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.summary?.itemCount || 0}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.priceSummary}>
  <Text style={styles.totalText}>Total: ₹{cart.summary?.total || 0}</Text>
  <Text style={styles.itemsText}>{cart.summary?.itemCount || 0} items in cart</Text>
</View>
        
        <TouchableOpacity style={styles.checkoutButton}
        onPress={() => navigation.navigate('Cart')}
          >
          <Text style={styles.checkoutText}>View Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    zIndex: 1000,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  heroContainer: {
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  shopInfoCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -60,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopTitleContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
  },
  activeBadge: {
    backgroundColor: '#353b35ff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  shopDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  productsSection: {
    paddingHorizontal: 10,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  productsGrid: {
    paddingHorizontal: 5,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: width * 0.43,
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
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
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteProduct: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
  },
  productCategory: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
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
  addToCartBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  aboutSection: {
    marginTop: 20,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginTop: 8,
  },
  hoursSection: {
    marginTop: 24,
  },
  bottomBar: {
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
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceSummary: {
    flex: 1,
    marginLeft: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemsText: {
    fontSize: 12,
    color: '#666',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShopDetailScreen;