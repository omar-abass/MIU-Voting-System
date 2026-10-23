
export function CampusArt({ className = 'campus-art' }) {
  const windows = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      windows.push(<rect key={`${row}-${col}`} x={118 + col * 24} y={150 + row * 34} width="12" height="20" rx="2" fill="#fff" opacity={0.2 + ((row + col) % 3) * 0.06} />);
    }
  }
  return (
    <svg className={className} viewBox="0 0 440 360" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="ca-roof" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* ground */}
      <ellipse cx="220" cy="318" rx="205" ry="22" fill="#000" opacity="0.28" />
      <rect x="20" y="296" width="400" height="14" rx="7" fill="#fff" opacity="0.18" />
      {/* side wings */}
      <rect x="40" y="190" width="92" height="106" rx="4" fill="url(#ca-wall)" />
      <rect x="308" y="190" width="92" height="106" rx="4" fill="url(#ca-wall)" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <g key={`w-${r}-${c}`}>
            <rect x={54 + c * 28} y={206 + r * 28} width="14" height="16" rx="2" fill="#fff" opacity="0.28" />
            <rect x={322 + c * 28} y={206 + r * 28} width="14" height="16" rx="2" fill="#fff" opacity="0.28" />
          </g>
        ))
      )}
      {/* central block */}
      <rect x="100" y="104" width="240" height="192" rx="6" fill="url(#ca-wall)" />
      <rect x="92" y="96" width="256" height="16" rx="6" fill="url(#ca-roof)" />
      {windows}
      {/* portico */}
      <path d="M170 296 V212 Q220 170 270 212 V296 Z" fill="#000" opacity="0.28" />
      <path d="M170 212 Q220 170 270 212" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" />
      {[178, 198, 242, 262].map((x) => (
        <rect key={x} x={x - 4} y="214" width="8" height="82" fill="#fff" opacity="0.55" />
      ))}
      <rect x="206" y="236" width="28" height="60" rx="14" fill="#fff" opacity="0.2" />
      {/* tower + flag */}
      <rect x="196" y="48" width="48" height="52" rx="4" fill="url(#ca-roof)" />
      <path d="M190 48 L220 20 L250 48 Z" fill="#fff" opacity="0.5" />
      <rect x="219" y="4" width="2.5" height="20" fill="#fff" opacity="0.8" />
      <path d="M221.5 5 L246 11 L221.5 18 Z" fill="#fff" opacity="0.9" />
      <circle cx="220" cy="72" r="9" fill="#000" opacity="0.28" />
      <circle cx="220" cy="72" r="6" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
      {/* palms */}
      {[26, 414].map((x) => (
        <g key={x}>
          <path d={`M${x} 296 Q${x + (x < 200 ? 4 : -4)} 250 ${x} 214`} stroke="#fff" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
          {[-52, -26, 0, 26, 52].map((a) => (
            <path key={a} d={`M${x} 214 Q${x + a * 0.7} ${196 - Math.abs(a) * 0.2} ${x + a} ${214 + Math.abs(a) * 0.4}`} stroke="#fff" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
          ))}
        </g>
      ))}
    </svg>
  );
}
