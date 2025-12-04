// OrderManagementScreen.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrderService from '../../services/OrderService';
const { width } = Dimensions.get('window');

const STATUS_COLORS = {
  pending: '#FFA000',
  confirmed: '#2196F3',
  out_for_delivery: '#FF9800',
  delivered: '#4CAF50',
  cancelled: '#F44336',
  default: '#666'
};

const mapBackendStatus = (s) => {
  if (!s) return 'pending';
  switch (s.toUpperCase()) {
    case 'PENDING': return 'pending';
    case 'CONFIRMED': return 'confirmed';
    case 'PACKED':
    case 'SHIPPED': return 'out_for_delivery';
    case 'DELIVERED': return 'delivered';
    case 'CANCELLED': return 'cancelled';
    default: return 'pending';
  }
};

const getNextStatus = (status) => {
  switch (status) {
    case 'pending': return 'CONFIRMED';
    case 'confirmed': return 'SHIPPED'; // mapped to out_for_delivery on frontend
    case 'out_for_delivery': return 'DELIVERED';
    default: return null;
  }
};

const OrderManagementScreen = ({ navigation, route }) => {
  const shopId = route?.params?.shopId;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchOrders();
  }, [shopId]);

  const fetchOrders = async () => {
    if (!shopId) {
      setError('Shop ID missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await OrderService.getShopOrders(shopId);
      // map backend rows to UI-friendly objects
      const mapped = (list || []).map(o => ({
        id: String(o.order_id),
        order_id: o.order_id,
        customer: o.customer?.name || o.customer_name || 'Customer',
        phone: o.customer?.phone || o.customer_phone || '',
        amount: Number(o.total_amount || 0),
        status: mapBackendStatus(o.order_status),
        created_at: o.created_at,
        preview: o.preview || {},
        payment_status: o.payment_status || '',
      }));
      setOrders(mapped);
    } catch (err) {
      console.error('fetchOrders error', err);
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  // memoize tab counts to avoid re-renders
  const statusTabs = useMemo(() => {
    return [
      { id: 'all', label: 'All', color: '#667eea', count: orders.length },
      { id: 'pending', label: 'Pending', color: STATUS_COLORS.pending, count: orders.filter(o => o.status === 'pending').length },
      { id: 'confirmed', label: 'Confirmed', color: STATUS_COLORS.confirmed, count: orders.filter(o => o.status === 'confirmed').length },
      { id: 'out_for_delivery', label: 'Out for Delivery', color: STATUS_COLORS.out_for_delivery, count: orders.filter(o => o.status === 'out_for_delivery').length },
      { id: 'delivered', label: 'Delivered', color: STATUS_COLORS.delivered, count: orders.filter(o => o.status === 'delivered').length },
      { id: 'cancelled', label: 'Cancelled', color: STATUS_COLORS.cancelled, count: orders.filter(o => o.status === 'cancelled').length },
    ];
  }, [orders]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' ||
      order.customer.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q) ||
      order.phone.includes(q);
    return matchesStatus && matchesSearch;
  });

  const openDetails = async (order) => {
    try {
      setLoading(true);
      const details = await OrderService.getShopOrderDetails(shopId, order.order_id);
      setSelectedOrderDetails(details);
      setDetailsModalVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAdvance = async (order) => {
    const next = getNextStatus(order.status);
    if (!next) return;
    try {
      setLoading(true);
      await OrderService.updateOrderStatus(shopId, order.order_id, next);
      await fetchOrders();
      Alert.alert('Success', 'Status updated');
    } catch (err) {
      console.error('update status', err);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (order) => {
    Alert.alert('Cancel order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await OrderService.updateOrderStatus(shopId, order.order_id, 'CANCELLED');
            await fetchOrders();
            Alert.alert('Cancelled');
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const getStatusColor = (s) => STATUS_COLORS[s] || STATUS_COLORS.default;
  const getStatusText = (s) => {
    switch (s) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const renderOrderCard = ({ item }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.customer}>{item.customer}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]} allowFontScaling={false}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.left}>
            <Text style={styles.previewText} numberOfLines={1}>
              {item.preview?.name ? `${item.preview.name} ${item.preview.qty ? `• ${item.preview.qty}` : ''}` : `${item.item_count || 0} items`}
            </Text>
            <Text style={styles.metaText}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.amountText}>₹{item.amount.toFixed(0)}</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openDetails(item)}>
              <Ionicons name="eye-outline" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardActions}>
          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => handleStatusAdvance(item)}>
              <Text style={styles.primaryActionText}>Move Next</Text>
            </TouchableOpacity>
          )}

          {item.status === 'pending' && (
            <TouchableOpacity style={styles.cancelAction} onPress={() => handleCancel(item)}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderDetailsModal = () => (
    <Modal visible={detailsModalVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
            <Ionicons name="close" size={22} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Details</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {!selectedOrderDetails ? (
            <ActivityIndicator size="large" color="#667eea" />
          ) : (
            <>
              {/* order meta */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>{selectedOrderDetails.order.order_id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selectedOrderDetails.order.customer.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedOrderDetails.order.customer.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>₹{Number(selectedOrderDetails.order.total_amount).toFixed(0)}</Text>
              </View>
              <View style={styles.sectionSeparator} />

              {/* items */}
              <Text style={styles.sectionTitle}>Items</Text>
              {selectedOrderDetails.items.length === 0 ? (
                <Text style={styles.emptyText}>No items available</Text>
              ) : selectedOrderDetails.items.map(it => (
                <View key={it.order_item_id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{it.product_name}</Text>
                    <Text style={styles.itemQty}>x{it.quantity} • ₹{it.price_at_time}</Text>
                  </View>
                  <Text style={styles.itemTotal}>₹{it.quantity * it.price_at_time}</Text>
                </View>
              ))}

              <View style={styles.sectionSeparator} />

              {/* address */}
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {selectedOrderDetails.address ? (
                <View>
                  <Text style={styles.addressText}>{selectedOrderDetails.address.full_name}</Text>
                  <Text style={styles.addressText}>{selectedOrderDetails.address.house}, {selectedOrderDetails.address.city} - {selectedOrderDetails.address.pincode}</Text>
                </View>
              ) : <Text style={styles.emptyText}>No address recorded</Text>}

              <View style={styles.sectionSeparator} />

              {/* payment */}
              <Text style={styles.sectionTitle}>Payment</Text>
              {selectedOrderDetails.payment ? (
                <View>
                  <Text style={styles.addressText}>Method: {selectedOrderDetails.payment.payment_method}</Text>
                  <Text style={styles.addressText}>Amount: ₹{selectedOrderDetails.payment.amount}</Text>
                  <Text style={styles.addressText}>Status: {selectedOrderDetails.payment.payment_status}</Text>
                </View>
              ) : <Text style={styles.emptyText}>No payment record</Text>}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order Management</Text>
          <Text style={styles.headerSubtitle}>{filteredOrders.length} orders</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, customer or phone"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedStatus(tab.id)}
              style={[
                styles.statusTab,
                selectedStatus === tab.id && styles.activeStatusTab,
                { borderColor: tab.color }
              ]}
            >
              <Text style={[styles.statusTabLabel, selectedStatus === tab.id && styles.activeStatusTabLabel]} allowFontScaling={false}>
                {tab.label}
              </Text>
              <View style={[styles.statusCount, { backgroundColor: selectedStatus === tab.id ? '#fff' : tab.color + '22' }]}>
                <Text style={styles.statusCountText} allowFontScaling={false}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {loading && orders.length === 0 ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color="#667eea" /></View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={i => i.id}
            renderItem={renderOrderCard}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </View>

      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: { backgroundColor: '#667eea', paddingVertical: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  searchRow: { padding: 12, backgroundColor: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f6fb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  tabsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.2,
    marginRight: 10,
    backgroundColor: '#fff',
    flexShrink: 0
  },
  activeStatusTab: { backgroundColor: '#667eea', borderColor: '#667eea' },
  statusTabLabel: { fontSize: 13, fontWeight: '600', marginRight: 8 },
  activeStatusTabLabel: { color: '#fff' },
  statusCount: { minWidth: 26, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  statusCountText: { fontSize: 12, fontWeight: '700' },

  // order card
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 3 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: '700' },
  customer: { fontSize: 13, color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },

  orderBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flex: 1 },
  previewText: { fontSize: 13, color: '#4a5568', marginBottom: 4 },
  metaText: { fontSize: 12, color: '#718096' },
  right: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  iconBtn: { marginTop: 8 },

  cardActions: { marginTop: 10, flexDirection: 'row' },
  primaryAction: { flex: 1, backgroundColor: '#667eea', padding: 8, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  primaryActionText: { color: '#fff', fontWeight: '700' },
  cancelAction: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f44336', alignItems: 'center' },
  cancelActionText: { color: '#f44336', fontWeight: '700' },

  // modal
  modalRoot: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalContent: { padding: 16, paddingBottom: 40 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { color: '#718096', fontSize: 13 },
  detailValue: { fontSize: 14, fontWeight: '700' },
  sectionSeparator: { height: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#718096', marginTop: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemQty: { color: '#718096', fontSize: 13 },
  itemTotal: { fontWeight: '700' },
  addressText: { fontSize: 14, color: '#333', marginTop: 6 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#667eea', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' }
});

export default OrderManagementScreen;
