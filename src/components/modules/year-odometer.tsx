import { useEffect, useState } from "react";

export default function YearOdometer({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = Math.floor(start + (end - start) * easeOutQuad(progress));
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(end);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="bg-ink-900/95 opacity-90 text-parchment-100 p-4 backdrop-blur-sm relative">
      <span className="font-display text-4xl drop-shadow-[0_0_8px_rgba(197,160,89,1)] tabular-nums">
        {displayValue}
      </span>
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-parchment-800"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-parchment-800"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-parchment-800"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-parchment-800"></div>
    </div>
  );
}
