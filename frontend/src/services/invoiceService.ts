import { toast } from "sonner";
import { Invoice } from "@/types/invoice";
import yaml from 'js-yaml';

// Mock storage as we don't have a backend yet
const STORAGE_KEY = "invoices";
const DB_NAME = "InvoiceForgeDB";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

// IndexedDB helper functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
  });
};

// Save image to IndexedDB
export const saveImageToIndexedDB = async (imageData: string, imageHash: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(imageData, imageHash);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error saving image to IndexedDB:", error);
    throw error;
  }
};

// Get image from IndexedDB
export const getImageFromIndexedDB = async (imageHash: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    const store = tx.objectStore(IMAGE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(imageHash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting image from IndexedDB:", error);
    return null;
  }
};

// Delete image from IndexedDB
export const deleteImageFromIndexedDB = async (imageHash: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(imageHash);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error deleting image from IndexedDB:", error);
    throw error;
  }
};

// Simple hash function for images
const hashImage = (imageData: string): string => {
  let hash = 0;
  for (let i = 0; i < imageData.length; i++) {
    const char = imageData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// Get invoices from local storage
export const getInvoices = (): Invoice[] => {
  try {
    const storedInvoices = localStorage.getItem(STORAGE_KEY);
    return storedInvoices ? JSON.parse(storedInvoices) : [];
  } catch (error) {
    console.error("Error retrieving invoices:", error);
    return [];
  }
};

// Save invoices to local storage
export const saveInvoices = (invoices: Invoice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error("Error saving invoices:", error);
    toast.error("Failed to save invoices to storage");
  }
};

// Generate a unique ID for new invoices
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Add a new invoice
export const addInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    const invoices = getInvoices();
    
    // Handle image storage
    let iconHash = invoice.icon_hash;
    
    if (invoice.icon_data && !iconHash) {
      // Generate hash and store image in IndexedDB
      iconHash = hashImage(invoice.icon_data);
      await saveImageToIndexedDB(invoice.icon_data, iconHash);
    }
    
    const newInvoice = { 
      ...invoice, 
      id: generateId(),
      // Use icon_hash instead of icon_data for storage efficiency
      icon_name: invoice.icon_name || "",
      icon_hash: iconHash || null,
      icon_data: undefined, // Don't store full image data in invoice
      // Include service details
      service_date: invoice.service_date || "",
      service_description: invoice.service_description || ""
    };
    saveInvoices([...invoices, newInvoice]);
    toast.success("Invoice added successfully");
    return newInvoice;
  } catch (error) {
    console.error("Error adding invoice:", error);
    toast.error("Failed to add invoice");
    throw error;
  }
};

// Update an existing invoice
export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    if (!invoice.id) {
      throw new Error("Invoice ID is required for updates");
    }
    
    const invoices = getInvoices();
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (index === -1) {
      throw new Error("Invoice not found");
    }
    
    // Handle image storage
    let iconHash = invoice.icon_hash;
    
    if (invoice.icon_data) {
      // Always store new image data when present, regardless of existing hash
      iconHash = hashImage(invoice.icon_data);
      await saveImageToIndexedDB(invoice.icon_data, iconHash);
    } else if (!iconHash) {
      // Preserve existing icon_hash if no new image
      iconHash = invoices[index].icon_hash;
    }
    
    // Ensure icon_name is preserved if not provided
    if (!invoice.icon_name && invoices[index].icon_name) {
      invoice.icon_name = invoices[index].icon_name;
    }
    
    // Update the invoice with hash instead of full image data
    const updatedInvoice = {
      ...invoice,
      icon_hash: iconHash,
      icon_data: undefined // Don't store full image data in invoice
    };
    
    invoices[index] = updatedInvoice;
    saveInvoices(invoices);
    toast.success("Invoice updated successfully");
    return updatedInvoice;
  } catch (error) {
    console.error("Error updating invoice:", error);
    toast.error("Failed to update invoice");
    throw error;
  }
};

// Delete an invoice
export const deleteInvoice = (id: string): void => {
  try {
    const invoices = getInvoices();
    const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
    saveInvoices(filteredInvoices);
    toast.success("Invoice deleted successfully");
  } catch (error) {
    console.error("Error deleting invoice:", error);
    toast.error("Failed to delete invoice");
  }
};

