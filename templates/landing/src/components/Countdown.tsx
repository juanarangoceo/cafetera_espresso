import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 15,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-950 border-b border-gold-500/20 py-3 px-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center shadow-inner gap-3 sm:gap-0">
      {/* Left: Status */}
      <div className="flex items-center gap-2 md:gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
        <span className="text-[10px] md:text-xs font-medium tracking-[0.15em] text-gold-100/90 uppercase leading-none">
          DISPONIBILIDAD LIMITADA: ÚLTIMAS 7 UNIDADES
        </span>
      </div>

      {/* Right: Timer */}
      <div className="flex gap-2 items-center">
        {[
          { label: 'hrs', value: timeLeft.hours },
          { label: 'min', value: timeLeft.minutes },
          { label: 'seg', value: timeLeft.seconds }
        ].map((item, idx) => (
          <div key={idx} className="text-center flex items-end gap-1">
            <span className="font-mono text-gold-400 font-bold text-lg leading-none">
              {item.value.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase text-coffee-400 mb-0.5 font-medium">
              {item.label}
            </span>
            {idx < 2 && <span className="text-coffee-600 text-sm leading-none mx-0.5">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;