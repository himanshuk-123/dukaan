import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ShopService from '../../services/ShopService';
import { useAuth } from '../../context/AuthContext';

const ShopSelectionScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchMyShops();
  }, []);

  const fetchMyShops = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await ShopService.getMyShops();
      
      if (response.success) {
        setShops(response.data);
      } else {
        Alert.alert('Error', 'Failed to load shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      Alert.alert('Error', 'Failed to load your shops. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchMyShops(true);
  };

  const handleShopSelect = (shop) => {
    // Navigate to dashboard with selected shop
    navigation.navigate('Dashboard', { shopId: shop.shop_id, shopData: shop });
  };

  const handleCreateShop = () => {
    // Navigate to create shop screen (you can implement this later)
    navigation.navigate('CreateShop')
  };

  const renderShopCard = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handleShopSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.shopImageContainer}>
        <Image
          source={{
            uri: item.image_url || 'https://via.placeholder.com/100?text=Shop',
          }}
          style={styles.shopImage}
        />
        {item.is_active === false && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactive</Text>
          </View>
        )}
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {item.shop_name || item.name}
        </Text>
        <Text style={styles.shopDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>

        <View style={styles.shopDetails}>
          <View style={styles.detailItem}>
            <Icon name="location-outline" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address || 'No address'}
            </Text>
          </View>

          {item.contact_number && (
            <View style={styles.detailItem}>
              <Icon name="call-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.contact_number}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="cube-outline" size={16} color="#4CAF50" />
            <Text style={styles.statText}>
              {item.product_count || 0} Products
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color="#FFB800" />
            <Text style={styles.statText}>
              {item.rating ? item.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <Icon name="chevron-forward" size={24} color="#4CAF50" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="storefront-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Shops Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first shop to start selling
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateShop}>
        <Icon name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Shop</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your shops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}! 👋</Text>
          <Text style={styles.subGreeting}>Select a shop to manage</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateShop}>
          <Icon name="add-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Shops List */}
      <FlatList
        data={shops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.shop_id?.toString() || item.id?.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  addButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  shopImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  inactiveBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingVertical: 2,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  inactiveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shopInfo: {
    flex: 1,
    marginRight: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  shopDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShopSelectionScreen;
