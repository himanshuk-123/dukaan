import React, { useState, useRef,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
const { width, height } = Dimensions.get('window');

const ShopkeeperDashboard = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('today');
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {logout} = useAuth();
  // Dashboard data
  const dashboardData = {
    stats: {
      today: { orders: 47, revenue: 28450, customers: 23, rating: 4.8 },
      weekly: { orders: 289, revenue: 167800, customers: 156, rating: 4.7 },
      monthly: { orders: 1247, revenue: 745600, customers: 689, rating: 4.6 }
    },
    quickStats: [
      { icon: '📦', label: 'Pending Orders', value: 12, color: '#FF6B6B', change: '+3' },
      { icon: '💰', label: 'Today\'s Revenue', value: '₹28.4K', color: '#4CAF50', change: '+12%' },
      { icon: '👥', label: 'New Customers', value: 8, color: '#2196F3', change: '+2' },
      { icon: '⭐', label: 'Store Rating', value: '4.8/5', color: '#FFD700', change: '+0.1' }
    ],
    recentActivities: [
      { id: 1, type: 'order', message: 'New order #ORD-1001 received', time: '2 mins ago', amount: 845 },
      { id: 2, type: 'review', message: 'New 5-star review from Amit S.', time: '15 mins ago' },
      { id: 3, type: 'stock', message: 'Apples running low in stock', time: '1 hour ago' },
      { id: 4, type: 'order', message: 'Order #ORD-1000 completed', time: '2 hours ago', amount: 1520 }
    ],
    performance: [
      { metric: 'Order Completion', value: 96, target: 95, color: '#4CAF50' },
      { metric: 'On-time Delivery', value: 92, target: 90, color: '#2196F3' },
      { metric: 'Customer Satisfaction', value: 94, target: 92, color: '#FF9800' }
    ]
  };

    const handleLogout = () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
                // Navigation will be handled automatically by AuthContext
              } catch (error) {
                console.error('Logout error:', error);
              }
            },
          },
        ]
      );
    };  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const StatCard = ({ icon, label, value, color, change }) => (
    <Animated.View 
      style={[styles.statCard, { borderLeftColor: color }]}
      // entering={FadeInUp.delay(200)}
    >
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={[styles.changeBadge, { backgroundColor: color }]}>
          <Text style={styles.changeText}>{change}</Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  const PerformanceBar = ({ metric, value, target, color }) => (
    <View style={styles.performanceItem}>
      <View style={styles.performanceHeader}>
        <Text style={styles.performanceMetric}>{metric}</Text>
        <Text style={styles.performanceValue}>{value}%</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { 
              width: `${value}%`,
              backgroundColor: color
            }
          ]}
        />
      </View>
      <Text style={styles.performanceTarget}>Target: {target}%</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back, Rajesh! 👋</Text>
            <Text style={styles.subtitle}>Here's your store overview</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['today', 'week', 'month'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                activePeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setActivePeriod(period)}
            >
              <Text style={[
                styles.periodText,
                activePeriod === period && styles.periodTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {dashboardData.quickStats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </View>

        {/* Revenue Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View Report →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBar} />
            <View style={[styles.chartBar, { height: 120 }]} />
            <View style={[styles.chartBar, { height: 80 }]} />
            <View style={[styles.chartBar, { height: 150 }]} />
            <View style={[styles.chartBar, { height: 60 }]} />
            <View style={[styles.chartBar, { height: 180 }]} />
            <View style={[styles.chartBar, { height: 100 }]} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Icon name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
                <Icon name="bag-handle" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>Manage Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                <Icon name="analytics" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
                <Icon name="settings" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>See All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesList}>
            {dashboardData.recentActivities.map((activity, index) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Icon 
                    name={
                      activity.type === 'order' ? 'bag' : 
                      activity.type === 'review' ? 'star' : 'alert'
                    } 
                    size={20} 
                    color="#667eea" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {activity.amount && (
                  <Text style={styles.activityAmount}>₹{activity.amount}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceList}>
            {dashboardData.performance.map((item, index) => (
              <PerformanceBar key={item.metric} {...item} />
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
};

// Animation components
const FadeInUp = {
  from: { opacity: 0, transform: [{ translateY: 50 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 24,
    marginTop: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  chartSection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  viewAllText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingHorizontal: 20,
  },
  chartBar: {
    width: 12,
    backgroundColor: '#667eea',
    borderRadius: 6,
    height: 60,
  },
  actionsSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    width: (width - 72) / 2,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    textAlign: 'center',
  },
  activitiesSection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  activitiesList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#718096',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  performanceSection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  performanceList: {
    gap: 20,
  },
  performanceItem: {
    gap: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceMetric: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceTarget: {
    fontSize: 14,
    color: '#718096',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ShopkeeperDashboard;