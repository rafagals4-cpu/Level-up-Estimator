
import React, { useState } from 'react';
import { Client, ClientAddress } from '../types';
import { ICONS } from '../constants';

interface ClientsPageProps {
  clients: Client[];
  onAdd: (client: Client) => void;
  onDelete?: (id: string) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'address'>('info');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    street: '', 
    city: '', 
    state: '', 
    zipCode: '' 
  });

  // Filter clients based on search
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      },
      createdAt: new Date().toISOString()
    };
    onAdd(newClient);
    setFormData({ name: '', email: '', phone: '', street: '', city: '', state: '', zipCode: '' });
    setIsModalOpen(false);
    setActiveTab('info');
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Delete ${name}?`)) {
        if (onDelete) {
            onDelete(id);
        }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Compacto */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Client Hub</h2>
          <p className="text-slate-500 font-bold text-xs">Total Clients: {clients.length}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           {/* Search Input */}
           <div className="relative flex-1 md:w-64">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Find client..." 
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wide hover:bg-black transition-all shadow-lg active:scale-95 shrink-0"
           >
            <ICONS.Plus /> Add
           </button>
        </div>
      </header>

      {/* List View Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* List Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="w-8"></div> {/* Avatar spacer */}
            <div className="flex-1 pl-3">Name / Contact</div>
            <div className="hidden md:block w-32">Phone</div>
            <div className="hidden md:block flex-1">Location</div>
            <div className="w-10 text-right">Action</div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-slate-50">
            {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium italic">
                    {searchTerm ? 'No matching clients found.' : 'No clients added yet.'}
                </div>
            ) : (
                filteredClients.map(client => (
                    <div key={client.id} className="group flex items-center px-4 py-3 hover:bg-blue-50/50 transition-colors cursor-default">
                        
                        {/* Avatar */}
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-black border border-slate-200 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                            {client.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name & Email */}
                        <div className="flex-1 pl-3 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate leading-none mb-1">{client.name}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{client.email || 'No email'}</p>
                        </div>

                        {/* Phone (Desktop) */}
                        <div className="hidden md:block w-32 text-xs font-medium text-slate-600">
                            {client.phone || '-'}
                        </div>

                        {/* Location (Desktop) */}
                        <div className="hidden md:block flex-1 text-xs text-slate-500 truncate pr-4">
                            {client.address.city}, {client.address.state}
                        </div>

                        {/* Actions */}
                        <div className="w-10 flex justify-end">
                            <button 
                                onClick={(e) => handleDelete(e, client.id, client.name)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete"
                            >
                                <ICONS.Trash />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Client Onboarding</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex bg-white p-1 rounded-2xl shadow-inner border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'info' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  INFO
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('address')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'address' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  ADDRESS
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 bg-white max-h-[70vh] overflow-y-auto">
              {activeTab === 'info' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Street</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                      value={formData.street}
                      onChange={e => setFormData({ ...formData, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">City</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">State</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ZIP</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-700"
                      value={formData.zipCode}
                      onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 pb-6 md:pb-0">
                {activeTab === 'info' ? (
                  <div className="flex gap-3">
                    <button 
                        type="submit" 
                        className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 text-sm uppercase tracking-wide"
                    >
                        Save
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('address')}
                        className="flex-1 bg-slate-100 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-sm uppercase tracking-wide"
                    >
                        Next: Address
                    </button>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    className="w-full bg-brand-lime text-black font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-all active:scale-95 text-sm uppercase tracking-wide"
                  >
                    Complete Onboarding
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
