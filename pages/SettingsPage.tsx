
import React, { useState, useRef } from 'react';
import { CompanyProfile } from '../types';
import { ICONS } from '../constants';

interface SettingsPageProps {
  profile: CompanyProfile;
  onUpdate: (profile: CompanyProfile) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const theme = formData.pdfTheme || 'light';
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header>
        <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Settings</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest mt-1">Manage your Business Identity</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Preview Card */}
        <div className="md:col-span-1">
          <div className={`p-8 rounded-3xl shadow-xl border sticky top-10 transition-colors duration-300 ${
            isDark 
              ? 'bg-[#121212] text-white border-slate-800' 
              : 'bg-white text-slate-900 border-slate-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Live Preview</h4>
              <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase ${
                isDark ? 'border-brand-lime text-brand-lime' : 'border-slate-300 text-slate-500'
              }`}>
                {theme} Mode
              </span>
            </div>
            
            {/* Logo Area */}
            <div className="mb-6 relative group">
                <div 
                  className={`h-24 w-24 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden cursor-pointer hover:border-brand-lime transition-colors ${
                    formData.logoUrl ? 'bg-white' : (isDark ? 'bg-white/5 border-white/20' : 'bg-slate-50 border-slate-300')
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                   {formData.logoUrl ? (
                     <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                   ) : (
                     <div className={`flex flex-col items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <span className="text-[9px] uppercase font-bold">Upload Logo</span>
                     </div>
                   )}
                </div>
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                />

                {formData.logoUrl && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
            </div>

            <h3 className={`text-xl font-black italic uppercase tracking-tight mb-1 break-words ${isDark ? 'text-brand-lime' : 'text-slate-900'}`}>{formData.name || 'Your Company'}</h3>
            <p className={`text-xs mb-4 break-all ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formData.website || 'www.yourwebsite.com'}</p>
            
            <div className={`space-y-3 border-t pt-4 text-xs ${isDark ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
               <p>{formData.address || '123 Business Rd'}</p>
               <p>{formData.city}, {formData.state} {formData.zip}</p>
               <p className={`pt-2 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.phone}</p>
               <p className="break-all">{formData.email}</p>
            </div>

            <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
               <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tax ID</p>
               <p className="font-mono text-xs">{formData.taxId || 'Not Set'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2 space-y-8">
           <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              
              {/* Theme Selection */}
              <div className="space-y-4">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Estimate Theme</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, pdfTheme: 'light'})}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        !isDark 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full border-2 border-slate-300 bg-white mb-2 flex items-center justify-center">
                         {!isDark && <div className="h-3 w-3 rounded-full bg-blue-600" />}
                      </div>
                      <span className="block font-black text-slate-900 uppercase text-xs mb-1">Standard (Light)</span>
                      <span className="block text-[10px] text-slate-500">Professional white background with black text. Ideal for printing.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, pdfTheme: 'dark'})}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isDark 
                        ? 'bg-[#121212] border-brand-lime ring-1 ring-brand-lime' 
                        : 'bg-slate-900 border-slate-900 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full border-2 border-slate-500 bg-slate-800 mb-2 flex items-center justify-center">
                         {isDark && <div className="h-3 w-3 rounded-full bg-brand-lime" />}
                      </div>
                      <span className={`block font-black uppercase text-xs mb-1 ${isDark ? 'text-white' : 'text-white'}`}>Brand (Dark)</span>
                      <span className="block text-[10px] text-slate-400">High-contrast dark mode with neon accents. Digital first.</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Company Details</h4>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email</label>
                        <input 
                          type="email" 
                          className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Phone</label>
                        <input 
                          type="tel" 
                          className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Website</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tax / Business ID</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                      value={formData.taxId}
                      onChange={e => setFormData({...formData, taxId: e.target.value})}
                    />
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Address</h4>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Street Address</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">City</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                          value={formData.city}
                          onChange={e => setFormData({...formData, city: e.target.value})}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">State</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                          value={formData.state}
                          onChange={e => setFormData({...formData, state: e.target.value})}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Zip</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-lime outline-none"
                          value={formData.zip}
                          onChange={e => setFormData({...formData, zip: e.target.value})}
                        />
                    </div>
                 </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 text-sm uppercase italic flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <span className="text-brand-lime">✓ Saved Successfully</span>
                    </>
                  ) : (
                    "Save Business Profile"
                  )}
                </button>
              </div>

           </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
