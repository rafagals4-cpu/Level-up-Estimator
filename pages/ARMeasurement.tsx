
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ICONS } from '../constants';

interface Point {
  x: number;
  y: number;
}

interface ARMeasurementProps {
  onComplete: (area: number, perimeter: number) => void;
  onCancel: () => void;
}

const ARMeasurement: React.FC<ARMeasurementProps> = ({ onComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Measurement State
  const [points, setPoints] = useState<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  
  // Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [pixelsPerFoot, setPixelsPerFoot] = useState(35); 
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationDistanceInput, setCalibrationDistanceInput] = useState('3');
  
  // Auto-Scan State (Defaulting to TRUE as requested)
  const [isAutoScan, setIsAutoScan] = useState(true);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const lastMotionRef = useRef<number>(Date.now());
  const scanCooldownRef = useRef<boolean>(false);
  
  // Explicitly typing as number to avoid NodeJS.Timeout conflict
  const progressIntervalRef = useRef<number | null>(null);

  // Viewport Size tracking
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setViewport({ w: width, h: height });
        setCursorPos({ x: width / 2, y: height / 2 });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();

    async function setupCamera() {
      try {
        // Attempt to request depth stream if browser supports it (LiDAR/Depth Camera preference)
        const constraints: MediaStreamConstraints = { 
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            // @ts-ignore - 'advanced' is valid but TS definition might lag in some setups
            advanced: [{ depth: true }] 
          },
          audio: false 
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or capabilities missing:", err);
        // Fallback to basic constraints if advanced fails
        try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = basicStream;
        } catch (fallbackErr) {
            alert("Camera permission is required for AR Spatial Measurement.");
            onCancel();
        }
      }
    }
    setupCamera();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [onCancel]);

  // --- Auto-Scan Logic (Motion Detection & iOS Permission) ---
  useEffect(() => {
    // If we shouldn't scan, reset and do nothing
    if (!isAutoScan || isCalibrating || isClosed) {
        setScanProgress(0);
        return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.acceleration;
        if (!acc) return;
        
        // Calculate magnitude of movement
        // We use a slightly looser threshold to account for natural hand shake
        const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
        
        // If moving too fast (magnitude > 0.8), reset progress (user is panning)
        if (magnitude > 0.8) { 
            lastMotionRef.current = Date.now();
            setScanProgress(0);
        }
    };

    // Fallback for Desktop (Mouse movement resets scan to prevent accidental clicks)
    const handleMouseMove = () => {
        lastMotionRef.current = Date.now();
        setScanProgress(0);
    };

    // IOS Permission Handling for Sensors (iOS 13+)
    const requestMotionPermission = async () => {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceMotionEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                }
            } catch (e) {
                console.warn("Motion permission error", e);
            }
        } else {
            // Non-iOS 13+ devices
            window.addEventListener('devicemotion', handleMotion);
        }
    };

    // Check if we need to request permission or just add listener
    if (typeof (DeviceMotionEvent as any).requestPermission !== 'function') {
        window.addEventListener('devicemotion', handleMotion);
    } else {
        // Note: Actual permission request must be triggered by user interaction.
        // We attach logic here, but the listener might not fire until user interacts.
        // For this prototype, we assume user might have granted or we fall back gracefully.
        window.addEventListener('devicemotion', handleMotion);
    }
    
    window.addEventListener('mousemove', handleMouseMove);

    // Progress Loop - Runs every 50ms to check stability time
    progressIntervalRef.current = window.setInterval(() => {
        if (scanCooldownRef.current) return;

        const timeSinceMotion = Date.now() - lastMotionRef.current;
        
        // If stable for more than 400ms (increased slightly for better UX), start filling ring
        if (timeSinceMotion > 400) {
            setScanProgress(prev => {
                const next = prev + 8; // Fill speed
                if (next >= 100) {
                    // Trigger Capture
                    handleCapturePoint();
                    scanCooldownRef.current = true;
                    // Haptic Feedback if available
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                    
                    // Reset after short delay
                    setTimeout(() => {
                        scanCooldownRef.current = false;
                        setScanProgress(0);
                        lastMotionRef.current = Date.now(); // Reset stability timer
                    }, 1500); // 1.5s cooldown before next auto-capture
                    return 100;
                }
                return next;
            });
        }
    }, 50);

    return () => {
        window.removeEventListener('devicemotion', handleMotion);
        window.removeEventListener('mousemove', handleMouseMove);
        if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };
  }, [isAutoScan, isCalibrating, isClosed, points, viewport]); // Dependencies crucial for closure

  const calculatePixelDistance = (p1: Point, p2: Point) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculateFeet = (pixelDist: number) => {
    return pixelDist / pixelsPerFoot;
  };

  // Main Action: Capture Point at Reticle Center
  const handleCapturePoint = () => {
    // Determine the target point (Center of Viewport)
    let target = { x: 0, y: 0 };
    if (containerRef.current) {
         const { width, height } = containerRef.current.getBoundingClientRect();
         target = { x: width / 2, y: height / 2 };
    } else {
         return;
    }

    // Calibration Logic
    if (isCalibrating) {
       setCalibrationPoints(prev => {
           const newPts = [...prev, target];
           if (newPts.length === 2) setShowCalibrationModal(true);
           return newPts;
       });
       return;
    }

    if (isClosed) return;

    // Measurement Logic
    setPoints(prev => {
        // Auto-Close Logic: If we are close to the start point, close the polygon
        if (prev.length >= 3) {
            const firstPoint = prev[0];
            const distToStart = Math.sqrt(Math.pow(target.x - firstPoint.x, 2) + Math.pow(target.y - firstPoint.y, 2));
            if (distToStart < 30) {
                setIsClosed(true);
                return prev; 
            }
        }
        return [...prev, target];
    });
    
    // Additional check to update isClosed state immediately if needed for UI reaction
    if (points.length >= 3) {
         const dist = calculatePixelDistance(target, points[0]);
         if (dist < 30) {
             setIsClosed(true);
         }
    }
  };

  const handleFinishCalibration = () => {
    const distPx = calculatePixelDistance(calibrationPoints[0], calibrationPoints[1]);
    const distFt = parseFloat(calibrationDistanceInput);
    if (distFt > 0 && distPx > 0) {
        setPixelsPerFoot(distPx / distFt);
        setIsCalibrating(false);
        setCalibrationPoints([]);
        setShowCalibrationModal(false);
        setPoints([]); 
        setIsClosed(false);
    }
  };

  const handleUndo = () => {
    if (isClosed) {
        setIsClosed(false);
    } else {
        setPoints(prev => prev.slice(0, -1));
    }
  };

  const stats = useMemo(() => {
    if (points.length < 2) return { area: 0, perimeter: 0 };

    let perimeterPx = 0;
    const loopLimit = isClosed ? points.length : points.length - 1;
    for (let i = 0; i < loopLimit; i++) {
      perimeterPx += calculatePixelDistance(points[i], points[(i + 1) % points.length]);
    }
    // Add current live line if not closed
    if (!isClosed && points.length > 0) {
        perimeterPx += calculatePixelDistance(points[points.length -1], { x: viewport.w/2, y: viewport.h/2 });
    }

    // Shoelace Area
    let areaPx = 0;
    const polygonPoints = isClosed ? points : [...points, { x: viewport.w/2, y: viewport.h/2 }];
    
    if (polygonPoints.length >= 3) {
      for (let i = 0; i < polygonPoints.length; i++) {
        let j = (i + 1) % polygonPoints.length;
        areaPx += polygonPoints[i].x * polygonPoints[j].y;
        areaPx -= polygonPoints[j].x * polygonPoints[i].y;
      }
      areaPx = Math.abs(areaPx) / 2;
    }

    const areaFt = areaPx / (pixelsPerFoot * pixelsPerFoot);
    const perimeterFt = perimeterPx / pixelsPerFoot;

    return { area: areaFt, perimeter: perimeterFt };
  }, [points, isClosed, pixelsPerFoot, viewport]);

  const currentSegmentLength = useMemo(() => {
      if (points.length === 0 || isClosed) return 0;
      const lastPoint = points[points.length - 1];
      const center = { x: viewport.w / 2, y: viewport.h / 2 };
      return calculateFeet(calculatePixelDistance(lastPoint, center));
  }, [points, isClosed, viewport, pixelsPerFoot]);

  // MiniMap Component
  const renderMiniMap = () => {
    let mappedCursor: Point | null = null;
    if (cursorPos && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mappedCursor = {
            x: cursorPos.x - rect.left,
            y: cursorPos.y - rect.top
        };
    }
    const previewPoints = [...points];
    if (!isClosed && !isCalibrating && mappedCursor && points.length > 0) {
        previewPoints.push(mappedCursor);
    }
    if (previewPoints.length < 1) return null;
    const xs = previewPoints.map(p => p.x);
    const ys = previewPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const maxDim = Math.max(width, height);
    const availableSize = 70; // 100 - padding
    const scale = availableSize / maxDim;
    const offsetX = (100 - (width * scale)) / 2;
    const offsetY = (100 - (height * scale)) / 2;
    const mapPoint = (p: Point) => ({
      x: ((p.x - minX) * scale) + offsetX,
      y: ((p.y - minY) * scale) + offsetY
    });
    const mapped = previewPoints.map(mapPoint);
    const pathD = `M ${mapped.map(p => `${p.x},${p.y}`).join(' L ')} ${isClosed ? 'Z' : ''}`;

    return (
      <div className="absolute bottom-28 right-6 w-32 h-32 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-2 z-50 pointer-events-none overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="text-[8px] text-slate-400 font-bold uppercase mb-1 text-center tracking-widest">Floor Plan</div>
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
           <path d={pathD} fill={isClosed ? "rgba(140, 255, 0, 0.2)" : "none"} stroke="#8CFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
           {mapped.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" />))}
        </svg>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden select-none touch-none">
      
      {/* 1. Camera Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />

      {/* Auto-Scan Laser Effect - Always Visible now since default is true */}
      {isAutoScan && !isClosed && !isCalibrating && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-30">
              <div className="absolute left-0 right-0 h-1 bg-brand-lime shadow-[0_0_20px_rgba(140,255,0,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
              <style>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
              `}</style>
          </div>
      )}

      {/* 2. SVG Graphics Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
         {/* Draw Completed Segments */}
         {points.map((p, i) => {
            const next = points[i + 1];
            if (!next) return null;
            const midX = (p.x + next.x) / 2;
            const midY = (p.y + next.y) / 2;
            const dist = calculateFeet(calculatePixelDistance(p, next));
            return (
                <g key={i}>
                    <line x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.5))" }}/>
                     <g transform={`translate(${midX}, ${midY})`}>
                        <rect x="-24" y="-12" width="48" height="24" rx="6" fill="rgba(0,0,0,0.7)" />
                        <text x="0" y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{dist.toFixed(1)}'</text>
                     </g>
                    <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="black" strokeWidth="1" />
                </g>
            );
         })}

         {/* Draw Active Elastic Line */}
         {!isClosed && !isCalibrating && points.length > 0 && (
            <g>
                <line x1={points[points.length-1].x} y1={points[points.length-1].y} x2={viewport.w / 2} y2={viewport.h / 2} stroke={isAutoScan ? "#8CFF00" : "white"} strokeWidth="2" strokeDasharray="8,4" opacity="0.8"/>
                 <g transform={`translate(${viewport.w/2}, ${viewport.h/2 - 60})`}>
                    <rect x="-30" y="-15" width="60" height="30" rx="8" fill={isAutoScan ? "#8CFF00" : "white"} />
                    <text x="0" y="5" textAnchor="middle" fill="black" fontSize="12" fontWeight="900">{currentSegmentLength.toFixed(1)}'</text>
                 </g>
            </g>
         )}

         {/* Closing Loop Line Preview */}
         {!isClosed && points.length >= 3 && calculatePixelDistance(points[0], {x: viewport.w/2, y: viewport.h/2}) < 30 && (
             <line x1={points[points.length-1].x} y1={points[points.length-1].y} x2={points[0].x} y2={points[0].y} stroke="#8CFF00" strokeWidth="4" />
         )}
      </svg>

      {/* 3. Central Reticle (Crosshair) & Auto-Scan Progress */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
         <div className={`relative flex items-center justify-center transition-all duration-300 ${isCalibrating ? 'scale-125' : 'scale-100'}`}>
            
            {/* Auto-Scan Progress Ring */}
            {isAutoScan && !isClosed && !isCalibrating && (
                <svg className="absolute w-24 h-24 -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <circle 
                        cx="48" cy="48" r="40" fill="none" stroke="#8CFF00" strokeWidth="4" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * scanProgress) / 100} 
                        strokeLinecap="round"
                        className="transition-all duration-100 ease-linear"
                    />
                </svg>
            )}

            {/* Core Reticle */}
            <div className={`h-16 w-16 rounded-full border-2 ${
                isCalibrating ? 'border-amber-400' : isAutoScan ? (scanProgress > 0 ? 'border-brand-lime bg-brand-lime/10' : 'border-white') : 'border-white'
            } opacity-80 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all`} />
            
            <div className={`absolute w-1 h-4 ${isCalibrating ? 'bg-amber-400' : isAutoScan ? 'bg-brand-lime' : 'bg-white'}`} />
            <div className={`absolute w-4 h-1 ${isCalibrating ? 'bg-amber-400' : isAutoScan ? 'bg-brand-lime' : 'bg-white'}`} />
            <div className="absolute w-1 h-1 bg-black rounded-full" />
            
            {isAutoScan && scanProgress > 10 && (
                <div className="absolute top-10 text-[9px] font-black text-brand-lime uppercase tracking-widest bg-black/50 px-2 rounded">
                    Detecting
                </div>
            )}
         </div>
      </div>

      {/* 4. HUD & Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30">
         {/* Status Chip */}
         <div className="bg-slate-900/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
             <div className="flex items-center gap-3">
                 <div className={`h-2 w-2 rounded-full ${isCalibrating ? 'bg-amber-500 animate-pulse' : 'bg-brand-lime'} shadow-[0_0_8px_rgba(140,255,0,0.6)]`} />
                 <div>
                    <h3 className="text-white font-black text-xs uppercase tracking-widest italic leading-none mb-1">
                        {isCalibrating ? 'Calibration Mode' : isAutoScan ? 'LiDAR / Auto-Scan' : 'Manual Mode'}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        {isCalibrating 
                            ? 'Set Reference Height' 
                            : points.length === 0 
                                ? 'Aim at 1st Corner' 
                                : `Corner ${points.length + 1}`
                        }
                    </p>
                 </div>
             </div>
         </div>

         <button onClick={onCancel} className="h-10 w-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>
      </div>

      {renderMiniMap()}

      {/* Bottom Action Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-10 px-6 flex flex-col items-center z-30">
         
         {/* Toggle (Optional - kept for fallback) */}
         {!isClosed && (
            <button 
                onClick={() => setIsAutoScan(!isAutoScan)}
                className={`mb-6 px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${
                    isAutoScan 
                    ? 'bg-brand-lime/20 border-brand-lime text-brand-lime' 
                    : 'bg-white/10 border-white/10 text-slate-400 hover:bg-white/20'
                }`}
            >
                <div className={`w-3 h-3 rounded-full ${isAutoScan ? 'bg-brand-lime animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {isAutoScan ? 'Auto-Detect ON' : 'Manual Tap Mode'}
                </span>
            </button>
         )}

         {/* Instructions */}
         {!isClosed && (
            <div className="mb-6 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <p className="text-white text-[10px] font-bold uppercase tracking-widest text-center">
                    {isCalibrating 
                        ? "Aim at bottom, Tap. Move to top, Tap." 
                        : isAutoScan 
                            ? "Hold steady on corner to auto-capture"
                            : "Center Reticle on Corner • Tap Button"
                    }
                </p>
            </div>
         )}

         {/* Main Controls Row */}
         <div className="flex items-center justify-center gap-8 w-full max-w-md">
            
            {/* Undo / Calibration */}
            <div className="flex-1 flex justify-end">
                {points.length > 0 ? (
                    <button onClick={handleUndo} className="flex flex-col items-center gap-1 text-white hover:text-brand-lime transition-colors">
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Undo</span>
                    </button>
                ) : (
                    <button onClick={() => setIsCalibrating(!isCalibrating)} className={`flex flex-col items-center gap-1 ${isCalibrating ? 'text-amber-400' : 'text-slate-400 hover:text-white'} transition-colors`}>
                         <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-widest">Scale</span>
                    </button>
                )}
            </div>

            {/* Capture Button */}
            <div className="relative">
                {!isClosed ? (
                    <button 
                        onClick={handleCapturePoint}
                        className={`h-24 w-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
                            isCalibrating 
                            ? 'border-amber-400 bg-amber-400/20' 
                            : isAutoScan
                                ? 'border-brand-lime bg-brand-lime/10'
                                : 'border-white bg-white/20 hover:bg-white/30'
                        }`}
                    >
                        <div className={`h-16 w-16 rounded-full transition-all ${
                            isCalibrating ? 'bg-amber-400' : isAutoScan ? 'bg-brand-lime scale-50' : 'bg-white'
                        }`} />
                    </button>
                ) : (
                    <button 
                        onClick={() => onComplete(parseFloat(stats.area.toFixed(2)), parseFloat(stats.perimeter.toFixed(2)))}
                        className="h-24 w-24 rounded-full bg-brand-lime border-4 border-brand-lime flex flex-col items-center justify-center shadow-[0_0_30px_rgba(140,255,0,0.5)] animate-in zoom-in"
                    >
                        <ICONS.Maximize />
                        <span className="text-[10px] font-black uppercase text-black mt-1">Done</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="flex-1 flex justify-start pl-2">
                {isClosed && (
                    <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Area</p>
                        <p className="text-xl font-black text-brand-lime leading-none">{stats.area.toFixed(1)} <span className="text-xs font-normal">sqft</span></p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Calibration</div>
                <h3 className="text-white font-black text-2xl uppercase italic mb-2 text-center">Reference Check</h3>
                <p className="text-slate-400 text-xs font-medium text-center mb-6 leading-relaxed">How far apart are the two points you just tapped in the real world?</p>
                <div className="flex gap-3 items-center mb-8 bg-black/30 p-2 rounded-2xl border border-white/10">
                    <button className="h-10 w-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-700" onClick={() => setCalibrationDistanceInput((parseFloat(calibrationDistanceInput) - 0.5).toString())}>-</button>
                    <div className="flex-1 text-center">
                        <input type="number" value={calibrationDistanceInput} onChange={(e) => setCalibrationDistanceInput(e.target.value)} className="bg-transparent text-white text-center font-black text-3xl outline-none w-full" autoFocus />
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block -mt-1">Feet</span>
                    </div>
                     <button className="h-10 w-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-700" onClick={() => setCalibrationDistanceInput((parseFloat(calibrationDistanceInput) + 0.5).toString())}>+</button>
                </div>
                <button onClick={handleFinishCalibration} className="w-full bg-brand-lime text-black font-black py-4 rounded-xl uppercase tracking-wider text-sm hover:scale-[1.02] transition-transform shadow-xl">Apply Scale & Scan</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ARMeasurement;
