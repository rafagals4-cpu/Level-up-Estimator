
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client, Product, Estimate, Room, LineItem, ProjectStatus, ProductUnit, CompanyProfile } from '../types';
import { calculateArea, calculatePerimeter, formatCurrency, ICONS } from '../constants';
import ARMeasurement from './ARMeasurement';

interface RoomItem {
  productId: string;
  quantity: number;
}

interface EstimateBuilderProps {
  clients: Client[];
  products: Product[];
  companyProfile: CompanyProfile;
  estimates?: Estimate[]; // Optional for editing lookup
  onSave: (estimate: Estimate) => void;
  onUpdate?: (estimate: Estimate) => void;
}

const ROOM_TEMPLATES = ['Living Room', 'Kitchen', 'Master Bed', 'Hallway', 'Bathroom', 'Dining'];

const EstimateBuilder: React.FC<EstimateBuilderProps> = ({ clients, products, companyProfile, estimates = [], onSave, onUpdate }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const [selectedClientId, setSelectedClientId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomItems, setRoomItems] = useState<{ [roomId: string]: RoomItem[] }>({});
  
  // Manual Entry State
  const [roomName, setRoomName] = useState('');
  const [width, setWidth] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [waste, setWaste] = useState(10);
  
  const [showAR, setShowAR] = useState(false);
  const [activeAddingRoomId, setActiveAddingRoomId] = useState<string | null>(null);

  // Ref for the popup container to detect clicks outside
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load Existing Estimate Data if Editing
  useEffect(() => {
    if (editId && estimates.length > 0) {
      const estimateToEdit = estimates.find(e => e.id === editId);
      if (estimateToEdit) {
        setSelectedClientId(estimateToEdit.clientId);
        setRooms(estimateToEdit.rooms);
        
        // Reconstruct roomItems from flat line items
        const loadedRoomItems: Record<string, RoomItem[]> = {};
        estimateToEdit.items.forEach(item => {
          if (!loadedRoomItems[item.roomId]) loadedRoomItems[item.roomId] = [];
          loadedRoomItems[item.roomId].push({
            productId: item.productId,
            quantity: item.quantity
          });
        });
        setRoomItems(loadedRoomItems);
      }
    }
  }, [editId, estimates]);

  // Click Outside Effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveAddingRoomId(null);
      }
    };

    if (activeAddingRoomId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeAddingRoomId]);

  const addRoom = (customArea?: number, customPerimeter?: number, nameOverride?: string) => {
    const defaultName = customArea 
      ? `AR Scan ${rooms.length + 1}` 
      : `Zone ${rooms.length + 1}`;
    
    // Use override if provided (from template), otherwise input state, otherwise default
    const finalRoomName = nameOverride || roomName || defaultName;

    let effectiveWidth = 0;
    let effectiveLength = 0;

    // Smart Dimension Logic
    if (customArea && customPerimeter) {
       const semiPerimeter = customPerimeter / 2;
       const discriminant = Math.pow(semiPerimeter, 2) - 4 * customArea;
       if (discriminant >= 0) {
         const w1 = (semiPerimeter + Math.sqrt(discriminant)) / 2;
         const w2 = (semiPerimeter - Math.sqrt(discriminant)) / 2;
         effectiveLength = Math.max(w1, w2);
         effectiveWidth = Math.min(w1, w2);
       } else {
         effectiveWidth = Math.sqrt(customArea);
         effectiveLength = Math.sqrt(customArea);
       }
    } else if (customArea) {
      effectiveWidth = Math.sqrt(customArea);
      effectiveLength = Math.sqrt(customArea);
    } else {
      // Manual Entry
      effectiveWidth = parseFloat(width) || 0;
      effectiveLength = parseFloat(length) || 0;
    }

    if (effectiveWidth === 0 || effectiveLength === 0) {
      alert("Please enter valid dimensions.");
      return;
    }

    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalRoomName,
      width: parseFloat(effectiveWidth.toFixed(2)),
      length: parseFloat(effectiveLength.toFixed(2)),
      wastePercentage: waste
    };

    setRooms(prev => [...prev, newRoom]);
    
    // Reset inputs
    setRoomName('');
    setWidth('');
    setLength('');
  };

  const handleARComplete = (area: number, perimeter: number) => {
    addRoom(area, perimeter);
    setShowAR(false);
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
    const newItems = { ...roomItems };
    delete newItems[id];
    setRoomItems(newItems);
  };

  const getCalculatedQuantity = (room: Room, product: Product) => {
    const baseArea = calculateArea(room.width, room.length);
    const basePerimeter = calculatePerimeter(room.width, room.length);

    if (product.category === 'Flooring' || product.category === 'Labor' || product.category === 'Underlayment') {
      return baseArea * (1 + room.wastePercentage / 100);
    } else if (product.category === 'Baseboard') {
      return basePerimeter * (1 + 0.05); 
    }
    return 1;
  };

  const toggleProductInRoom = (roomId: string, productId: string) => {
    const current = roomItems[roomId] || [];
    const room = rooms.find(r => r.id === roomId);
    const product = products.find(p => p.id === productId);
    
    if (!room || !product) return;

    if (current.some(item => item.productId === productId)) {
      setRoomItems({ 
        ...roomItems, 
        [roomId]: current.filter(item => item.productId !== productId) 
      });
    } else {
      const initialQty = getCalculatedQuantity(room, product);
      setRoomItems({ 
        ...roomItems, 
        [roomId]: [...current, { productId, quantity: initialQty }] 
      });
    }
  };

  const updateItemQuantity = (roomId: string, productId: string, newQty: number) => {
    const current = roomItems[roomId] || [];
    setRoomItems({
      ...roomItems,
      [roomId]: current.map(item => 
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    });
  };

  const lineItems = useMemo(() => {
    const items: LineItem[] = [];
    rooms.forEach(room => {
      const selectedRoomItems = roomItems[room.id] || [];
      selectedRoomItems.forEach(ri => {
        const product = products.find(p => p.id === ri.productId);
        if (!product) return;

        items.push({
          id: Math.random().toString(36).substr(2, 9),
          roomId: room.id,
          productId: ri.productId,
          quantity: ri.quantity,
          unitPriceAtTime: product.unitPrice,
          subtotal: ri.quantity * product.unitPrice
        });
      });
    });
    return items;
  }, [rooms, roomItems, products]);

  const total = useMemo(() => lineItems.reduce((acc, curr) => acc + curr.subtotal, 0), [lineItems]);

  const handleSave = () => {
    if (!selectedClientId) {
      alert("Please select a Customer for this quote.");
      return;
    }
    if (rooms.length === 0) {
      alert("Please add at least one Zone/Room to the estimate.");
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    // Check if updating or creating
    const isEditing = !!editId;
    
    const estimate: Estimate = {
      id: isEditing ? editId : `EST-${Date.now().toString().substr(-6)}`, 
      clientId: selectedClientId,
      status: ProjectStatus.NEW,
      rooms,
      items: lineItems,
      totalAmount: total,
      createdAt: isEditing 
        ? (estimates.find(e => e.id === editId)?.createdAt || new Date().toISOString()) 
        : new Date().toISOString()
    };

    if (isEditing && onUpdate) {
      onUpdate(estimate);
    } else {
      onSave(estimate);
    }
    
    navigate('/estimates');
  };

  // Group products for the picker
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  const isValid = selectedClientId && rooms.length > 0;

  if (showAR) {
    return <ARMeasurement onComplete={handleARComplete} onCancel={() => setShowAR(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-40 animate-in fade-in duration-500">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-4 md:-mx-10 px-6 py-4 mb-6 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-all">
        <h2 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">
          {editId ? 'EDIT QUOTE' : 'NEW QUOTE'}
        </h2>
        <div className="flex gap-3">
          <button onClick={() => window.history.back()} className="px-3 py-2 text-xs font-bold text-slate-500 uppercase hover:text-slate-800">Cancel</button>
          <button 
            onClick={handleSave}
            className={`px-5 py-2 text-xs font-black rounded-full uppercase italic shadow-lg transition-all hover:scale-105 active:scale-95 ${
              isValid ? 'bg-brand-lime text-black' : 'bg-slate-200 text-slate-400'
            }`}
          >
            {editId ? 'Update & Finish' : 'Save & Finish'}
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4 md:px-0">
        
        {/* Client Selector (Cleaner) */}
        <div className={`bg-white rounded-3xl border p-1 shadow-sm transition-colors ${!selectedClientId ? 'border-brand-lime/50 ring-4 ring-brand-lime/10' : 'border-slate-200'}`}>
          <select
            className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-brand-lime outline-none text-sm cursor-pointer appearance-none"
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{ backgroundImage: 'none' }} 
          >
            <option value="">Select Customer...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.address.street}</option>)}
          </select>
          {/* Custom Arrow */}
          <div className="pointer-events-none absolute right-8 top-8 opacity-40">
             <ICONS.Users />
          </div>
        </div>

        {/* Empty State Guide */}
        {rooms.length === 0 && (
          <div className="py-8 text-center space-y-6 animate-in slide-in-from-bottom-4">
             <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="h-16 w-16 bg-white rounded-full mx-auto flex items-center justify-center text-brand-lime shadow-sm mb-4">
                  <ICONS.Plus />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic mb-2">Start Your Estimate</h3>
                <p className="text-xs text-slate-500 font-medium mb-6 max-w-xs mx-auto">Add your first zone to begin calculating materials and costs.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                   <button 
                     onClick={() => setShowAR(true)}
                     className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all"
                   >
                     <ICONS.Camera />
                     AR Measure
                   </button>
                   <button 
                     onClick={() => (document.getElementById('manual-entry') as HTMLInputElement)?.focus()}
                     className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs hover:bg-slate-50 transition-all"
                   >
                     Manual Entry
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Room List */}
        <div className="space-y-6">
          {rooms.map((room, index) => (
            <div key={room.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
              
              {/* Room Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{index + 1}</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase italic">{room.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {room.width}' x {room.length}' • {calculateArea(room.width, room.length).toFixed(1)} sqft
                    </p>
                  </div>
                </div>
                <button onClick={() => removeRoom(room.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                  <ICONS.Trash />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-50">
                {(roomItems[room.id] || []).map(ri => {
                  const product = products.find(p => p.id === ri.productId);
                  if (!product) return null;
                  return (
                    <div key={ri.productId} className="px-6 py-4 flex items-center gap-4 group hover:bg-slate-50 transition-colors">
                      {/* Product Icon/Indicator */}
                      <div className={`w-1 h-8 rounded-full ${
                        product.category === 'Flooring' ? 'bg-amber-400' :
                        product.category === 'Labor' ? 'bg-blue-400' : 'bg-brand-lime'
                      }`} />
                      
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 uppercase mb-1">{product.name}</p>
                        <div className="flex items-center gap-2">
                           <input 
                             type="number"
                             className="w-16 bg-slate-100 border-0 rounded px-2 py-1 text-[10px] font-black focus:ring-1 focus:ring-brand-lime text-center"
                             value={ri.quantity}
                             onChange={(e) => updateItemQuantity(room.id, ri.productId, parseFloat(e.target.value) || 0)}
                           />
                           <span className="text-[9px] font-bold text-slate-400 uppercase">{product.unit} @ {formatCurrency(product.unitPrice)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{formatCurrency(ri.quantity * product.unitPrice)}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Better "Add Item" UI */}
                <div className="p-4 bg-slate-50/30">
                  {activeAddingRoomId === room.id ? (
                    <div ref={popoverRef} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Item</span>
                        {/* Close button removed as requested - click outside handles close */}
                      </div>
                      
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                        {Object.entries(productsByCategory).map(([category, items]) => (
                          <div key={category}>
                            <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">{category}</h5>
                            <div className="grid grid-cols-1 gap-2">
                              {items.map(p => {
                                const isSelected = (roomItems[room.id] || []).some(item => item.productId === p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => toggleProductInRoom(room.id, p.id)}
                                    className={`flex justify-between items-center p-3 rounded-xl border text-left transition-all ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white'
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-brand-lime'
                                    }`}
                                  >
                                    <span className="text-[10px] font-bold uppercase truncate">{p.name}</span>
                                    <span className={`text-[9px] font-bold ${isSelected ? 'text-brand-lime' : 'text-slate-400'}`}>
                                      {formatCurrency(p.unitPrice)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveAddingRoomId(room.id)}
                      className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-600 uppercase hover:bg-blue-50 hover:border-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                      <ICONS.Plus /> Add Material / Service
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Streamlined Manual Entry Bar (Always Visible but compact) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-lime"></div>
                <h4 className="text-xs font-black text-slate-900 uppercase italic">Add New Zone</h4>
             </div>
             {/* Small AR Button for quick access */}
             <button 
               onClick={() => setShowAR(true)}
               className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-all flex items-center gap-2"
               title="Use AR Camera"
             >
                <ICONS.Camera />
                <span className="text-[10px] font-bold uppercase hidden sm:inline">AR Scan</span>
             </button>
           </div>
           
           {/* Quick Tags */}
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {ROOM_TEMPLATES.map(tag => (
                <button
                  key={tag}
                  onClick={() => setRoomName(tag)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
                    roomName === tag ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
           </div>

           <div className="flex flex-col sm:flex-row gap-3">
              <input 
                id="manual-entry"
                type="text" 
                placeholder="Zone Name (e.g. Master)" 
                className="flex-[2] bg-slate-50 border-0 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-lime"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
              />
              <div className="flex gap-2 flex-[2]">
                <input 
                  type="number" 
                  placeholder="W (ft)" 
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-lime"
                  value={width}
                  onChange={e => setWidth(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="L (ft)" 
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-lime"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                />
              </div>
              <button 
                disabled={!width || !length}
                onClick={() => addRoom()}
                className="flex-1 bg-brand-lime text-black px-4 py-3 rounded-xl text-xs font-black uppercase italic disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-95"
              >
                Add
              </button>
           </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50">
        <div className="bg-slate-900 text-white px-8 py-4 rounded-full flex justify-between items-center shadow-2xl border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className="hidden md:flex h-8 w-8 bg-brand-lime rounded-full items-center justify-center text-black">
                <ICONS.FileText />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                 <p className="text-lg font-black italic tracking-tighter text-brand-lime">{formatCurrency(total)}</p>
              </div>
           </div>
           
           <button 
              onClick={handleSave}
              className={`px-8 py-3 rounded-full text-xs font-black uppercase italic transition-all ${
                isValid 
                ? 'bg-brand-lime text-black shadow-[0_0_30px_rgba(140,255,0,0.3)] hover:scale-105 active:scale-95' 
                : 'bg-slate-700 text-slate-400'
              }`}
           >
             {editId ? 'Update & Finish' : 'Save & Finish'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default EstimateBuilder;
