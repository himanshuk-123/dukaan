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
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ShopService from '../../services/ShopService';

const { width, height } = Dimensions.get('window');

const ShopsListScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadShops();
  }, [category]);

  useEffect(() => {
    // Client-side filtering based on search query
    filterShops();
  }, [searchQuery, shops]);

  const loadShops = async () => {
    try {
      setLoading(true);
      
      // Get the category name - handle both category_name and name fields
      const categoryId =category.id;
      
      const response = await ShopService.getShopsByCategory(
        categoryId,{
        page: pagination.page,
        limit: pagination.limit,
        search: ''
      });

      console.log("ShopLIst Screen Response: ",response)
      if (response.success) {
        setShops(response.data.shops || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load shops. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const filterShops = () => {
    if (!searchQuery.trim()) {
      setFilteredShops(shops);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = shops.filter(shop =>
      (shop.name && shop.name.toLowerCase().includes(query)) ||
      (shop.description && shop.description.toLowerCase().includes(query)) ||
      (shop.address && shop.address.toLowerCase().includes(query))
    );
    setFilteredShops(filtered);
  };

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 120],
    extrapolate: 'clamp',
  });

  // Render shop card in list view
  const renderShopCard = ({ item, index }) => {
    const cardScale = scrollY.interpolate({
      inputRange: [-1, 0, 150 * index, 150 * (index + 2)],
      outputRange: [1, 1, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <TouchableOpacity
          style={styles.shopCard}
          onPress={() => {
            console.log('=== Navigating to ShopDetail ===');
            console.log('Shop object:', JSON.stringify(item, null, 2));
            console.log('shop_id:', item.shop_id);
            navigation.navigate('ShopDetail', { shop: item });
          }}
          activeOpacity={0.7}
        >
          <Image 
            source={{ 
              uri: item.image_url || 'https://via.placeholder.com/120x140?text=No+Image' 
            }} 
            style={styles.shopImage}
          />
          
          <View style={styles.shopInfo}>
            <View style={styles.shopHeader}>
              <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <Text style={styles.rating}>{item.rating}</Text>
                </View>
              )}
            </View>
            
            {item.description && (
              <Text style={styles.shopDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            {(item.delivery_time || item.min_order) && (
              <View style={styles.deliveryInfo}>
                {item.delivery_time && (
                  <View style={styles.infoItem}>
                    <Icon name="time-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>{item.delivery_time}</Text>
                  </View>
                )}
                {item.min_order && (
                  <View style={styles.infoItem}>
                    <Icon name="pricetag-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>Min. ₹{item.min_order}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.addressContainer}>
              <Icon name="location-outline" size={14} color="#4CAF50" />
              <Text style={styles.address} numberOfLines={1}>
                {item.address} • {item.pincode}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, item.is_active && styles.activeBadge]}>
                <Text style={styles.statusText}>
                  {item.is_active ? 'Open Now' : 'Closed'}
                </Text>
              </View>
              {item.created_at && (
                <Text style={styles.joinDate}>
                  Since {new Date(item.created_at).getFullYear()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render shop card in grid view
  const renderShopGrid = ({ item }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => {
        console.log('=== Navigating to ShopDetail (Grid) ===');
        console.log('Shop object:', JSON.stringify(item, null, 2));
        console.log('shop_id:', item.shop_id);
        navigation.navigate('ShopDetail', { shop: item });
      }}
      activeOpacity={0.7}
    >
      <Image 
        source={{ 
          uri: item.image_url || 'https://via.placeholder.com/200x120?text=No+Image' 
        }} 
        style={styles.gridImage}
      />
      
      <View style={styles.gridInfo}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
          {item.rating && (
            <View style={styles.gridRating}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.gridRatingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        
        {item.description && (
          <Text style={styles.gridDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {item.delivery_time && (
          <View style={styles.gridDelivery}>
            <Icon name="time-outline" size={12} color="#666" />
            <Text style={styles.gridDeliveryText}>{item.delivery_time}</Text>
          </View>
        )}
        
        <View style={[styles.gridStatus, item.is_active && styles.gridActive]}>
          <Text style={styles.gridStatusText}>
            {item.is_active ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={category.color} barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: headerOpacity,
            height: headerHeight,
            backgroundColor: category.color,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.shopCount}>
                {filteredShops.length} shops available
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              <Icon 
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${category.name} shops...`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={category.color} />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={viewMode === 'list' ? renderShopCard : renderShopGrid}
          keyExtractor={(item) => item.shop_id}
          key={viewMode} // Force re-render when view mode changes
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer
          ]}
          numColumns={viewMode === 'grid' ? 2 : 1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[category.color]}
              tintColor={category.color}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="storefront-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try different search terms' : 'No shops in this category yet'}
              </Text>
            </View>
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
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
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopCount: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  viewToggle: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  gridContainer: {
    padding: 10,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  shopImage: {
    width: 120,
    height: 140,
  },
  shopInfo: {
    flex: 1,
    padding: 15,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  deliveryInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  // Grid View Styles
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 5,
    flex: 1,
    minWidth: width * 0.43,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 120,
  },
  gridInfo: {
    padding: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  gridName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginLeft: 2,
  },
  gridDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  gridDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridDeliveryText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  gridStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
  },
  gridActive: {
    backgroundColor: '#4CAF50',
  },
  gridStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default ShopsListScreen;