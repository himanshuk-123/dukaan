import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import ProductService from "../../services/ProductService";

const { width } = Dimensions.get("window");
const GRID_IMAGE_H = width / 2 - 40;

const UNIT_OPTIONS = [
  "kg",
  "g",
  "liter",
  "ml",
  "piece",
  "pack",
  "dozen",
  "box",
  "other",
];

const ProductManagementScreen = ({ navigation, route }) => {
  const shopId = route?.params?.shopId;
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState("list"); // list | grid
  const [search, setSearch] = useState("");

  // Add product state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({
    name: "",
    Base_Price: "",
    stock_quantity: "",
    description: "",
    unit: "",
  });
  const [newImage, setNewImage] = useState(null);

  // Unit dropdown (for add)
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [customUnit, setCustomUnit] = useState("");

  // Edit product
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [showUnitDropdownEdit, setShowUnitDropdownEdit] = useState(false);

  // --------------------------
  // Image Picker
  // --------------------------
  const pickImage = (setter) => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.7 },
      (res) => {
        if (res.didCancel) return;
        if (res.errorCode) return Alert.alert("Error", "Image select failed");

        const asset = res.assets?.[0];
        setter({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        });
      }
    );
  };

  // --------------------------
  // Fetch Products
  // --------------------------
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await ProductService.getMyProducts(shopId, {
        limit: 200,
        page: 1,
      });

      const list =
        res?.data?.products ||
        res?.products ||
        [];

      setProducts(list);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --------------------------
  // Add Product
  // --------------------------
  const handleAddProduct = async () => {
    if (!newProd.name || !newProd.unit || !newProd.Base_Price) {
      return Alert.alert("Error", "Please fill all required fields");
    }

    try {
      setLoading(true);

      const payload = {
        name: newProd.name,
        Base_Price: Number(newProd.Base_Price),
        stock_quantity: Number(newProd.stock_quantity || 0),
        description: newProd.description,
        unit: newProd.unit === "other" ? customUnit : newProd.unit,
      };

      const res = await ProductService.createProduct(shopId, payload);
      if (!res.success) return Alert.alert("Error", res.message);

      const productId =
        res.data?.product_id || res.data?.id || res.product_id;

      if (newImage && productId) {
        const formData = new FormData();
        formData.append("image", newImage);

        await ProductService.uploadProductImage(productId, formData);
      }

      Alert.alert("Success", "Product added");
      resetAddModal();
      fetchProducts();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setNewProd({
      name: "",
      Base_Price: "",
      stock_quantity: "",
      description: "",
      unit: "",
    });
    setNewImage(null);
    setCustomUnit("");
  };

  // --------------------------
  // Edit Product
  // --------------------------
  const handleEditProduct = async () => {
    if (!editProd) return;

    try {
      setLoading(true);

      const payload = {
        name: editProd.name,
        Base_Price: Number(editProd.Base_Price),
        stock_quantity: Number(editProd.stock_quantity),
        description: editProd.description,
        unit: editProd.unit,
      };

      const res = await ProductService.updateProduct(
        editProd.product_id,
        payload
      );

      if (!res.success) return Alert.alert("Error", res.message);

      if (editImage) {
        const formData = new FormData();
        formData.append("image", editImage);
        await ProductService.uploadProductImage(editProd.product_id, formData);
      }

      Alert.alert("Updated");
      setShowEditModal(false);
      fetchProducts();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Delete Product
  // --------------------------
  const handleDelete = (prod) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await ProductService.deleteProduct(prod.product_id);
            fetchProducts();
          } catch (e) {
            Alert.alert("Error", "Delete failed");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // --------------------------
  // RENDER PRODUCT (LIST)
  // --------------------------
  const renderListItem = ({ item }) => (
    <View style={styles.listCard}>
      <Image
        source={{
          uri:
            item.image_url ||
            "https://via.placeholder.com/150",
        }}
        style={styles.listImage}
      />

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.unit}>{item.unit}</Text>
        <Text numberOfLines={2} style={styles.desc}>
          {item.description}
        </Text>

        <Text style={styles.price}>₹{item.Base_Price}</Text>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => {
            setEditProd(item);
            setShowEditModal(true);
          }}
          style={styles.smallAction}
        >
          <Icon name="create-outline" size={18} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={[styles.smallAction, { marginTop: 8 }]}
        >
          <Icon name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --------------------------
  // RENDER PRODUCT (GRID)
  // --------------------------
  const renderGridItem = ({ item }) => (
    <View style={styles.gridCard}>
      <Image
        source={{
          uri:
            item.image_url ||
            "https://via.placeholder.com/150",
        }}
        style={styles.gridImage}
      />
      <Text numberOfLines={1} style={styles.gridName}>
        {item.name}
      </Text>
      <Text style={styles.price}>₹{item.Base_Price}</Text>

      <View style={styles.gridActions}>
        <TouchableOpacity
          onPress={() => {
            setEditProd(item);
            setShowEditModal(true);
          }}
        >
          <Icon name="create-outline" size={18} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Icon name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --------------------------
  // FILTER
  // --------------------------
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------
  // UI START
  // --------------------------
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Products</Text>
</View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() =>
              setViewMode(viewMode === "list" ? "grid" : "list")
            }
          >
            <Icon
              name={viewMode === "list" ? "grid-outline" : "list-outline"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Icon name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color="#666" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products"
          style={{ marginLeft: 8, flex: 1 }}
          placeholderTextColor="black"
        />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : !filtered || filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cube-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>
            {search.length > 0
              ? `No products match "${search}"`
              : "Start by adding your first product"}
          </Text>
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearch("")}
            >
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
          {search.length === 0 && (
            <TouchableOpacity
              style={styles.addProductBtnEmpty}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.addProductBtnEmptyText}>Add First Product</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : viewMode === "list" ? (
        <FlatList
          key="list-view"
          data={filtered}
          keyExtractor={(i) => i.product_id.toString()}
          renderItem={renderListItem}
          refreshing={refreshing}
          onRefresh={fetchProducts}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        />
      ) : (
        <FlatList
          key="grid-view"
          data={filtered}
          keyExtractor={(i) => i.product_id.toString()}
          renderItem={renderGridItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        />
      )}

      {/* ------------------------------ */}
      {/* ADD PRODUCT MODAL */}
      {/* ------------------------------ */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Icon name="close" size={22} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Add Product</Text>

          <TouchableOpacity onPress={handleAddProduct}>
            <Text style={styles.saveTxt}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* NAME */}
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={newProd.name}
            onChangeText={(t) => setNewProd({ ...newProd, name: t })}
          />

          {/* UNIT */}
          <View style={{ marginTop: 12, position: "relative" }}>
            <Text style={styles.label}>Unit *</Text>

            {/* Dropdown Trigger */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowUnitDropdown(!showUnitDropdown)}
            >
              <Text>
                {newProd.unit === "other" ? customUnit : newProd.unit || "Select"}
              </Text>
              <Icon
                name={showUnitDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#444"
              />
            </TouchableOpacity>

            {/* Dropdown POPUP */}
            {showUnitDropdown && (
              <View style={styles.dropdownPopover}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {UNIT_OPTIONS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setNewProd({ ...newProd, unit: u });
                        setShowUnitDropdown(false);
                        if (u !== "other") setCustomUnit("");
                      }}
                    >
                      <Text style={styles.dropdownText}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Custom Unit */}
            {newProd.unit === "other" && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Enter custom unit"
                value={customUnit}
                onChangeText={setCustomUnit}
              />
            )}
          </View>

          {/* PRICE & STOCK */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Base Price *</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(newProd.Base_Price)}
                onChangeText={(t) =>
                  setNewProd({ ...newProd, Base_Price: t })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(newProd.stock_quantity)}
                onChangeText={(t) =>
                  setNewProd({ ...newProd, stock_quantity: t })
                }
              />
            </View>
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            multiline
            value={newProd.description}
            onChangeText={(t) =>
              setNewProd({ ...newProd, description: t })
            }
          />

          {/* IMAGE */}
          <Text style={styles.label}>Image</Text>
          {newImage ? (
            <>
              <Image
                source={{ uri: newImage.uri }}
                style={styles.previewImage}
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => pickImage(setNewImage)}
                >
                  <Text style={styles.smallBtnTxt}>Change</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "#ffeded" }]}
                  onPress={() => setNewImage(null)}
                >
                  <Text style={[styles.smallBtnTxt, { color: "#d00" }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImage(setNewImage)}
            >
              <Icon name="image-outline" size={20} color="#667eea" />
              <Text style={styles.uploadTxt}>Select Image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Modal>

      {/* ------------------------------ */}
      {/* EDIT MODAL */}
      {/* ------------------------------ */}
      <Modal visible={showEditModal} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Icon name="close" size={22} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Edit Product</Text>

          <TouchableOpacity onPress={handleEditProduct}>
            <Text style={styles.saveTxt}>Update</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {editProd && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editProd.name}
                onChangeText={(t) =>
                  setEditProd({ ...editProd, name: t })
                }
              />

              {/* UNIT */}
              <View style={{ marginTop: 12, position: "relative" }}>
                <Text style={styles.label}>Unit</Text>

                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() =>
                    setShowUnitDropdownEdit(!showUnitDropdownEdit)
                  }
                >
                  <Text>{editProd.unit || "Select"}</Text>
                  <Icon
                    name={
                      showUnitDropdownEdit ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                  />
                </TouchableOpacity>

                {showUnitDropdownEdit && (
                  <View style={styles.dropdownPopover}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {UNIT_OPTIONS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setEditProd({ ...editProd, unit: u });
                            setShowUnitDropdownEdit(false);
                          }}
                        >
                          <Text style={styles.dropdownText}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* PRICE */}
              <Text style={styles.label}>Base Price</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={String(editProd.Base_Price)}
                onChangeText={(t) =>
                  setEditProd({ ...editProd, Base_Price: t })
                }
              />

              {/* STOCK */}
              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(editProd.stock_quantity)}
                onChangeText={(t) =>
                  setEditProd({ ...editProd, stock_quantity: t })
                }
              />

              {/* DESCRIPTION */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                multiline
                value={editProd.description}
                onChangeText={(t) =>
                  setEditProd({ ...editProd, description: t })
                }
              />

              {/* IMAGE */}
              <Text style={styles.label}>Image</Text>
              {editImage ? (
                <Image
                  source={{ uri: editImage.uri }}
                  style={styles.previewImage}
                />
              ) : (
                <Image
                  source={{ uri: editProd.image_url }}
                  style={styles.previewImage}
                />
              )}

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => pickImage(setEditImage)}
                >
                  <Text style={styles.smallBtnTxt}>Change</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "#ffeded" }]}
                  onPress={() => setEditImage(null)}
                >
                  <Text style={[styles.smallBtnTxt, { color: "#d00" }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  searchBar: {
    backgroundColor: "#fff",
    padding: 12,
    margin: 12,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  // LIST VIEW CARD
  listCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    padding: 10,
  },
  listImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  name: { fontSize: 16, fontWeight: "700" },
  unit: { fontSize: 13, color: "#667eea", marginTop: 2 },
  desc: { color: "#444", fontSize: 13, marginTop: 4 },
  price: { marginTop: 6, fontWeight: "700", fontSize: 16, color: "#111" },

  smallAction: {
    padding: 8,
    backgroundColor: "#f2f6fb",
    borderRadius: 8,
    alignItems: "center",
  },

  // GRID VIEW CARD
  gridCard: {
    width: width / 2 - 22,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: GRID_IMAGE_H,
    backgroundColor: "#eee",
  },
  gridName: { marginTop: 6, fontWeight: "700", fontSize: 16, marginLeft: 10 },
  gridActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // MODAL
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  saveTxt: { color: "#667eea", fontWeight: "700" },

  modalContent: { padding: 16, paddingBottom: 100 },

  label: { marginTop: 14, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  // DROPDOWN
  dropdown: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownPopover: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 99999,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 6,
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

  // IMAGE
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  uploadBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F3F7FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadTxt: { color: "#667eea", fontWeight: "700" },

  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E9F0FF",
    borderRadius: 10,
  },
  smallBtnTxt: { fontWeight: "700", color: "#2255ff" },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchBtn: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  clearSearchBtnText: {
    color: "#667eea",
    fontWeight: "600",
  },
  addProductBtnEmpty: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#667eea",
    borderRadius: 25,
  },
  addProductBtnEmptyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ProductManagementScreen;