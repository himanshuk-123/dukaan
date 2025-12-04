import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import ApiService from "../../services/ApiService"; // axios wrapper
import CategoryService from "../../services/CategoryService";


const CreateShopScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    cat_id: "",
    address: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [shopImage, setShopImage] = useState(null);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.7,
          includeBase64: false,
        },
        (response) => {
          if (response.didCancel) return;
          if (response.errorCode) {
            Alert.alert('Error', 'Failed to pick image');
            return;
          }

          const asset = response.assets?.[0];
          if (!asset) return;

          setShopImage({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `shop_${Date.now()}.jpg`,
          });
        }
      );
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleCreateShop = async () => {
    if (!form.name || form.name.trim().length < 2)
      return Alert.alert("Error", "Shop name must be at least 2 characters.");

    if (!form.address || !form.pincode)
      return Alert.alert("Error", "Address and Pincode are required.");

    if (!form.cat_id)
      return Alert.alert("Error", "Please select a shop category.");

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        cat_id: form.cat_id,
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      };

      const res = await ApiService.post("/shops", payload);

      if (res.data.success) {
        const shopId = res.data.data?.shop_id || res.data.data?.id;

        // Upload image if selected
        if (shopImage && shopId) {
          try {
            const formData = new FormData();
            formData.append('image', {
              uri: shopImage.uri,
              type: shopImage.type,
              name: shopImage.name,
            });

            const uploadRes = await ApiService.post(`/shops/${shopId}/upload-image`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            if (uploadRes.data.success) {
              Alert.alert('Success', 'Shop created and image uploaded successfully!');
            } else {
              Alert.alert('Success', 'Shop created! Image upload failed, but shop is ready.');
            }
          } catch (imgErr) {
            console.log('Image upload error:', imgErr);
            Alert.alert('Success', 'Shop created! Image upload failed, but shop is ready.');
          }
        } else {
          Alert.alert('Success', 'Shop created successfully!');
        }

        // Reset form
        setForm({
          name: "",
          description: "",
          cat_id: "",
          address: "",
          pincode: "",
          latitude: "",
          longitude: "",
        });
        setSelectedCategory(null);
        setShopImage(null);
        navigation.goBack();
      } else {
        Alert.alert('Error', res.data.error || 'Shop creation failed');
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchCategories();
    }, []);

      const fetchCategories = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
      } else {
        setLoading(true);
      }
      const response = await CategoryService.getAllCategories();
      
      console.log('API Response:', response);
      
      // Extract data from response
      const categoryData = response.success ? response.data : [];
      
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Shop</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Shop Name */}
        <Text style={styles.label}>Shop Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter shop name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>

        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text>
              {selectedCategory ? selectedCategory.name : "Select category"}
            </Text>
            <Icon
              name={
                showCategoryDropdown ? "chevron-up" : "chevron-down"
              }
              size={20}
              color="#555"
            />
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownPopover}>
              <ScrollView style={{ maxHeight: 200 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.cat_id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm({ ...form, cat_id: cat.cat_id });
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          placeholder="Write about your shop"
          multiline
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />

        {/* Address */}
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Shop full address"
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
        />

        {/* Pincode */}
        <Text style={styles.label}>Pincode *</Text>
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="numeric"
          value={form.pincode}
          onChangeText={(v) => setForm({ ...form, pincode: v })}
        />

        {/* Coordinates */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              value={form.latitude}
              onChangeText={(v) => setForm({ ...form, latitude: v })}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              value={form.longitude}
              onChangeText={(v) => setForm({ ...form, longitude: v })}
            />
          </View>
        </View>

        {/* Shop Image */}
        <Text style={styles.label}>Shop Image (Optional)</Text>
        {shopImage ? (
          <>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: shopImage.uri }}
                style={styles.imagePreview}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.imageBtn, { flex: 1, backgroundColor: '#E8F0FF' }]}
                onPress={pickImage}
              >
                <Icon name="camera-outline" size={18} color="#2196F3" />
                <Text style={[styles.imageBtnText, { color: '#2196F3' }]}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageBtn, { flex: 1, backgroundColor: '#FFE8E8' }]}
                onPress={() => setShopImage(null)}
              >
                <Icon name="trash-outline" size={18} color="#F44336" />
                <Text style={[styles.imageBtnText, { color: '#F44336' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Icon name="image-outline" size={40} color="#667eea" />
            <Text style={styles.uploadText}>Tap to select shop image</Text>
            <Text style={styles.uploadSubText}>Optional - Can be added later</Text>
          </TouchableOpacity>
        )}

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleCreateShop}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnTxt}>Create Shop</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

export default CreateShopScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  content: { padding: 16, paddingBottom: 120 },

  label: { marginTop: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
  },

  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: "#eee",
  },
  dropdownPopover: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    zIndex: 1000,
    elevation: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  dropdownText: { fontSize: 14, color: "#111" },

  imagePreviewContainer: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imageBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  uploadBox: {
    backgroundColor: '#F3F7FF',
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 12,
  },
  uploadSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },

  saveBtn: {
    marginTop: 30,
    backgroundColor: "#667eea",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
