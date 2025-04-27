
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InvoiceForm from "@/components/InvoiceForm";
import { Invoice } from "@/types/invoice";
import { getInvoices } from "@/services/invoiceService";
import { toast } from "sonner";

const EditInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the invoice data
    if (id) {
      const invoices = getInvoices();
      const foundInvoice = invoices.find(inv => inv.id === id);
      
      if (foundInvoice) {
        setInvoice(foundInvoice);
      } else {
        toast.error("Invoice not found");
        navigate("/");
      }
    }
    
    setLoading(false);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-invoice-purple mx-auto"></div>
          <p className="mt-4 text-invoice-dark-purple">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 bg-invoice-deeper-purple text-white">
        <div className="container max-w-6xl">
          <h1 className="text-2xl font-bold">Invoice Forge</h1>
        </div>
      </div>
      
      {invoice && <InvoiceForm initialData={invoice} isEditing />}
    </div>
  );
};

export default EditInvoicePage;
