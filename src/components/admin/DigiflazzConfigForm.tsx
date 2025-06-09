import React, { useState } from 'react';

interface DigiflazzConfigFormProps {
  item: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const DigiflazzConfigForm: React.FC<DigiflazzConfigFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: item?.username || '',
    api_key: item?.api_key || '',
    webhook_url: item?.webhook_url || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username Digiflazz</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan username Digiflazz"
        />
      </div>
      <div>
        <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">API Key Digiflazz</label>
        <input
          type="password"
          id="api_key"
          name="api_key"
          value={formData.api_key}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan API Key Digiflazz"
        />
      </div>
      <div>
        <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700">Webhook URL (Opsional)</label>
        <input
          type="text"
          id="webhook_url"
          name="webhook_url"
          value={formData.webhook_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Masukkan URL webhook untuk notifikasi"
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

export default DigiflazzConfigForm;
