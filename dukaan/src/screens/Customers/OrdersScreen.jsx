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
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useOrder} from '../../context/OrderContext';
const { width, height } = Dimensions.get('window');

const OrdersScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load real orders via context
  const { fetchOrders, orders, isLoading, error } = useOrder();

  useEffect(() => {
    fetchOrders();
  }, []);

  const ordersData = orders.map(o => {
    // Backend returns order fields: order_id, total_amount?, total, item_count, created_at maybe.
    // Normalise to UI structure expected by existing card.
    return {
      id: o.order_id?.toString() || o.order_id || o.id?.toString() || 'N/A',
      status: o.order_status, // Placeholder until status tracking implemented
      date: o.created_at || o.order_date || new Date().toISOString(),
      total: o.total_amount || o.total || 0,
      items: o.item_count || o.items?.length || 0,
      shop: {
        name: o.shop_name || 'Shop',
        image: 'https://via.placeholder.com/80?text=Shop',
      },
      deliveryAddress: (o.address && (o.address.address_line || o.address.line1)) || 'N/A',
      deliveredAt: o.delivered_at || o.created_at || new Date().toISOString(),
      itemsList: o.items || [],
    };
  });

  const tabs = [
    { id: 'all', label: 'All Orders', count: ordersData.length },
    { id: 'processing', label: 'Processing', count: ordersData.filter(order => order.status === 'processing').length },
    { id: 'on_the_way', label: 'On the Way', count: ordersData.filter(order => order.status === 'on_the_way').length },
    { id: 'delivered', label: 'Delivered', count: ordersData.filter(order => order.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: ordersData.filter(order => order.status === 'cancelled').length },
  ];

  const filteredOrders = activeTab === 'all' 
    ? ordersData 
    : ordersData.filter(order => order.status === activeTab);

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'processing': return '#FFA000';
      case 'on_the_way': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'processing': return 'time';
      case 'on_the_way': return 'bicycle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'processing': return 'Processing';
      case 'on_the_way': return 'On the Way';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const renderProgressBar = (order) => {
    if (!order.progress) return null;

    const steps = [
      { key: 'ordered', label: 'Ordered' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'preparing', label: 'Preparing' },
      { key: 'onTheWay', label: 'On the Way' },
      { key: 'delivered', label: 'Delivered' },
    ];

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              order.progress[step.key] && styles.progressDotActive
            ]}>
              {order.progress[step.key] && (
                <Icon name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text style={[
              styles.progressLabel,
              order.progress[step.key] && styles.progressLabelActive
            ]}>
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                order.progress[step.key] && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { order: item })}
    >
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.shopInfo}>
          <Image source={{ uri: item.shop.image }} style={styles.shopImage} />
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{item.shop.name}</Text>
            <Text style={styles.orderId}>Order #{item.id}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Icon 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Icon name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="bag-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.items} items</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.deliveryAddress}
          </Text>
        </View>
      </View>

      {/* Progress Bar for Active Orders */}
      {(item.status === 'processing' || item.status === 'on_the_way') && renderProgressBar(item)}

      {/* Delivery Info */}
      {item.status === 'on_the_way' && item.deliveryPerson && (
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryPerson}>
            <Icon name="person-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.deliveryText}>
              {item.deliveryPerson.name} is delivering your order
            </Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Icon name="call-outline" size={16} color="#2196F3" />
          </TouchableOpacity>
        </View>
      )}

      {/* Delivered Info */}
      {item.status === 'delivered' && (
        <View style={styles.deliveredInfo}>
          <Icon name="checkmark-done-circle" size={20} color="#4CAF50" />
          <Text style={styles.deliveredText}>
            Delivered on {new Date(item.deliveredAt).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Cancelled Info */}
      {item.status === 'cancelled' && (
        <View style={styles.cancelledInfo}>
          <Icon name="information-circle" size={20} color="#F44336" />
          <Text style={styles.cancelledText}>
            {item.cancellationReason || 'Order was cancelled'}
          </Text>
        </View>
      )}

      {/* Order Footer */}
      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>₹{item.total}</Text>
        
        <View style={styles.actionButtons}>
          {item.status === 'delivered' && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'processing' && (
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          >
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="bag-outline" size={80} color="#ddd" />
      </View>
      <Text style={styles.emptyTitle}>{isLoading ? 'Loading orders...' : 'No orders found'}</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all' 
          ? "You haven't placed any orders yet" 
          : `No ${tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} orders`
        }
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('CategoryScreen')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
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
        
        <Text style={styles.headerTitle}>My Orders</Text>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="search-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
{/* Tab Bar */}
<View style={styles.tabWrapper}>
  <FlatList
    data={tabs}
    keyExtractor={(item) => item.id.toString()}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.tabContainer}
    renderItem={({ item }) => {
      const isActive = activeTab === item.id;

      return (
        <TouchableOpacity
          style={[
            styles.tab,
            isActive && styles.activeTab
          ]}
          onPress={() => setActiveTab(item.id)}
          activeOpacity={0.8}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              isActive && styles.activeTabLabel
            ]}
          >
            {item.label}
          </Text>

          <View
            style={[
              styles.tabCount,
              isActive && styles.activeTabCount
            ]}
          >
            <Text
              style={[
                styles.tabCountText,
                isActive && { color: '#fff' }
              ]}
            >
              {item.count}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }}
  />
</View>


      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
      {error && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: '#F44336', textAlign: 'center' }}>Failed to load orders: {error}</Text>
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
tabScrollView: {
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

tabContainer: {
  paddingHorizontal: 12,
  paddingVertical: 10,
  // alignItems: 'center',
},

tab: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 12,
  height: 36,
  minWidth: 100,      // 🔥 ALL TABS SAME WIDTH
  borderRadius: 18,
  marginRight: 10,
  backgroundColor: '#f2f2f2',
},

activeTab: {
  backgroundColor: '#4CAF50',
},

tabLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#555',
  marginRight: 6,
},

activeTabLabel: {
  color: '#fff',
},

tabCount: {
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 5,
  backgroundColor: '#ddd',
},

activeTabCount: {
  backgroundColor: 'rgba(255,255,255,0.25)',
},

tabCountText: {
  fontSize: 11,
  fontWeight: '700',
  color: '#555',
  textAlign: 'center',
},

  listContainer: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 12,
    right: -12,
    width: 24,
    height: 2,
    backgroundColor: '#e9ecef',
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  deliveryPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  callButton: {
    padding: 6,
  },
  deliveredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  deliveredText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelledText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
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
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;