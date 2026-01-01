
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Estimate, Client, Product, CompanyProfile, ProjectStatus } from '../types';
import { formatCurrency, ICONS } from '../constants';
import { generateEstimatePDF } from '../services/pdfGenerator.ts';

interface EstimatesPageProps {
  estimates: Estimate[];
  clients: Client[];
  products: Product[];
  companyProfile: CompanyProfile;
  onUpdate?: (estimate: Estimate) => void;
}

const EstimatesPage: React.FC<EstimatesPageProps> = ({ estimates, clients, products, companyProfile, onUpdate }) => {
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const filteredEstimates = estimates.filter(est => {
    const client = clients.find(c => c.id === est.clientId);
    const searchString = `${client?.name} ${est.id} ${est.totalAmount}`.toLowerCase();
    return searchString.includes(filter.toLowerCase());
  });

  const handlePreview = (e: React.MouseEvent, estimate: Estimate) => {
    e.preventDefault();
    e.stopPropagation();
    const client = clients.find(c => c.id === estimate.clientId);
    if (client) {
      const doc = generateEstimatePDF(estimate, client, products, companyProfile);
      // Open in new tab
      window.open(doc.output('bloburl'), '_blank');
    } else {
      alert("Client data missing");
    }
  };

  const handleDownload = (e: React.MouseEvent, estimate: Estimate) => {
    e.preventDefault();
    e.stopPropagation();
    const client = clients.find(c => c.id === estimate.clientId);
    if (client) {
      const doc = generateEstimatePDF(estimate, client, products, companyProfile);
      const shortId = estimate.id.includes('EST-') ? estimate.id.split('-')[1] : estimate.id;
      doc.save(`Estimate_${client.name.replace(/\s/g, '_')}_${shortId}.pdf`);
    } else {
      alert("Client data missing");
    }
  };

  const handleEdit = (e: React.MouseEvent, estimate: Estimate) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/builder?editId=${estimate.id}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, estimate: Estimate) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUpdate) {
      onUpdate({ ...estimate, status: e.target.value as ProjectStatus });
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PAID: return 'bg-brand-lime text-black border-brand-lime';
      case ProjectStatus.APPROVED: return 'bg-blue-600 text-white border-blue-600';
      case ProjectStatus.SCHEDULED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case ProjectStatus.NEW: return 'bg-slate-100 text-slate-500 border-slate-200';
      case ProjectStatus.CANCELLED: return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Estimates</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest mt-1">Manage & Track Quotes</p>
        </div>
        <Link 
          to="/builder"
          className="flex items-center gap-2 bg-brand-lime text-black px-6 py-3 rounded-full font-black uppercase italic shadow-lg hover:scale-105 transition-transform active:scale-95"
        >
          <ICONS.Plus /> New Quote
        </Link>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by client, ID or amount..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-lime transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID & Date</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Client</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
              <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEstimates.length === 0 ? (
               <tr>
                 <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ICONS.FileText />
                      </div>
                      <p className="font-black text-slate-500 uppercase tracking-widest">No Estimates Found</p>
                    </div>
                 </td>
               </tr>
            ) : (
              filteredEstimates.map(est => {
                const client = clients.find(c => c.id === est.clientId);
                return (
                  <tr key={est.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-6">
                      <p className="font-bold text-slate-900 text-xs">{est.id}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(est.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-black text-slate-800 text-sm">{client?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{client?.address.street}</p>
                    </td>
                    <td className="py-5 px-6">
                       <div className="relative inline-block">
                         <select
                           value={est.status}
                           onChange={(e) => handleStatusChange(e, est)}
                           onClick={(e) => e.stopPropagation()}
                           className={`appearance-none pl-3 pr-8 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer outline-none border transition-colors ${getStatusColor(est.status)}`}
                         >
                            {Object.values(ProjectStatus).map(s => (
                              <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                            ))}
                         </select>
                         <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="6 9 12 15 18 9"/></svg>
                         </div>
                       </div>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className="font-black text-slate-900 italic text-lg">{formatCurrency(est.totalAmount)}</span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                         {/* Edit Button */}
                         <button 
                            onClick={(e) => handleEdit(e, est)}
                            title="Edit Estimate"
                            className="text-slate-400 hover:text-amber-600 transition-colors"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>

                         {/* Preview Button */}
                         <button 
                            onClick={(e) => handlePreview(e, est)}
                            title="Preview PDF"
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                         {/* Download Button */}
                          <button 
                            onClick={(e) => handleDownload(e, est)}
                            title="Download PDF"
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimatesPage;