export const generateInvoicePdf = async (invoice: Invoice): Promise<string> => {
  try {
    // Get image data from IndexedDB if we have an icon_hash
    let iconData = invoice.icon_data;
    if (invoice.icon_hash && !iconData) {
      iconData = await getImageFromIndexedDB(invoice.icon_hash);
    }
    
    // Clean and prepare the invoice data
    const invoiceData = {
      ...invoice,
      hourly_rate: Number(invoice.hourly_rate),
      vat_rate: Number(invoice.vat_rate),
      invoice_number: Number(invoice.invoice_number),
      payment_terms_days: Number(invoice.payment_terms_days || 0),
      icon_data: iconData // Include the actual image data for the backend
    };

    console.log("Preparing to send invoice data to API:", invoiceData);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083';
    const endpoint = localStorage.getItem('pdfEndpoint') || `${apiUrl}/generate-invoice?format=pdf`;
    console.log("Using endpoint:", endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API returned error:", response.status, errorText);
      throw new Error(`Failed to generate PDF: ${response.status} ${errorText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a URL for the Blob
    const url = window.URL.createObjectURL(blob);
    console.log("PDF generation successful, created blob URL");
    
    toast.success("Invoice PDF generated successfully");
    return url;
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    toast.error("Failed to generate invoice PDF");
    throw error;
  }
};

// For a real implementation, this would call the actual backend API
export const callGenerateInvoiceApi = async (invoice: Invoice): Promise<string> => {
  try {
    // For debugging
    console.log("Calling PDF generation API with invoice:", invoice);
    
    // Get PDF data from the API
    const pdfUrl = await generateInvoicePdf(invoice);
    
    return pdfUrl;
  } catch (error) {
    console.error("API call failed:", error);
    toast.error("Failed to call invoice generation API");
    throw error;
  }
};

// Import settings from a dictionary
export const importInvoiceSettings = (settings: Record<string, any>): Invoice => {
  try {
    // Create a new invoice object using the provided settings
    const newInvoiceData: Invoice = {
      client_name: settings.client_name || "",
      client_address: settings.client_address || "",
      services: settings.services || [""],
      service_date: settings.service_date || "",
      service_description: settings.service_description || "",
      payment_terms_days: Number(settings.payment_terms_days) || 30,
      invoice_number: Number(settings.invoice_number) || 1000,
      invoice_date: settings.invoice_date || new Date().toLocaleDateString("en-GB"),
      company_name: settings.company_name || "",
      hourly_rate: Number(settings.hourly_rate) || 300,
      vat_rate: Number(settings.vat_rate) || 20,
      account_number: settings.account_number || "",
      sort_code: settings.sort_code || "",
      bank_address: settings.bank_address || "",
      company_number: settings.company_number || "",
      vat_number: settings.vat_number || "",
      registered_address: settings.registered_address || "",
      email: settings.email || "",
      contact_number: settings.contact_number || "",
      column_widths: settings.column_widths || [2.5, 3.5],
      font_name: settings.font_name || "Calibri",
      icon_name: settings.icon_name || "",
      icon_data: settings.icon_data || null
    };

    toast.success("Settings imported successfully");
    return newInvoiceData;
  } catch (error) {
    console.error("Error importing settings:", error);
    toast.error("Failed to import settings");
    throw error;
  }
};

export const generateInvoiceDocx = async (invoice: Invoice): Promise<string> => {
  try {
    // Get image data from IndexedDB if we have an icon_hash
    let iconData = invoice.icon_data;
    if (invoice.icon_hash && !iconData) {
      iconData = await getImageFromIndexedDB(invoice.icon_hash);
    }
    
    const invoiceData = {
      ...invoice,
      hourly_rate: Number(invoice.hourly_rate),
      vat_rate: Number(invoice.vat_rate),
      invoice_number: Number(invoice.invoice_number),
      payment_terms_days: Number(invoice.payment_terms_days || 0),
      icon_data: iconData // Include the actual image data for the backend
    };
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083';
    const defaultEndpoint = `${apiUrl}/generate-invoice?format=pdf`;
    const endpoint = (localStorage.getItem('pdfEndpoint') || defaultEndpoint).replace('format=pdf', 'format=docx');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate DOCX: ${response.status} ${errorText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    toast.success('Invoice DOCX generated successfully');
    return url;
  } catch (error) {
    console.error('Error generating invoice DOCX:', error);
    toast.error('Failed to generate invoice DOCX');
    throw error;
  }
};

export const callGenerateInvoiceDocxApi = async (invoice: Invoice): Promise<string> => {
  try {
    const docxUrl = await generateInvoiceDocx(invoice);
    return docxUrl;
  } catch (error) {
    console.error('API call failed:', error);
    toast.error('Failed to call invoice DOCX generation API');
    throw error;
  }
};

// Get image data by hash (for form preview)
export const getImageData = async (imageHash: string): Promise<string | null> => {
  return await getImageFromIndexedDB(imageHash);
};

// Clear all images from IndexedDB
export const clearAllImages = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        toast.success("All images cleared successfully");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error clearing images:", error);
    toast.error("Failed to clear images");
    throw error;
  }
};

// Clear all data (invoices + images)
export const clearAllInvoices = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    clearAllImages(); // This will clear IndexedDB images
    toast.success("All invoices and images cleared successfully");
  } catch (error) {
    console.error("Error clearing invoices:", error);
    toast.error("Failed to clear invoices");
  }
};
