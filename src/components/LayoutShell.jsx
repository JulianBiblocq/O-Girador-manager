import React from 'react';

export default function LayoutShell({ children }) {
  return (
    <div className="min-h-screen w-full bg-cordel-bg-dark flex sm:items-center sm:justify-center sm:p-4 md:p-6 lg:p-8">
      {/* Responsive board container: full screen on mobile, expanded card on tablet/desktop */}
      <div className="w-full h-screen sm:h-auto sm:min-h-[85vh] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl sm:border-8 sm:border-cordel-master-dark sm:rounded-[36px] sm:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative bg-cordel-bg-light text-cordel-bg-dark">
        
        {/* Main Content Area (Scrollable internally) */}
        <div className="flex-1 overflow-y-auto cordel-bg p-5 sm:p-6 md:p-8 flex flex-col gap-6">
          {children}
        </div>

      </div>
    </div>
  );
}
