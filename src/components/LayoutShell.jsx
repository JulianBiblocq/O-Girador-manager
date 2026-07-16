import React from 'react';

export default function LayoutShell({ children }) {
  return (
    <div className="min-h-screen w-full bg-cordel-bg-dark flex items-center justify-center p-4">
      {/* Smartphone frame container */}
      <div className="w-full max-w-[412px] h-[88vh] max-h-[850px] min-h-[600px] border-8 border-cordel-master-dark rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative bg-cordel-bg-light text-cordel-bg-dark">
        
        {/* Mobile speaker & camera notch simulator */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-5 bg-cordel-master-dark rounded-b-xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-neutral-700 rounded-full mb-1"></div>
        </div>

        {/* Top Spacer for the notch */}
        <div className="h-6 w-full bg-cordel-master-dark shrink-0"></div>

        {/* Main Content Area (Scrollable internally) */}
        <div className="flex-1 overflow-y-auto cordel-bg p-6 flex flex-col gap-6">
          {children}
        </div>

        {/* Mobile home indicator bar simulator */}
        <div className="h-6 w-full bg-cordel-master-light flex items-center justify-center shrink-0 border-t border-cordel-master-dark/10">
          <div className="w-32 h-1 bg-cordel-master-dark/40 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
