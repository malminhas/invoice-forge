
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  FileText, 
  Edit, 
  Download, 
  Trash2, 
  Settings as SettingsIcon 
} from "lucide-react";
import { Invoice } from "@/types/invoice";
import { getInvoices, deleteInvoice } from "@/services/invoiceService";
import { toast } from "sonner";
import Settings from "./Settings";

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadInvoices = () => {
      const loadedInvoices = getInvoices();
      setInvoices(loadedInvoices);
    };
    
    loadInvoices();
    
    window.addEventListener("focus", loadInvoices);
    
    return () => {
      window.removeEventListener("focus", loadInvoices);
    };
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_number.toString().includes(searchQuery)
  );

  const handleCreateInvoice = () => {
    navigate("/invoices/create");
  };

  const handleEditInvoice = (id: string) => {
    navigate(`/invoices/edit/${id}`);
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    if (!invoice.pdf_url) {
      toast.error("No PDF available. Generate a PDF first.");
      return;
    }

    const link = document.createElement('a');
    link.href = invoice.pdf_url;
    link.download = `invoice-${invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, "_blank");
    } else {
      toast.error("No PDF available. Generate a PDF first.");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (isDeleting) return;
    
    if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteInvoice(id);
        setInvoices(invoices.filter(invoice => invoice.id !== id));
      } catch (error) {
        console.error("Error deleting invoice:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };

  const calculateTotal = (invoice: Invoice) => {
    const hours = invoice.services.length;
    const subtotal = hours * invoice.hourly_rate;
    const vat = subtotal * (invoice.vat_rate / 100);
    return subtotal + vat;
  };

  return (
    <div className="container py-8 max-w-6xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-invoice-purple text-white">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Invoice Repository</CardTitle>
              <CardDescription className="text-white/80 mt-1">
                Manage and generate your invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Settings />
              <Button 
                onClick={handleCreateInvoice} 
                className="bg-white text-invoice-purple hover:bg-gray-100 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6">
            <Input
              placeholder="Search by client, company or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {invoices.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-gray-50">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices yet</h3>
              <p className="text-gray-500 mb-4">Create your first invoice to get started</p>
              <Button 
                onClick={handleCreateInvoice} 
                className="bg-invoice-purple hover:bg-invoice-dark-purple"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <p className="text-gray-500">No invoices match your search criteria</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell>{invoice.invoice_date}</TableCell>
                      <TableCell>{formatCurrency(calculateTotal(invoice))}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${invoice.pdf_url 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800"}`}
                        >
                          {invoice.pdf_url ? "PDF Generated" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id!)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {invoice.pdf_url && (
                              <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteInvoice(invoice.id!)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {filteredInvoices.length > 0 && (
          <CardFooter className="border-t p-6">
            <div className="flex items-center text-sm text-gray-500">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default InvoiceList;
