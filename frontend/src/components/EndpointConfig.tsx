import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';

const EndpointConfig = () => {
  const [endpoint, setEndpoint] = useState('');
  const [pdfBackend, setPdfBackend] = useState('libreoffice');

  useEffect(() => {
    const savedEndpoint = localStorage.getItem('pdfEndpoint');
    if (savedEndpoint) {
      setEndpoint(savedEndpoint);
    } else {
      const defaultEndpoint = 'http://localhost:8000/generate-invoice?format=pdf';
      setEndpoint(defaultEndpoint);
      localStorage.setItem('pdfEndpoint', defaultEndpoint);
    }
    const savedBackend = localStorage.getItem('pdfBackend');
    if (savedBackend) {
      setPdfBackend(savedBackend);
    } else {
      setPdfBackend('libreoffice');
      localStorage.setItem('pdfBackend', 'libreoffice');
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfBackend', pdfBackend);
    toast.success('PDF endpoint and backend updated successfully');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 select-none">PDF Endpoint Configuration</h2>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="pdf-endpoint" className="font-medium text-base min-w-[160px]">PDF Endpoint:</label>
          <Input
            id="pdf-endpoint"
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Enter PDF generation endpoint URL"
            className="text-base w-[420px] max-w-full"
          />
          <Button onClick={handleSave} className="text-base px-4 py-2">Save</Button>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="pdf-backend" className="font-medium text-base min-w-[160px]">PDF Backend:</label>
          <select
            id="pdf-backend"
            value={pdfBackend}
            onChange={(e) => setPdfBackend(e.target.value)}
            className="border rounded px-2 py-1 text-base min-w-[180px]"
          >
            <option value="libreoffice">LibreOffice (default)</option>
            <option value="docx2pdf">docx2pdf</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EndpointConfig;
