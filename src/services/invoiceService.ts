
import { toast } from "sonner";
import { Invoice } from "@/types/invoice";

// Mock storage as we don't have a backend yet
const STORAGE_KEY = "invoices";

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
export const addInvoice = (invoice: Invoice): Invoice => {
  try {
    const invoices = getInvoices();
    const newInvoice = { ...invoice, id: generateId() };
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
export const updateInvoice = (invoice: Invoice): Invoice => {
  try {
    if (!invoice.id) {
      throw new Error("Invoice ID is required for updates");
    }
    
    const invoices = getInvoices();
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (index === -1) {
      throw new Error("Invoice not found");
    }
    
    invoices[index] = invoice;
    saveInvoices(invoices);
    toast.success("Invoice updated successfully");
    return invoice;
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

// Generate an invoice PDF
export const generateInvoicePdf = async (invoice: Invoice): Promise<string> => {
  try {
    const response = await fetch('https://invoiceforgebackend.diorama.dev/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice)
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const data = await response.text();
    toast.success("Invoice PDF generated successfully");
    return data;
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    toast.error("Failed to generate invoice PDF");
    throw error;
  }
};

// For a real implementation, this would call the actual backend API
export const callGenerateInvoiceApi = async (invoice: Invoice): Promise<string> => {
  try {
    // For now, simulate API call
    const pdfData = await generateInvoicePdf(invoice);
    
    // Convert the base64 data to a Blob
    const byteCharacters = atob(pdfData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Create a URL for the Blob
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("API call failed:", error);
    toast.error("Failed to call invoice generation API");
    throw error;
  }
};
