import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUserProfile, refreshUserProfile, uploadProfileImage, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    image_url: user?.image_url || '',
  });

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone_number_number: user.phone_number_number || '',
      });
    }
  }, [user]);

  // Refresh user profile on mount
  useEffect(() => {
    refreshUserProfile().catch(err => {
      console.log('Could not refresh profile:', err);
    });
  }, []);

  // Handle image selection
  const handleImagePicker = () => {
    Alert.alert(
      'Upload Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => openCamera(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: false,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }

    if (response.errorCode) {
      console.error('ImagePicker Error:', response.errorMessage);
      Alert.alert('Error', 'Failed to pick image: ' + response.errorMessage);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      
      // Validate file size (max 5MB)
      if (asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image size should be less than 5MB');
        return;
      }

      try {
        setIsUploadingImage(true);
        await uploadProfileImage(asset.uri);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert(
          'Upload Failed',
          error?.response?.data?.message || error?.message || 'Failed to upload image. Please try again.'
        );
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Stats data - can be made dynamic later
  const userStats = [
    { label: 'Orders', value: user?.total_orders || '0', icon: 'bag-handle-outline' },
    { label: 'Reviews', value: user?.total_reviews || '0', icon: 'star-outline' },
    { label: 'Points', value: user?.loyalty_points || '0', icon: 'trophy-outline' },
    { label: 'Wishlist', value: user?.wishlist_count || '0', icon: 'heart-outline' },
  ];

  // Menu options
  const profileMenu = [
    { icon: 'person-outline', label: 'Edit Profile', action: () => setShowEditModal(true) },
    { icon: 'location-outline', label: 'My Addresses', action: () => navigation.navigate('Addresses') },
    { icon: 'heart-outline', label: 'Wishlist', action: () => navigation.navigate('Wishlist') },
    { icon: 'gift-outline', label: 'My Vouchers', action: () => navigation.navigate('Vouchers') },
    { icon: 'receipt-outline', label: 'My Orders', action: () => navigation.navigate('Orders') },
  ];

  const settingsMenu = [
    { icon: 'notifications-outline', label: 'Notifications', value: notifications, onValueChange: setNotifications, type: 'switch' },
    { icon: 'moon-outline', label: 'Dark Mode', value: darkMode, onValueChange: setDarkMode, type: 'switch' },
    { icon: 'finger-print-outline', label: 'Biometric Login', value: biometric, onValueChange: setBiometric, type: 'switch' },
    { icon: 'language-outline', label: 'Language', value: 'English', type: 'text' },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', action: () => navigation.navigate('Privacy') },
  ];

  const supportMenu = [
    { icon: 'help-circle-outline', label: 'Help & Support', action: () => navigation.navigate('Support') },
    { icon: 'document-text-outline', label: 'Terms of Service', action: () => navigation.navigate('Terms') },
    { icon: 'lock-closed-outline', label: 'Privacy Policy', action: () => navigation.navigate('PrivacyPolicy') },
    { icon: 'information-circle-outline', label: 'About App', action: () => navigation.navigate('About') },
  ];

  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 1],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -25],
    extrapolate: 'clamp',
  });

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }

    if (!editForm.email.trim()) {
      Alert.alert('Validation Error', 'Email cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      
      const updates = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone_number: editForm.phone_number.trim(),
        image_url: editForm.image_url.trim(),
      };

      await updateUserProfile(updates);
      
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message || error?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      {userStats.map((stat, index) => (
        <View key={stat.label} style={styles.statItem}>
          <View style={styles.statIcon}>
            <Icon name={stat.icon} size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderMenuSection = (title, items) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.lastMenuItem
            ]}
            onPress={item.action}
            disabled={!item.action && item.type !== 'switch'}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={22} color="#666" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onValueChange}
                trackColor={{ false: '#f0f0f0', true: '#4CAF50' }}
                thumbColor={item.value ? '#fff' : '#f4f3f4'}
              />
            ) : item.type === 'text' ? (
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{item.value}</Text>
                <Icon name="chevron-forward" size={16} color="#999" />
              </View>
            ) : (
              <Icon name="chevron-forward" size={16} color="#999" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={isUpdating}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile} disabled={isUpdating}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: user?.image_url || 'https://via.placeholder.com/150/4CAF50/ffffff?text=' + (user?.name?.[0] || 'U')
                }} 
                style={styles.avatarLarge} 
              />
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleImagePicker}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="camera" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

          {/* Edit Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                editable={!isUpdating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isUpdating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>phone_number_number Number</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.phone_number_number}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone_number_number: text }))}
                placeholder="Enter your phone_number_number number"
                keyboardType="phone_number_number-pad"
                editable={!isUpdating}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Show loading state */}
      {authLoading && !user ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <>
          {/* Animated Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Profile</Text>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Icon name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.headerBackground} />
              
              <Animated.View 
                style={[
                  styles.avatarContainer,
                  {
                    transform: [
                      { scale: avatarScale },
                      { translateY: avatarTranslateY }
                    ]
                  }
                ]}
              >
                <Image 
                  source={{ 
                    uri: user?.image_url || 'https://via.placeholder.com/150/4CAF50/ffffff?text=' + (user?.name?.[0] || 'U')
                  }} 
                  style={styles.avatar} 
                />
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={handleImagePicker}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="camera" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
                <Text style={styles.joinDate}>
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>

              {/* Stats */}
              {/* {renderStats()} */}
            </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'profile' ? (
          <View style={styles.content}>
            {renderMenuSection('Account', profileMenu)}
            
            {/* Recent Activity */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityContainer}>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon name="bag-check-outline" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Order Delivered</Text>
                    <Text style={styles.activityDescription}>Your order #ORD-1234 has been delivered</Text>
                    <Text style={styles.activityTime}>2 hours ago</Text>
                  </View>
                </View>
                
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon name="star-outline" size={20} color="#FFA000" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Review Added</Text>
                    <Text style={styles.activityDescription}>You reviewed Fresh Mart Grocery</Text>
                    <Text style={styles.activityTime}>1 day ago</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {renderMenuSection('Preferences', settingsMenu)}
            {renderMenuSection('Support', supportMenu)}
            
            {/* Account Actions */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Account Actions</Text>
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={[styles.menuItem, styles.logoutButton]}
                  onPress={handleLogout}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, styles.logoutIcon]}>
                      <Icon name="log-out-outline" size={22} color="#FF6B6B" />
                    </View>
                    <Text style={[styles.menuLabel, styles.logoutText]}>Logout</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.deleteButton]}
                  onPress={handleDeleteAccount}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, styles.deleteIcon]}>
                      <Icon name="trash-outline" size={22} color="#FF6B6B" />
                    </View>
                    <Text style={[styles.menuLabel, styles.deleteText]}>Delete Account</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appVersion}>Local Market v1.0.0</Text>
              <Text style={styles.appCopyright}>© 2024 Local Market. All rights reserved.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      {renderEditModal()}
        </>
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
    paddingTop: 20,
    zIndex: 300,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
profileHeader: {
    backgroundColor: '#4CAF50',
    paddingBottom: 40, // Thoda breathing space neeche ke liye
    alignItems: 'center',
    justifyContent: 'center', // Content ko vertically center karne ke liye
    paddingTop: 20, // Top se internal spacing
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#4CAF50',
  },
avatarContainer: {
    marginTop: 80, // FIX: Header height (100) + 10px extra gap. Pehle 60 tha jo galat tha.
    position: 'relative',
    alignItems: 'center', // Avatar ko center align karne ke liye
    marginBottom: 10, // Name text aur avatar ke beech gap
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
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
  content: {
    padding: 16,
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  logoutButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutIcon: {
    backgroundColor: '#FFEBEE',
  },
  logoutText: {
    color: '#FF6B6B',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteIcon: {
    backgroundColor: '#FFEBEE',
  },
  deleteText: {
    color: '#FF6B6B',
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 12,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen;