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
    <span className="font-display text-4xl text-ink-900 drop-shadow-[0_0_8px_rgba(197,160,89,1)] tabular-nums">
      {displayValue}
    </span>
  );
}
