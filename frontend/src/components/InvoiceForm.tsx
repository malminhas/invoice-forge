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
import { FileText, Plus, Trash2, Save, Upload, Image, Download, HelpCircle, FileOutput, Check, ChevronsUpDown } from "lucide-react";
import { addInvoice, updateInvoice, callGenerateInvoiceApi, importInvoiceSettings, callGenerateInvoiceDocxApi } from "@/services/invoiceService";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import yaml from 'js-yaml';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// PDF-compatible fonts
const pdfFonts = [
  { name: "Calibri", value: "Calibri" },
  { name: "Arial", value: "Arial" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Helvetica", value: "Helvetica" },
  { name: "Verdana", value: "Verdana" },
  { name: "Tahoma", value: "Tahoma" },
  { name: "Trebuchet MS", value: "Trebuchet MS" },
  { name: "Georgia", value: "Georgia" },
  { name: "Garamond", value: "Garamond" },
  { name: "Courier New", value: "Courier New" },
];

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
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (initialData) {
      // Set all initial data
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      
      // Set image preview if icon_data exists
      if (initialData.icon_data) {
        setImagePreview(initialData.icon_data);
      }
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Add validation for service date format
    if (name === 'service_date' && value) {
      const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
      if (!dateRegex.test(value)) {
        toast.error("Service date must be in DD.MM.YY format");
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select input changes (for dropdowns)
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleServiceChange = (index: number, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = value;
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const addServiceField = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, ""]
    }));
  };

  const removeServiceField = (index: number) => {
    if (formData.services.length <= 1) return;
    
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const fileName = file.name;
        setImagePreview(base64String);
        setFormData(prev => ({ 
          ...prev, 
          icon_name: fileName,
          icon_data: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
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
      
      if (formData.services.some(service => !service.trim())) {
        toast.error("Please fill in all service descriptions or remove empty ones");
        setIsSubmitting(false);
        return;
      }
      
      const result = isEditing 
        ? await updateInvoice(formData as Invoice)
        : await addInvoice(formData as Invoice);
      
      navigate("/");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    
    try {
      let invoiceToGenerate: Invoice;
      
      if (!isEditing) {
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
      
      const pdfUrl = await callGenerateInvoiceApi(invoiceToGenerate);
      
      const updatedInvoice = { ...invoiceToGenerate, pdf_url: pdfUrl };
      await updateInvoice(updatedInvoice);
      
      toast.success("PDF generated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      let invoiceToGenerate: Invoice;
      if (!isEditing) {
        const requiredFields = [
          "client_name", "company_name", "invoice_number",
          "invoice_date", "hourly_rate", "vat_rate"
        ];
        const missingFields = requiredFields.filter(field => 
          !formData[field as keyof InvoiceFormData]
        );
        if (missingFields.length > 0) {
          toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
          setIsGeneratingDocx(false);
          return;
        }
        invoiceToGenerate = await addInvoice(formData as Invoice);
      } else {
        invoiceToGenerate = await updateInvoice(formData as Invoice);
      }
      const docxUrl = await callGenerateInvoiceDocxApi(invoiceToGenerate);
      // Download the DOCX file
      const a = document.createElement('a');
      a.href = docxUrl;
      a.download = `invoice_${invoiceToGenerate.invoice_number}.docx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(docxUrl);
      }, 0);
      toast.success("DOCX generated and downloaded successfully!");
    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast.error("Failed to generate DOCX");
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleImportSettings = () => {
    // Import from file - only YAML files supported now
    fileInputRef.current?.click();
  };
  
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const yamlString = event.target?.result as string;
        processImportedSettings(yamlString);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Error reading YAML file:", error);
        toast.error("Failed to read YAML file: " + (error as Error).message);
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read the file");
    };
    
    reader.readAsText(file);
  };
  
  const processImportedSettings = (yamlString: string) => {
    try {
      // Parse the YAML data
      const settingsData = yaml.load(yamlString) as Record<string, any>;
      
      // Import the settings
      const importedSettings = importInvoiceSettings(settingsData);
      
      // Update the form data
      setFormData(importedSettings);
      
      // Set image preview if available
      if (settingsData.icon_data) {
        setImagePreview(settingsData.icon_data);
      }
      
      toast.success("Settings imported successfully");
    } catch (error) {
      console.error("Error processing imported settings:", error);
      toast.error("Failed to process imported settings: " + (error as Error).message);
    }
  };

  // Generate random example data
  const generateExampleData = () => {
    // Generate random data for the example
    const randomInvoiceNumber = Math.floor(1000 + Math.random() * 9000);
    const randomHourlyRate = Math.floor(100 + Math.random() * 500);
    const randomVatRate = [0, 5, 10, 15, 20, 25][Math.floor(Math.random() * 6)];
    
    // Generate a random date in dd.mm.yy format
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 60) - 30; // Random date ±30 days from today
    const randomDate = new Date(today.setDate(today.getDate() + randomDays));
    const formattedDate = `${randomDate.getDate().toString().padStart(2, '0')}.${(randomDate.getMonth() + 1).toString().padStart(2, '0')}.${randomDate.getFullYear()}`;
    
    // Random service descriptions
    const serviceTypes = ['UI Design', 'Backend Development', 'API Integration', 'AI Consultancy', 'Code Review', 'Database Optimization', 'UX Research', 'DevOps Support'];
    const randomServices = [];
    const numServices = 1 + Math.floor(Math.random() * 3); // 1-3 services
    
    for (let i = 0; i < numServices; i++) {
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      randomServices.push(`${serviceType} ${formattedDate} (${1 + Math.floor(Math.random() * 4)} hour${Math.random() > 0.5 ? 's' : ''})`);
    }
    
    const companyNames = ['Acme Solutions Ltd', 'Zenith Consulting', 'Quantum Innovations', 'Horizon Tech', 'Stellar Systems'];
    const clientNames = ['John Smith', 'Sarah Johnson', 'Miguel Rodriguez', 'Emma Wilson', 'Hiroshi Tanaka', 'Olivia Chen'];
    
    // Generate UK VAT number format
    const vatNumber = `GB ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(10 + Math.random() * 90)}`;
    
    return {
      client_name: clientNames[Math.floor(Math.random() * clientNames.length)], 
      client_address: `${Math.floor(Math.random() * 200)} Oak Street\nLondon\nSW${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}AB\nU.K.`, 
      services: randomServices, 
      service_date: formattedDate,
      service_description: `Professional ${serviceTypes[Math.floor(Math.random() * serviceTypes.length)]} Services`,
      payment_terms_days: [7, 14, 30, 60][Math.floor(Math.random() * 4)], 
      invoice_number: randomInvoiceNumber, 
      invoice_date: formattedDate, 
      company_name: companyNames[Math.floor(Math.random() * companyNames.length)], 
      company_number: `${Math.floor(10000000 + Math.random() * 90000000)}`, 
      registered_address: '123 Business Park, Innovation Way, London, EC1A 1BB', 
      vat_number: vatNumber, 
      bank_address: 'Example Bank, 1 Finance Street, London, EC2V 7PR', 
      account_number: `${Math.floor(10000000 + Math.random() * 90000000).toString().padStart(8, '0')}`, 
      sort_code: `${Math.floor(10 + Math.random() * 90).toString().padStart(2, '0')}-${Math.floor(10 + Math.random() * 90).toString().padStart(2, '0')}-${Math.floor(10 + Math.random() * 90).toString().padStart(2, '0')}`, 
      email: `contact@${companyNames[Math.floor(Math.random() * companyNames.length)].toLowerCase().replace(/\s+/g, '')}.com`, 
      contact_number: `+44 7${Math.floor(100 + Math.random() * 900)} ${Math.floor(100000 + Math.random() * 900000)}`, 
      icon_name: 'CompanyLogo.png', 
      column_widths: [2.5, 3.5], 
      font_name: ['Calibri', 'Arial', 'Helvetica', 'Roboto', 'Verdana'][Math.floor(Math.random() * 5)], 
      hourly_rate: randomHourlyRate, 
      vat_rate: randomVatRate
    };
  };

  // Add a function to show example YAML
  const showExampleYaml = () => {
    const exampleData = generateExampleData();
    
    // Convert to YAML
    const exampleYamlStr = yaml.dump(exampleData);
    
    // Create a modal or dialog to display the example
    const modal = document.createElement('dialog');
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    modal.style.maxWidth = '600px';
    modal.style.width = '100%';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Example Import YAML Format';
    heading.style.marginTop = '0';
    heading.style.marginBottom = '16px';
    heading.style.fontSize = '18px';
    heading.style.fontWeight = 'bold';
    
    const content = document.createElement('pre');
    content.textContent = exampleYamlStr;
    content.style.backgroundColor = '#f5f5f5';
    content.style.padding = '12px';
    content.style.borderRadius = '4px';
    content.style.overflow = 'auto';
    content.style.fontSize = '14px';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '16px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 16px';
    closeButton.style.backgroundColor = '#7c3aed';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => modal.close();
    
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Example';
    downloadButton.style.padding = '8px 16px';
    downloadButton.style.backgroundColor = '#4f46e5';
    downloadButton.style.color = 'white';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.onclick = () => {
      // Create a blob with the YAML content
      const blob = new Blob([exampleYamlStr], { type: 'text/yaml' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_example_${exampleData.invoice_number}.yaml`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    };
    
    buttonContainer.appendChild(downloadButton);
    buttonContainer.appendChild(closeButton);
    
    modal.appendChild(heading);
    modal.appendChild(content);
    modal.appendChild(buttonContainer);
    
    document.body.appendChild(modal);
    modal.showModal();
    
    modal.addEventListener('close', () => {
      document.body.removeChild(modal);
    });
  };

  // Add function to export current form data as YAML
  const exportAsYaml = () => {
    try {
      // Convert form data to YAML
      const yamlData = yaml.dump(formData);
      
      // Create a blob with the YAML data
      const blob = new Blob([yamlData], { type: 'text/yaml' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${formData.invoice_number || 'draft'}.yaml`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      toast.success('Settings exported as YAML');
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error('Failed to export settings: ' + (error as Error).message);
    }
  };

  // Custom file input component
  const CustomFileInput = () => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleImageUpload(e);
    };
    
    // Function to truncate long filenames
    const displayFileName = () => {
      if (!formData.icon_name) return "Choose File";
      
      // If filename is longer than 25 chars, truncate it
      if (formData.icon_name.length > 25) {
        return formData.icon_name.substring(0, 15) + '...' + 
               formData.icon_name.substring(formData.icon_name.length - 8);
      }
      
      return formData.icon_name;
    };
    
    return (
      <div className="relative w-full">
        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-invoice-purple text-white rounded-md hover:bg-invoice-deeper-purple cursor-pointer w-full transition-colors">
          <Upload size={18} />
          <span className="text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[80%]">
            {displayFileName()}
          </span>
          <input 
            type="file"
            id="icon_upload"
            accept="image/*"
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      </div>
    );
  };

  return (
    <div className="container py-8 max-w-4xl">
      {/* Hidden file input for YAML import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".yaml,.yml"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
      
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
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={handleImportSettings}
                    className="text-white hover:bg-invoice-deeper-purple"
                  >
                    <Download size={24} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import Settings from YAML</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={exportAsYaml}
                    className="text-white hover:bg-invoice-deeper-purple"
                  >
                    <Upload size={24} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export Settings as YAML</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={showExampleYaml}
                    className="text-white hover:bg-invoice-deeper-purple"
                  >
                    <HelpCircle size={24} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show & Download YAML Format Example</p>
                </TooltipContent>
              </Tooltip>
              <FileText size={32} />
            </div>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Template Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font_name">Font Name</Label>
                    <Select
                      value={formData.font_name}
                      onValueChange={(value) => handleSelectChange('font_name', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {pdfFonts.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon_upload">Company Icon</Label>
                    <div className="flex flex-col gap-3">
                      <CustomFileInput />
                      {imagePreview && (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Company icon preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
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
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms_days">Payment Terms (days) *</Label>
                    <Input
                      id="payment_terms_days"
                      name="payment_terms_days"
                      type="number"
                      value={formData.payment_terms_days}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3 text-invoice-dark-purple">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="service_date">Service Date</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter date in DD.MM.YY format (e.g., 21.04.25)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="service_date"
                      name="service_date"
                      value={formData.service_date || ""}
                      onChange={handleInputChange}
                      placeholder="DD.MM.YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_description">Service Description</Label>
                    <Input
                      id="service_description"
                      name="service_description"
                      value={formData.service_description || ""}
                      onChange={handleInputChange}
                      placeholder="General description of services provided"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-invoice-dark-purple">Services</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addServiceField}
                  >
                    Add Service
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  Services must include a date (DD.MM.YY) and hours in parentheses. The date will be displayed in a separate column.
                </div>
                {formData.services.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Service description (e.g., "AI Consultancy 21.04.25 (1 hour)")`}
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
              
              <Separator />
              
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paid"
                  name="paid"
                  checked={!!formData.paid}
                  onChange={e => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="paid" className="text-base">Mark as Paid</Label>
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
            <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
              {isGeneratingPdf && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Progress value={75} className="w-full" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Generating...</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isGeneratingPdf || isGeneratingDocx}
                  className="bg-invoice-dark-purple hover:bg-invoice-purple"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Invoice"}
                </Button>
                <Button 
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isSubmitting || isGeneratingPdf || isGeneratingDocx}
                  className="bg-invoice-purple hover:bg-invoice-dark-purple"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isGeneratingPdf ? "Generating..." : "Generate PDF"}
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateDocx}
                  disabled={isSubmitting || isGeneratingPdf || isGeneratingDocx}
                  className="bg-invoice-purple/70 hover:bg-invoice-dark-purple"
                >
                  <FileOutput className="mr-2 h-4 w-4" />
                  {isGeneratingDocx ? "Generating..." : "Generate DOCX"}
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default InvoiceForm;
