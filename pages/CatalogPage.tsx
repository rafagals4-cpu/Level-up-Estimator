
import React, { useState } from 'react';
import { Product, ProductUnit } from '../types';
import { formatCurrency, ICONS } from '../constants';

interface CatalogPageProps {
  products: Product[];
  onAdd: (product: Product) => void;
}

const CatalogPage: React.FC<CatalogPageProps> = ({ products, onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'Flooring', unit: ProductUnit.SQFT, unitPrice: 0, description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      category: formData.category as any,
    };
    onAdd(newProduct);
    setIsModalOpen(false);
    setFormData({ name: '', category: 'Flooring', unit: ProductUnit.SQFT, unitPrice: 0, description: '' });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Product Catalog</h2>
          <p className="text-slate-500">Manage your materials and base pricing for US jobs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <ICONS.Plus /> Add Item
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <th className="py-4 px-6">Material / Service</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Unit</th>
              <th className="py-4 px-6 text-right">Unit Price (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6">
                  <div>
                    <p className="font-bold text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400 italic line-clamp-1">{p.description}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.category === 'Flooring' ? 'bg-amber-100 text-amber-700' :
                    p.category === 'Baseboard' ? 'bg-green-100 text-green-700' :
                    p.category === 'Labor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {p.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-500">{p.unit}</td>
                <td className="py-4 px-6 text-right font-bold text-slate-800">{formatCurrency(p.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
             <h3 className="text-xl font-bold mb-6 text-slate-800">New Catalog Item</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                    <select
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      <option value="Flooring">Flooring</option>
                      <option value="Baseboard">Baseboard</option>
                      <option value="Labor">Labor</option>
                      <option value="Underlayment">Underlayment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Selling Unit</label>
                    <select
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                    >
                      {Object.values(ProductUnit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Unit Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border-0 rounded-xl pl-12 pr-4 py-3 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                      value={formData.unitPrice}
                      onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    />
                  </div>
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg">Save Item</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
