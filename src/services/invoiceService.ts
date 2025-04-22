
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
    // This would be a real API call in production
    // For now, we'll simulate a successful API call with a timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate the PDF URL (in a real app, this would come from the API)
    const mockPdfUrl = `data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PAovRmlsdGVyIC9GbGF0ZURlY29kZQovTGVuZ3RoIDM4Cj4+CnN0cmVhbQp4nCvkMlAwUDC1NNUzMVGwMDHUszRSKErlCtfiyuMK5AIAXQ8GCgplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgMSAwIFIKL0YyIDIgMCBSCj4+Cj4+Ci9Db250ZW50cyA1IDAgUgovUGFyZW50IDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbNCAwIFJdCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkCj4+CmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDM0MyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAyMTMgMDAwMDAgbiAKMDAwMDAwMDEwMyAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDA0MTAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA3Ci9Sb290IDYgMCBSCi9JRCBbPDg5MUJESUI4MTM1MUE1NDlDNDhCOUFFNzczQzM2QkVGPiA8ODkxQkRJQjgxMzUxQTU0OUM0OEI5QUU3NzNDMzZCRUY+XQo+PgpzdGFydHhyZWYKNDU5CiUlRU9GCg==`;
    
    toast.success("Invoice PDF generated successfully");
    return mockPdfUrl;
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    toast.error("Failed to generate invoice PDF");
    throw error;
  }
};

// For a real implementation, this would call the actual backend API
export const callGenerateInvoiceApi = async (invoice: Invoice): Promise<string> => {
  try {
    // In a real implementation, this would be:
    // const response = await fetch("http://localhost:8000/generate-invoice?format=pdf", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(invoice),
    // });
    // if (!response.ok) throw new Error("API call failed");
    // const blob = await response.blob();
    // return URL.createObjectURL(blob);
    
    // For now, simulate API call
    return await generateInvoicePdf(invoice);
  } catch (error) {
    console.error("API call failed:", error);
    toast.error("Failed to call invoice generation API");
    throw error;
  }
};
