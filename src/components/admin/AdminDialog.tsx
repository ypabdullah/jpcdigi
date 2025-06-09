import React, { useState } from 'react';
import ServiceForm from './ServiceForm';
import ProductForm from './ProductForm';
import DigiflazzConfigForm from './DigiflazzConfigForm';
import TransactionForm from './TransactionForm';

interface AdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formType: 'service' | 'product' | 'digiflazz' | 'transaction';
  selectedItem: any | null;
  onSave: (data: any, type: string) => void;
}

const AdminDialog: React.FC<AdminDialogProps> = ({ isOpen, onClose, formType, selectedItem, onSave }) => {
  if (!isOpen) return null;

  const getTitle = () => {
    if (selectedItem) {
      switch (formType) {
        case 'service': return 'Edit Layanan PPOB';
        case 'product': return 'Edit Produk PPOB';
        case 'digiflazz': return 'Edit Konfigurasi Digiflazz';
        case 'transaction': return 'Edit Transaksi PPOB';
        default: return 'Edit Item';
      }
    } else {
      switch (formType) {
        case 'service': return 'Tambah Layanan PPOB';
        case 'product': return 'Tambah Produk PPOB';
        case 'digiflazz': return 'Tambah Konfigurasi Digiflazz';
        case 'transaction': return 'Tambah Transaksi PPOB';
        default: return 'Tambah Item';
      }
    }
  };

  const handleSave = (data: any) => {
    onSave(data, formType);
  };

  const renderForm = () => {
    switch (formType) {
      case 'service':
        return <ServiceForm item={selectedItem} onSave={handleSave} onCancel={onClose} />;
      case 'product':
        return <ProductForm item={selectedItem} onSave={handleSave} onCancel={onClose} />;
      case 'digiflazz':
        return <DigiflazzConfigForm item={selectedItem} onSave={handleSave} onCancel={onClose} />;
      case 'transaction':
        return <TransactionForm item={selectedItem} onSave={handleSave} onCancel={onClose} />;
      default:
        return <div>Form tidak ditemukan</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{getTitle()}</h3>
            <div className="mt-4">{renderForm()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDialog;
