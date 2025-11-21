import React, { createContext, useContext, useEffect, useState } from "react";
import AddressService from "../services/AddressService";

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
    fetchDefaultAddress();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);

      const response = await AddressService.getAll();
      if (response.success) {
        setAddresses(response.data);
      }

    } catch (error) {
      console.error("Fetch addresses failed:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchDefaultAddress = async () => {
    try {
      const response = await AddressService.getDefault();
      if (response.success) {
        setDefaultAddress(response.data);
      }
    } catch (error) {
      console.error("Fetch default address failed:", error);
    }
  };


  const addAddress = async (data) => {
    try {
      const response = await AddressService.add(data);

      if (response.success) {
        await fetchAddresses();
        await fetchDefaultAddress();
      }

      return response;
    } catch (error) {
      throw error;
    }
  };


  const setAsDefault = async (addressId) => {
    try {
      const response = await AddressService.setDefault(addressId);

      if (response.success) {
        await fetchAddresses();
        await fetchDefaultAddress();
      }

      return response;

    } catch (error) {
      throw error;
    }
  };


  const deleteAddress = async (addressId) => {
    try {
      const response = await AddressService.remove(addressId);

      if (response.success) {
        await fetchAddresses();
        await fetchDefaultAddress();
      }

      return response;

    } catch (error) {
      throw error;
    }
  };


  const value = {
    addresses,
    defaultAddress,
    isLoading,
    fetchAddresses,
    fetchDefaultAddress,
    addAddress,
    setAsDefault,
    deleteAddress,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};


export const useAddress = () => {
  const context = useContext(AddressContext);

  if (!context) {
    throw new Error("useAddress must be used inside AddressProvider");
  }

  return context;
};

export default AddressContext;
