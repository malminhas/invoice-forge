
import React from "react";
import InvoiceForm from "@/components/InvoiceForm";

const CreateInvoicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 bg-invoice-deeper-purple text-white">
        <div className="container max-w-6xl">
          <h1 className="text-2xl font-bold">Invoice Forge</h1>
        </div>
      </div>
      <InvoiceForm />
    </div>
  );
};

export default CreateInvoicePage;
