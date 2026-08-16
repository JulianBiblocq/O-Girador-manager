import React from 'react';

export default function PatternVisualizer({ patternArray, beatResolution = 4 }) {
  if (!Array.isArray(patternArray)) return null;
  
  // Formatage à la volée : les "0" ou 0 numériques deviennent des "-"
  const formattedPattern = patternArray.map(step => (step === 0 || step === '0' ? '-' : step));
  
  const steps = formattedPattern.length;
  const groups = [];
  let accumulated = 0;
  
  // Regroupement par temps (ex: par 4 doubles-croches)
  while (accumulated < steps) {
    groups.push(formattedPattern.slice(accumulated, accumulated + beatResolution));
    accumulated += beatResolution;
  }

  return (
    <div className="flex gap-2 justify-center items-center py-2 overflow-x-auto w-full">
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} className="flex gap-px bg-cordel-master-dark/10 p-1 rounded-sm border border-cordel-master-dark/20">
          {group.map((step, idx) => {
            const isActive = step !== '-';
            const displayVal = isActive ? step : '';
            return (
              <div 
                key={idx}
                className={`w-6 h-8 flex items-center justify-center text-[10px] font-bold rounded-[2px] transition-all ${
                  isActive 
                    ? 'bg-cordel-vert text-white border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.3)] scale-105 z-10' 
                    : 'bg-cordel-bg/50 border-cordel-master-dark/10 text-transparent opacity-60'
                }`}
                style={{
                  border: isActive ? 'none' : '1px solid rgba(127, 127, 127, 0.3)'
                }}
              >
                {displayVal}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
