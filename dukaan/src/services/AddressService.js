import api from "./ApiService";

const AddressService = {

  // Get all addresses of logged in user
  getAll: async () => {
    try {
      const response = await api.get('/address');
      return response.data;
    } catch (error) {
      console.error("Get all addresses error:", error);
      throw error;
    }
  },


  // Get default address of logged in user
  getDefault: async () => {
    try {
      const response = await api.get('/address/default');
      return response.data;
    } catch (error) {
      console.error("Get default address error:", error);
      throw error;
    }
  },


  // Add a new address
  add: async (data) => {
    try {
      const response = await api.post('/address', data);
      return response.data;
    } catch (error) {
      console.error("Add address error:", error);
      throw error;
    }
  },


  // Set address as default
  setDefault: async (addressId) => {
    try {
      const response = await api.put(`/address/${addressId}/set-default`);
      return response.data;
    } catch (error) {
      console.error("Set default address error:", error);
      throw error;
    }
  },


  // Delete address (soft delete)
  remove: async (addressId) => {
    try {
      const response = await api.delete(`/address/${addressId}`);
      return response.data;
    } catch (error) {
      console.error("Delete address error:", error);
      throw error;
    }
  }

};

export default AddressService;
