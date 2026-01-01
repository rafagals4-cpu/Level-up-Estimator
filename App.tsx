
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ICONS } from './constants';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import CatalogPage from './pages/CatalogPage';
import EstimateBuilder from './pages/EstimateBuilder';
import EstimatesPage from './pages/EstimatesPage';
import SettingsPage from './pages/SettingsPage';
import { Client, Product, Estimate, ProductUnit, CompanyProfile } from './types';

const INITIAL_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    phone: '(555) 123-4567', 
    address: { street: '123 Maple Ave', city: 'Portland', state: 'OR', zipCode: '97201' }, 
    createdAt: new Date().toISOString() 
  },
  { 
    id: '2', 
    name: 'Sarah Johnson', 
    email: 's.johnson@example.com', 
    phone: '(555) 987-6543', 
    address: { street: '456 Oak Dr', city: 'Seattle', state: 'WA', zipCode: '98101' }, 
    createdAt: new Date().toISOString() 
  },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Oak Vinyl Plank', category: 'Flooring', unit: ProductUnit.SQFT, unitPrice: 4.50, description: 'Waterproof luxury vinyl plank.' },
  { id: 'p2', name: 'Modern 4" Baseboard', category: 'Baseboard', unit: ProductUnit.LF, unitPrice: 2.25, description: 'Primed white MDF baseboard.' },
  { id: 'p3', name: 'Installation Labor', category: 'Labor', unit: ProductUnit.SQFT, unitPrice: 3.00, description: 'Professional installation service.' },
  { id: 'p4', name: 'Premium Underlayment', category: 'Underlayment', unit: ProductUnit.SQFT, unitPrice: 0.85, description: 'Sound dampening underlayment.' },
];

const INITIAL_COMPANY: CompanyProfile = {
  name: 'Level Up Remodeling',
  address: '123 Enterprise Dr',
  city: 'Dartmouth',
  state: 'MA',
  zip: '02747',
  phone: '(555) 123-9999',
  email: 'contact@levelup.com',
  website: 'www.levelupremodeling.net',
  taxId: '36-4995827',
  terms: 'Due upon receipt',
  logoUrl: '', // Empty by default
  pdfTheme: 'light' // Default to Standard White
};

const Logo = ({ size = "md", invert = false }: { size?: "sm" | "md" | "lg", invert?: boolean }) => {
  const scale = size === "sm" ? 0.6 : size === "lg" ? 1.5 : 1;
  return (
    <div className="flex items-center gap-3" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M45 40L15 70V95H40V75L45 70V40Z" fill="#8CFF00" />
        <path d="M70 45L45 70V95H65V75L70 70V45Z" fill="#A0A0A0" />
        <path d="M45 40L65 15L85 35V70L70 70V45L45 40Z" fill="#8CFF00" />
      </svg>
      <div className="flex flex-col -gap-1">
        <span className={`${invert ? 'text-slate-900' : 'text-white'} font-black text-xl leading-none tracking-tighter uppercase italic`}>LEVEL UP</span>
        <span className="text-brand-lime font-bold text-sm leading-none tracking-tight uppercase">FLOORING EXPERTS</span>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon: Icon, label, mobile = false }: { to: string; icon: any; label: string, mobile?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/' || location.pathname === '/');
  
  if (mobile) {
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center gap-1 transition-all ${
          isActive ? 'text-brand-lime' : 'text-slate-500'
        }`}
      >
        <div className={`p-1 rounded-lg ${isActive ? 'bg-brand-lime/10' : ''}`}>
          <Icon />
        </div>
        <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive ? 'bg-brand-lime text-black shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon />
      <span className="font-bold tracking-tight uppercase text-sm">{label}</span>
    </Link>
  );
};

// Simplified Gear Icon for Settings
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);

  const addClient = (client: Client) => setClients([...clients, client]);
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  
  const addProduct = (product: Product) => setProducts([...products, product]);
  const addEstimate = (estimate: Estimate) => setEstimates([...estimates, estimate]);
  const updateEstimate = (updatedEstimate: Estimate) => {
    setEstimates(prev => prev.map(e => e.id === updatedEstimate.id ? updatedEstimate : e));
  };
  const updateCompany = (profile: CompanyProfile) => setCompanyProfile(profile);

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-[#121212] border-b border-white/5 px-6 py-4 sticky top-0 z-40 flex justify-between items-center shadow-lg">
          <Logo size="sm" />
          <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-brand-lime border border-white/10">
            <ICONS.Users />
          </div>
        </header>

        {/* Desktop Sidebar - Keeping it dark for brand contrast */}
        <aside className="hidden md:flex w-72 bg-[#121212] border-r border-white/5 p-8 flex-col gap-12 sticky top-0 h-screen overflow-y-auto">
          <div>
            <Logo />
            <p className="text-[9px] text-slate-500 mt-3 uppercase tracking-[0.3em] font-bold">RAISING THE STANDARD IN FLOORING</p>
          </div>

          <nav className="flex flex-col gap-3">
            <NavItem to="/" icon={ICONS.Home} label="Insights" />
            <NavItem to="/clients" icon={ICONS.Users} label="Client Hub" />
            <NavItem to="/catalog" icon={ICONS.Package} label="Inventory" />
            <NavItem to="/estimates" icon={ICONS.FileText} label="Estimates" />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-brand-lime uppercase mb-2 tracking-widest">Active Plan</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase italic tracking-tighter">ELITE PARTNER</span>
                <span className="h-2 w-2 rounded-full bg-brand-lime brand-shadow"></span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Now White/Light */}
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden pb-28 md:pb-10 bg-white">
          <Routes>
            <Route path="/" element={<Dashboard estimates={estimates} clients={clients} />} />
            <Route path="/clients" element={<ClientsPage clients={clients} onAdd={addClient} onDelete={deleteClient} />} />
            <Route path="/catalog" element={<CatalogPage products={products} onAdd={addProduct} />} />
            <Route 
              path="/estimates" 
              element={
                <EstimatesPage 
                  estimates={estimates} 
                  clients={clients} 
                  products={products} 
                  companyProfile={companyProfile}
                  onUpdate={updateEstimate} 
                />
              } 
            />
            <Route 
              path="/builder" 
              element={
                <EstimateBuilder 
                  clients={clients} 
                  products={products} 
                  onSave={addEstimate} 
                  onUpdate={updateEstimate}
                  companyProfile={companyProfile} 
                  estimates={estimates}
                />
              } 
            />
            <Route path="/settings" element={<SettingsPage profile={companyProfile} onUpdate={updateCompany} />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#121212]/90 backdrop-blur-xl border border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-3xl shadow-2xl">
          <NavItem to="/" icon={ICONS.Home} label="Home" mobile />
          <NavItem to="/clients" icon={ICONS.Users} label="CRM" mobile />
          <NavItem to="/estimates" icon={ICONS.FileText} label="Estimates" mobile />
          <NavItem to="/settings" icon={SettingsIcon} label="Config" mobile />
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
