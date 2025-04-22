
import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';

const EndpointConfig = () => {
  const [endpoint, setEndpoint] = useState('');

  useEffect(() => {
    const savedEndpoint = localStorage.getItem('pdfEndpoint');
    if (savedEndpoint) {
      setEndpoint(savedEndpoint);
    } else {
      const defaultEndpoint = 'http://localhost:8000/generate-pdf';
      setEndpoint(defaultEndpoint);
      localStorage.setItem('pdfEndpoint', defaultEndpoint);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('pdfEndpoint', endpoint);
    toast.success('PDF endpoint updated successfully');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">PDF Endpoint Configuration</h2>
      <div className="flex gap-2">
        <Input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="Enter PDF generation endpoint URL"
          className="flex-1"
        />
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};

export default EndpointConfig;
