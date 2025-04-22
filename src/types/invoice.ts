
export interface Invoice {
  id?: string;
  client_name: string;
  client_address: string;
  services: string[];
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
  pdf_url?: string;
}

export interface InvoiceFormData extends Invoice {}

export const defaultInvoiceData: InvoiceFormData = {
  client_name: "",
  client_address: "",
  services: [""],
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
  icon_name: ""
};
