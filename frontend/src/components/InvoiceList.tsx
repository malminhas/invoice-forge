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
  Settings as SettingsIcon,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Invoice } from "@/types/invoice";
import { getInvoices, deleteInvoice } from "@/services/invoiceService";
import { toast } from "sonner";
import Settings from "./Settings";

// Define sort types
type SortField = 'invoice_number' | 'client_name' | 'invoice_date' | 'service_date' | 'service_description' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add sort state
  const [sortField, setSortField] = useState<SortField>('invoice_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  // Parse date in format like "21.04.25" to a Date object
  const parseInvoiceDate = (dateString: string) => {
    const parts = dateString.split('.');
    // Handle both 2-digit and 4-digit years
    const year = parseInt(parts[2]);
    const fullYear = year < 100 ? 2000 + year : year;
    // Months are 0-indexed in JS Date
    return new Date(fullYear, parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };

  // A safer version of calculateTotal that handles potential errors
  const safeCalculateTotal = (invoice: Invoice): number => {
    try {
      if (!invoice || !invoice.services || !Array.isArray(invoice.services)) {
        return 0;
      }
      
      // Calculate based on actual services, not just the length
      let totalHours = 0;
      invoice.services.forEach(service => {
        // Try to extract hour information from service description
        const hourMatch = service.match(/\((\d+\.?\d*)\s*hour/i);
        if (hourMatch && hourMatch[1]) {
          totalHours += parseFloat(hourMatch[1]);
        } else {
          // If no hour info found, count as 1 hour
          totalHours += 1;
        }
      });
      
      const hourlyRate = typeof invoice.hourly_rate === 'number' ? invoice.hourly_rate : 0;
      const vatRate = typeof invoice.vat_rate === 'number' ? invoice.vat_rate : 0;
      
      const subtotal = totalHours * hourlyRate;
      const vat = subtotal * (vatRate / 100);
      return subtotal + vat;
    } catch (error) {
      console.error("Error calculating total:", error);
      return 0;
    }
  };

  const calculateTotal = (invoice: Invoice) => {
    // Use the same calculation method for display as we do for sorting
    try {
      if (!invoice || !invoice.services || !Array.isArray(invoice.services)) {
        return 0;
      }
      
      // Calculate based on actual services, not just the length
      let totalHours = 0;
      invoice.services.forEach(service => {
        // Try to extract hour information from service description
        const hourMatch = service.match(/\((\d+\.?\d*)\s*hour/i);
        if (hourMatch && hourMatch[1]) {
          totalHours += parseFloat(hourMatch[1]);
        } else {
          // If no hour info found, count as 1 hour
          totalHours += 1;
        }
      });
      
      const subtotal = totalHours * invoice.hourly_rate;
      const vat = subtotal * (invoice.vat_rate / 100);
      return subtotal + vat;
    } catch (error) {
      // Fall back to simple calculation if there's an error
      const hours = invoice.services.length;
      const subtotal = hours * invoice.hourly_rate;
      const vat = subtotal * (invoice.vat_rate / 100);
      return subtotal + vat;
    }
  };

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // Default to descending for new sort field
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Apply filtering and sorting
  const getFilteredAndSortedInvoices = () => {
    // First filter
    const filtered = invoices.filter(invoice => 
      invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toString().includes(searchQuery)
    );
    
    // Then sort the filtered list
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      try {
        switch (sortField) {
          case 'invoice_number':
            comparison = a.invoice_number - b.invoice_number;
            break;
          case 'client_name':
            comparison = a.client_name.localeCompare(b.client_name);
            break;
          case 'invoice_date':
            // Parse dates for comparison
            const dateA = parseInvoiceDate(a.invoice_date);
            const dateB = parseInvoiceDate(b.invoice_date);
            comparison = dateA.getTime() - dateB.getTime();
            break;
          case 'service_date':
            // Parse service dates for comparison
            if (a.service_date && b.service_date) {
              const serviceDateA = parseInvoiceDate(a.service_date);
              const serviceDateB = parseInvoiceDate(b.service_date);
              comparison = serviceDateA.getTime() - serviceDateB.getTime();
            } else if (a.service_date) {
              comparison = 1;
            } else if (b.service_date) {
              comparison = -1;
            }
            break;
          case 'service_description':
            // Compare service descriptions as strings
            comparison = (a.service_description || "").localeCompare(b.service_description || "");
            break;
          case 'amount':
            // Direct calculation for sorting - simplify the logic for amounts
            const totalA = calculateTotal(a);
            const totalB = calculateTotal(b);
            comparison = totalA - totalB;
            break;
          case 'status':
            // Sort by PDF status (PDF Generated comes before Draft)
            comparison = (a.pdf_url ? 1 : 0) - (b.pdf_url ? 1 : 0);
            break;
        }
      } catch (error) {
        console.error("Error during sorting:", error);
        return 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Get the sorted and filtered invoices on each render
  const filteredInvoices = getFilteredAndSortedInvoices();

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

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 inline" /> 
      : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  // Get a class for the active sort column
  const getSortColumnClass = (field: SortField) => {
    return field === sortField 
      ? "bg-invoice-purple/10 font-medium" 
      : "";
  };

  // Style for sortable column headers
  const sortableHeaderStyle = "cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 select-none relative";

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
              <Table key={`${sortField}-${sortDirection}`}>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead 
                      className={`w-[150px] ${sortableHeaderStyle} ${getSortColumnClass('invoice_number')}`}
                      onClick={() => handleSort('invoice_number')}
                    >
                      Invoice # {renderSortIndicator('invoice_number')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('client_name')}`}
                      onClick={() => handleSort('client_name')}
                    >
                      Client {renderSortIndicator('client_name')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('invoice_date')}`}
                      onClick={() => handleSort('invoice_date')}
                    >
                      Date {renderSortIndicator('invoice_date')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('service_date')}`}
                      onClick={() => handleSort('service_date')}
                    >
                      Service Date {renderSortIndicator('service_date')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('service_description')}`}
                      onClick={() => handleSort('service_description')}
                    >
                      Service Description {renderSortIndicator('service_description')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('amount')}`}
                      onClick={() => handleSort('amount')}
                    >
                      Amount {renderSortIndicator('amount')}
                    </TableHead>
                    <TableHead 
                      className={`${sortableHeaderStyle} ${getSortColumnClass('status')}`}
                      onClick={() => handleSort('status')}
                    >
                      Status {renderSortIndicator('status')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell>{invoice.invoice_date}</TableCell>
                      <TableCell>{invoice.service_date || '-'}</TableCell>
                      <TableCell>{invoice.service_description || '-'}</TableCell>
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
                              <SettingsIcon className="h-4 w-4" />
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
