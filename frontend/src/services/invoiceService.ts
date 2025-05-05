import { toast } from "sonner";
import { Invoice } from "@/types/invoice";
import yaml from 'js-yaml';

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
    const newInvoice = { 
      ...invoice, 
      id: generateId(),
      // Ensure icon data is properly saved
      icon_name: invoice.icon_name || "",
      icon_data: invoice.icon_data || null,
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
    
    // Ensure icon_data is preserved
    if (!invoice.icon_data && invoices[index].icon_data) {
      invoice.icon_data = invoices[index].icon_data;
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

export const generateInvoicePdf = async (invoice: Invoice): Promise<string> => {
  try {
    // Clean and prepare the invoice data
    const invoiceData = {
      ...invoice,
      hourly_rate: Number(invoice.hourly_rate),
      vat_rate: Number(invoice.vat_rate),
      invoice_number: Number(invoice.invoice_number),
      payment_terms_days: Number(invoice.payment_terms_days || 0)
    };

    console.log("Preparing to send invoice data to API:", invoiceData);
    
    const endpoint = localStorage.getItem('pdfEndpoint') || 'http://localhost:8000/generate-invoice?format=pdf';
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
      icon_name: settings.icon_name || ""
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
    const invoiceData = {
      ...invoice,
      hourly_rate: Number(invoice.hourly_rate),
      vat_rate: Number(invoice.vat_rate),
      invoice_number: Number(invoice.invoice_number),
      payment_terms_days: Number(invoice.payment_terms_days || 0)
    };
    const endpoint = (localStorage.getItem('pdfEndpoint') || 'http://localhost:8000/generate-invoice?format=pdf').replace('format=pdf', 'format=docx');
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
