export interface Invoice {
  id?: string;
  client_name: string;
  client_address: string;
  services: string[];
  service_date?: string; // Date when the service was provided
  service_description?: string; // Description of the service provided
  payment_terms_days: number;
  invoice_number: number;
  invoice_date: string;
  company_name: string;
  hourly_rate: number;
  vat_rate: number;
  account_number: string;
  sort_code: string;
  bank_address: string;
  company_number: string;
  vat_number: string;
  registered_address: string;
  email: string;
  contact_number: string;
  column_widths: number[];
  font_name: string;
  icon_name: string;
  icon_hash?: string; // Hash reference to the stored image
  icon_data?: string; // Legacy field for backward compatibility
  pdf_url?: string;
  paid?: boolean;
}

export interface InvoiceFormData extends Invoice {
  paid?: boolean;
}

export const defaultInvoiceData: InvoiceFormData = {
  client_name: "",
  client_address: "",
  services: [""],
  service_date: "",
  service_description: "",
  payment_terms_days: 30,
  invoice_number: 1000,
  invoice_date: new Date().toLocaleDateString("en-GB"),
  company_name: "",
  hourly_rate: 300,
  vat_rate: 20,
  account_number: "",
  sort_code: "",
  bank_address: "",
  company_number: "",
  vat_number: "",
  registered_address: "",
  email: "",
  contact_number: "",
  column_widths: [2.5, 3.5],
  font_name: "Calibri",
  icon_name: "",
  paid: false
};
