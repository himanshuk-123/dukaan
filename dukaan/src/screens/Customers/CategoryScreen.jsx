import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Touchable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CategoryService from '../../services/CategoryService';
import { useAuth } from '../../context/AuthContext';
const { width } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';
const CategoryScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Category icon and color mapping
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Electronics': '📱',
      'Groceries': '🛒',
      'Grocery': '🛒',
      'Fashion': '👕',
      'Clothing': '👕',
      'Home & Kitchen': '🏠',
      'Home': '🏠',
      'Beauty & Health': '💄',
      'Beauty': '💄',
      'Sports': '⚽',
      'Books & Stationery': '📚',
      'Books': '📚',
      'Automotive': '🚗',
      'Food': '🍕',
      'Restaurant': '🍽️',
      'Pharmacy': '💊',
      'Pets': '🐾',
      'Toys': '🧸',
      'Furniture': '🛋️',
    };
    return iconMap[categoryName] || '🏪';
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFBE0B', '#FF9F1C', '#7209B7', '#F72585',
      '#06D6A0', '#118AB2', '#EF476F', '#FFD166'
    ];
    return colors[index % colors.length];
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await CategoryService.getAllCategories();
      
      console.log('API Response:', response);
      
      // Extract data from response
      const categoryData = response.success ? response.data : [];
      
      // Map backend data to UI format - handle various column name possibilities
      const mappedCategories = categoryData.map((category, index) => {
        // Try different possible field names from backend
        const categoryId = category.cat_id;
        const categoryName = category.category_name || category.name || category.categoryName || 'Unknown';
        const shopCount = category.shop_count || category.shopCount || category.shops || 0;
        const description = category.description || `Browse ${categoryName} shops`;
        
        return {
          id: categoryId.toString(),
          name: categoryName,
          icon: getCategoryIcon(categoryName),
          color: getCategoryColor(index),
          description: description,
          shops: shopCount,
          gradient: [getCategoryColor(index), getCategoryColor(index) + 'CC'],
        };
      });
      
      setCategories(mappedCategories);
      console.log('Mapped categories:', mappedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  const   filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Render category card
  const renderCategoryCard = ({ item, index }) => {
    const cardScale = scrollY.interpolate({
      inputRange: [-1, 0, 150 * index, 150 * (index + 2)],
      outputRange: [1, 1, 1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <TouchableOpacity
          style={[
            styles.categoryCard,
            { 
              backgroundColor: item.color + '15',
              borderLeftColor: item.color,
            }
          ]}
          onPress={() => {
            setSelectedCategory(item.id);
            navigation.navigate('ShopsList', { category: item });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '30' }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryDescription}>{item.description}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={item.color} />
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.shopsCount}>
              <Icon name="storefront-outline" size={14} color={item.color} />
              <Text style={[styles.shopsText, { color: item.color }]}>
                {item.shops} shops
              </Text>
            </View>
            <View style={[styles.exploreButton, { backgroundColor: item.color }]}>
              <Text style={styles.exploreText}>Explore</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Popular categories section
  const PopularCategories = () => (
    <View style={styles.popularSection}>
      <Text style={styles.sectionTitle}>Popular Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularContainer}
      >
        {categories.slice(0, 4).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.popularCard, { backgroundColor: category.color + '20' }]}
            onPress={() => navigation.navigate('ShopsList', { category })}
          >
            <Text style={styles.popularIcon}>{category.icon}</Text>
            <Text style={[styles.popularName, { color: category.color }]}>
              {category.name}
            </Text>
            <Text style={styles.popularShops}>{category.shops} shops</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: headerOpacity,
            height: headerHeight,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {user.name}! 👋</Text>
              {/* <TouchableOpacity onPress={() => navigation.navigate('ShopsList')}>
                <Text>shops</Text>
              </TouchableOpacity> */}
              <Text style={styles.subGreeting}>Find shops by category</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person-circle-outline" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
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

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {searchQuery.length === 0 && <PopularCategories />}
            <Text style={styles.sectionTitle}>
              {searchQuery.length > 0 ? 'Search Results' : 'All Categories'}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubText}>Try different search terms</Text>
          </View>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
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
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  profileButton: {
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  listContainer: {
    padding: 20,
    paddingTop: 20,
  },
  popularSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  popularContainer: {
    paddingRight: 20,
  },
  popularCard: {
    width: 120,
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  popularIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  popularShops: {
    fontSize: 12,
    color: '#666',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopsCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopsText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  exploreButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exploreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 5,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});

export default CategoryScreen;