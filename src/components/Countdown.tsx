import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 59,
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
    <div className="flex gap-2 justify-center py-2">
      {[
        { label: 'Hrs', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Seg', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="text-center">
          <div className="bg-coffee-50 border border-coffee-200 text-coffee-900 font-mono text-xl font-bold py-1.5 px-2 rounded-md shadow-sm min-w-[50px]">
            {item.value.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] uppercase tracking-wide text-coffee-400 mt-1 block font-bold">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;