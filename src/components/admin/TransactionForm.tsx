import React, { useState } from 'react';

interface TransactionFormProps {
  item: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    status: item?.status || '',
    message: item?.message || '',
    sn: item?.sn || '',
    price: item?.price || 0,
    buyer_last_balance: item?.buyer_last_balance || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'buyer_last_balance' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <input
          type="text"
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan status transaksi"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Pesan</label>
        <input
          type="text"
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan pesan transaksi"
        />
      </div>
      <div>
        <label htmlFor="sn" className="block text-sm font-medium text-gray-700">Serial Number (SN)</label>
        <input
          type="text"
          id="sn"
          name="sn"
          value={formData.sn}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan serial number"
        />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan harga"
        />
      </div>
      <div>
        <label htmlFor="buyer_last_balance" className="block text-sm font-medium text-gray-700">Saldo Terakhir Pembeli (Rp)</label>
        <input
          type="number"
          id="buyer_last_balance"
          name="buyer_last_balance"
          value={formData.buyer_last_balance}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan saldo terakhir pembeli"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Simpan
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
