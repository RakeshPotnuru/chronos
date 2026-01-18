export default function Ruler({ rulerAnimating }: { rulerAnimating: boolean }) {
  return (
    <div className="h-12 w-full relative overflow-hidden bg-linear-to-b from-ink-900 via-ink-800 to-transparent z-20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
      <div
        className={`absolute inset-0 flex transition-transform duration-2000 ease-[cubic-bezier(0.11, 0, 0.5, 0)] fill-mode-forwards ${rulerAnimating ? "animate-ruler-spin" : ""}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='48' viewBox='0 0 50 48' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='20' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='30' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='40' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='0' y='0' width='2' height='22' fill='%23c5a059'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "50px 48px",
          width: "200%",
        }}
      />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 z-30 pointer-events-none h-full flex flex-col items-center">
        <svg
          width="40"
          height="44"
          viewBox="0 0 40 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <path
            d="M20 42V4M20 42L12 30M20 42L28 30"
            stroke="#c5a059"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 28C10 28 14 32 20 32C26 32 30 28 30 28"
            stroke="#c5a059"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <path
            d="M20 12L17 18L20 24L23 18L20 12Z"
            fill="#c5a059"
            stroke="#1a1614"
            strokeWidth="0.5"
          />
          <circle
            cx="20"
            cy="4"
            r="3"
            fill="#c5a059"
            stroke="#1a1614"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
