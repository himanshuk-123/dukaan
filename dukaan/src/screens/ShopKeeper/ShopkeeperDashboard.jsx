import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import ShopService from "../../services/ShopService";
import { useAuth } from "../../context/AuthContext";

const ShopkeeperDashboard = ({ navigation, route }) => {
  const shopId = route?.params?.shopId;
  const shopData = route?.params?.shopData || {};

  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [shopId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await ShopService.getShopDashboard(shopId);
      console.log(res)
      if (res.success) {
        setDashboard(res.data);

      } else {
        alert("Failed to load dashboard");
      }
    } catch (e) {
      console.log(e);
      alert("Dashboard load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.loader}>
        <Icon name="alert-circle-outline" size={50} color="gray" />
        <Text>Failed to load dashboard</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDashboard}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    {
      icon: "time-outline",
      label: "Pending Orders",
      value: dashboard.pendingOrders || 0,
      color: "#FFA000",
    },
    {
      icon: "checkmark-done-outline",
      label: "Completed",
      value: dashboard.completedOrders || 0,
      color: "#4CAF50",
    },
    {
      icon: "bag-handle-outline",
      label: "Total Orders",
      value: dashboard.totalOrders || 0,
      color: "#2196F3",
    },
    {
      icon: "cash-outline",
      label: "Revenue",
      value: `₹${dashboard.totalRevenue || 0}`,
      color: "#667eea",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{shopData.name}</Text>
          <Text style={styles.headerSubtitle}>Dashboard</Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Icon name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Icon name={s.icon} size={28} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Shop Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Shop Summary</Text>

          <View style={styles.infoRow}>
            <Text>Total Products</Text>
            <Text style={styles.bold}>{dashboard.totalProducts}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text>Total Stock</Text>
            <Text style={styles.bold}>{dashboard.totalStock}</Text>
          </View>

          {dashboard.bestProduct && (
            <View style={styles.infoRow}>
              <Text>Best Product</Text>
              <Text style={styles.bold}>
                {dashboard.bestProduct.name} ({dashboard.bestProduct.total_sold} sold)
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.action}
              onPress={() => navigation.navigate("ProductManagement", { shopId })}
            >
              <Icon name="cube-outline" size={26} color="#667eea" />
              <Text>Add Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={() => navigation.navigate("OrderManagement", { shopId })}
            >
              <Icon name="bag-handle-outline" size={26} color="#667eea" />
              <Text>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action} onPress={() => alert('Settings coming soon!')}>
              <Icon name="settings-outline" size={26} color="#667eea" />
              <Text>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>

          {dashboard.recentOrders.length === 0 && (
            <Text style={{ color: "gray", marginTop: 10 }}>No recent orders</Text>
          )}

          {dashboard.recentOrders.map((o) => (
            <TouchableOpacity
              key={o.order_id}
              style={styles.orderItem}
              onPress={() =>
                navigation.navigate("OrderManagement", {
                  shopId,
                  highlightOrderId: o.order_id,
                })
              }
            >
              <View>
                <Text style={styles.bold}>Order #{o.order_id}</Text>
                <Text style={{ color: "gray" }}>
                  {o.item_count} items • ₹{o.total_amount}
                </Text>
              </View>

              <Icon name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#667eea",
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#dfe3ff", fontSize: 13 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 16,
    width: "48%",
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statValue: { fontWeight: "700", fontSize: 20, marginVertical: 4 },
  statLabel: { color: "#555" },

  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 12,
    marginTop: 18,
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  bold: { fontWeight: "700" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  action: {
    alignItems: "center",
    paddingVertical: 12,
    width: "30%",
  },

  orderItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  retryBtn: { marginTop: 15, padding: 10, backgroundColor: "#667eea", borderRadius: 8 },
  retryTxt: { color: "#fff", fontWeight: "600" },
});

export default ShopkeeperDashboard;
