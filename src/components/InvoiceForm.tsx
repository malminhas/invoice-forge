
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Invoice, InvoiceFormData, defaultInvoiceData } from "@/types/invoice";
import { FileText, Plus, Trash2, Save } from "lucide-react";
import { addInvoice, updateInvoice, callGenerateInvoiceApi } from "@/services/invoiceService";

interface InvoiceFormProps {
  initialData?: Invoice;
  isEditing?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  initialData, 
  isEditing = false 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InvoiceFormData>(
    initialData || defaultInvoiceData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle numeric input changes
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) || value === "") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === "" ? "" : numValue 
      }));
    }
  };

  // Handle services array changes
  const handleServiceChange = (index: number, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = value;
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  // Add a new service field
  const addServiceField = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, ""]
    }));
  };

  // Remove a service field
  const removeServiceField = (index: number) => {
    if (formData.services.length <= 1) return;
    
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = [
        "client_name", "company_name", "invoice_number",
        "invoice_date", "hourly_rate", "vat_rate"
      ];
      
      const missingFields = requiredFields.filter(field => 
        !formData[field as keyof InvoiceFormData]
      );
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }
      
      // Validate services
      if (formData.services.some(service => !service.trim())) {
        toast.error("Please fill in all service descriptions or remove empty ones");
        setIsSubmitting(false);
        return;
      }
      
      // Process form data
      const result = isEditing 
        ? await updateInvoice(formData as Invoice)
        : await addInvoice(formData as Invoice);
      
      // Navigate back to invoice list
      navigate("/");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // First save the invoice if it's new
      let invoiceToGenerate: Invoice;
      
      if (!isEditing) {
        // Validate required fields first
        const requiredFields = [
          "client_name", "company_name", "invoice_number",
          "invoice_date", "hourly_rate", "vat_rate"
        ];
        
        const missingFields = requiredFields.filter(field => 
          !formData[field as keyof InvoiceFormData]
        );
        
        if (missingFields.length > 0) {
          toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
          setIsGeneratingPdf(false);
          return;
        }
        
        invoiceToGenerate = await addInvoice(formData as Invoice);
      } else {
        invoiceToGenerate = await updateInvoice(formData as Invoice);
      }
      
      // Generate the PDF
      const pdfUrl = await callGenerateInvoiceApi(invoiceToGenerate);
      
      // Update the invoice with the PDF URL
      const updatedInvoice = { ...invoiceToGenerate, pdf_url: pdfUrl };
      await updateInvoice(updatedInvoice);
      
      // Open the PDF in a new tab
      window.open(pdfUrl, "_blank");
      
      // Navigate back to the invoice list
      navigate("/");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-invoice-purple text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                {isEditing ? "Edit Invoice" : "Create New Invoice"}
              </CardTitle>
              <CardDescription className="text-white/80 mt-1">
                {isEditing 
                  ? "Update the invoice details below" 
                  : "Fill in the details to create a new invoice"}
              </CardDescription>
            </div>
            <FileText size={32} />
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Contact Number</Label>
                    <Input
                      id="contact_number"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registered_address">Registered Address</Label>
                    <Textarea
                      id="registered_address"
                      name="registered_address"
                      value={formData.registered_address}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_number">Company Number</Label>
                    <Input
                      id="company_number"
                      name="company_number"
                      value={formData.company_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vat_number">VAT Number</Label>
                    <Input
                      id="vat_number"
                      name="vat_number"
                      value={formData.vat_number}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Client Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_address">Client Address</Label>
                    <Textarea
                      id="client_address"
                      name="client_address"
                      value={formData.client_address}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Invoice Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number *</Label>
                    <Input
                      id="invoice_number"
                      name="invoice_number"
                      type="number"
                      value={formData.invoice_number}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      name="invoice_date"
                      value={formData.invoice_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms_days">Payment Terms (Days)</Label>
                    <Input
                      id="payment_terms_days"
                      name="payment_terms_days"
                      type="number"
                      value={formData.payment_terms_days}
                      onChange={handleNumericChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (£) *</Label>
                    <Input
                      id="hourly_rate"
                      name="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vat_rate">VAT Rate (%) *</Label>
                    <Input
                      id="vat_rate"
                      name="vat_rate"
                      type="number"
                      value={formData.vat_rate}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Services */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-invoice-dark-purple">Services</h3>
                  <Button 
                    type="button" 
                    onClick={addServiceField}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Service
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.services.map((service, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Service description (e.g., "AI Consultancy 29.03.25 (1 hour)")`}
                        value={service}
                        onChange={(e) => handleServiceChange(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeServiceField(index)}
                        disabled={formData.services.length <= 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_code">Sort Code</Label>
                    <Input
                      id="sort_code"
                      name="sort_code"
                      value={formData.sort_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bank_address">Bank Address</Label>
                    <Textarea
                      id="bank_address"
                      name="bank_address"
                      value={formData.bank_address}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Template Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Template Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font_name">Font Name</Label>
                    <Input
                      id="font_name"
                      name="font_name"
                      value={formData.font_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon_name">Icon Name</Label>
                    <Input
                      id="icon_name"
                      name="icon_name"
                      value={formData.icon_name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || isGeneratingPdf}
                className="bg-invoice-dark-purple hover:bg-invoice-purple"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Invoice"}
              </Button>
              <Button 
                type="button"
                onClick={handleGeneratePdf}
                disabled={isSubmitting || isGeneratingPdf}
                className="bg-invoice-purple hover:bg-invoice-dark-purple"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isGeneratingPdf ? "Generating..." : "Generate PDF"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default InvoiceForm;
