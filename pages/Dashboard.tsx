
import React from 'react';
import { Estimate, Client, ProjectStatus } from '../types';
import { formatCurrency, ICONS } from '../constants';

interface DashboardProps {
  estimates: Estimate[];
  clients: Client[];
}

const Dashboard: React.FC<DashboardProps> = ({ estimates, clients }) => {
  // Calculate Approved Revenue: Sum of Approved, Scheduled, and Paid jobs
  const approvedValue = estimates
    .filter(e => 
      e.status === ProjectStatus.APPROVED || 
      e.status === ProjectStatus.SCHEDULED || 
      e.status === ProjectStatus.PAID
    )
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const stats = [
    { label: 'Pipeline', value: formatCurrency(estimates.reduce((acc, curr) => acc + curr.totalAmount, 0)), color: 'bg-brand-lime text-black border-brand-lime' },
    { label: 'Paid Jobs', value: estimates.filter(e => e.status === ProjectStatus.PAID).length, color: 'bg-white text-slate-900 border-slate-200' },
    { label: 'Approved Value', value: formatCurrency(approvedValue), color: 'bg-white text-slate-900 border-slate-200' },
    { label: 'In Review', value: formatCurrency(estimates.filter(e => e.status === ProjectStatus.NEW).reduce((acc, curr) => acc + curr.totalAmount, 0)), color: 'bg-slate-900 text-white border-slate-900' },
  ];

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 italic tracking-tighter uppercase">OPERATIONS HUB</h2>
          <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time status for Level Up Experts</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-6 md:p-8 rounded-3xl border shadow-xl flex flex-col gap-1 transition-all hover:scale-[1.02]`}>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80">{stat.label}</span>
            <span 
              className="text-lg md:text-2xl font-black tracking-tighter italic whitespace-nowrap overflow-hidden text-ellipsis"
              title={stat.value.toString()}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase italic tracking-tight">
            <span className="p-2 bg-brand-lime text-black rounded-lg scale-75"><ICONS.FileText /></span>
            Active Estimates
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                  <th className="pb-4 px-2">Project Client</th>
                  <th className="pb-4 px-2">Status</th>
                  <th className="pb-4 px-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {estimates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 italic text-sm font-medium">System idle. No recent quotes.</td>
                  </tr>
                ) : (
                  estimates.slice(0, 5).map((e) => (
                    <tr key={e.id} className="text-sm hover:bg-slate-50 transition-all cursor-pointer group">
                      <td className="py-6 px-2 font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        {clients.find(c => c.id === e.clientId)?.name || 'N/A'}
                      </td>
                      <td className="py-6 px-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          e.status === ProjectStatus.PAID ? 'bg-brand-lime text-black' : 
                          e.status === ProjectStatus.APPROVED ? 'bg-blue-600 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-6 px-2 text-right font-black text-slate-900 italic text-lg whitespace-nowrap">
                        {formatCurrency(e.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase italic tracking-tight">
            <span className="p-2 bg-brand-lime text-black rounded-lg scale-75"><ICONS.Users /></span>
            Workflow
          </h3>
          <div className="space-y-4">
            {estimates.filter(e => e.status === ProjectStatus.SCHEDULED || e.status === ProjectStatus.APPROVED).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center opacity-40">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-200 mb-4" />
                <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Pipeline Clear</p>
              </div>
            ) : (
              estimates.filter(e => e.status === ProjectStatus.SCHEDULED || e.status === ProjectStatus.APPROVED).map(e => {
                const client = clients.find(c => c.id === e.clientId);
                return (
                  <div key={e.id} className="p-5 border border-slate-100 bg-slate-50 rounded-3xl flex justify-between items-center group hover:border-brand-lime/50 transition-all">
                    <div>
                        <p className="text-base font-black text-slate-900">{client?.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate w-32">{client?.address.street}</p>
                    </div>
                    <div className={`text-right text-[9px] font-black uppercase px-3 py-1.5 rounded-xl italic ${e.status === ProjectStatus.APPROVED ? 'bg-blue-100 text-blue-700' : 'bg-brand-lime text-black'}`}>
                      {e.status === ProjectStatus.APPROVED ? 'APPROVED' : 'READY'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
