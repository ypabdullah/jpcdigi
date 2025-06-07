import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const PPOB_PLN = () => {
  const [customerId, setCustomerId] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkPLNCustomer = async () => {
    setLoading(true);
    setError('');
    try {
      // Use environment variable or fallback to a configurable proxy URL
      const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://194.233.65.45:3000/api/digiflazz-proxy';
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cmd: 'prepaid',
          code: 'PLN',
          data: customerId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setCustomerData(data.data);
      } else {
        setError(data.message || 'Failed to retrieve customer data');
      }
    } catch (err) {
      console.error('Error fetching PLN customer data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">PPOB - Layanan PLN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customerId">Nomor ID Pelanggan PLN</Label>
              <Input 
                id="customerId" 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Masukkan nomor ID pelanggan"
              />
            </div>
            <Button 
              onClick={checkPLNCustomer} 
              disabled={loading || !customerId}
              className="w-full"
            >
              {loading ? 'Memeriksa...' : 'Cek Data Pelanggan'}
            </Button>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            {customerData && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Data Pelanggan PLN</h3>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="font-medium">Nama:</span> {customerData.name}
                  </div>
                  <div>
                    <span className="font-medium">ID Pelanggan:</span> {customerData.id}
                  </div>
                  <div>
                    <span className="font-medium">Tarif/Daya:</span> {customerData.tariff}
                  </div>
                  <div>
                    <span className="font-medium">Tagihan:</span> Rp {customerData.bill_amount.toLocaleString('id-ID')}
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  Bayar Tagihan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PPOB_PLN;
