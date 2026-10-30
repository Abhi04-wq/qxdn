import { memo } from 'react';

/**
 * AmbientBackground creates the sophisticated dark emerald atmosphere:
 * - Deep emerald and near-black background (#020B08)
 * - Soft radial emerald lighting (#064E3B)
 * - Very subtle floating mint & gold particles
 * - Soft flowing emerald light waves
 * - Optimized for performance and respects prefers-reduced-motion
 */
const AmbientBackground = memo(() => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Deep Base Radial Glows */}
      <div className="absolute -top-[25%] -left-[10%] h-[70vw] w-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-br from-[#064E3B]/25 via-[#022c22]/15 to-transparent blur-[120px]" />
      <div className="absolute top-[35%] -right-[15%] h-[60vw] w-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-[#064E3B]/20 via-[#0B2720]/10 to-transparent blur-[140px]" />
      <div className="absolute -bottom-[20%] left-[20%] h-[50vw] w-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-[#10352C]/20 via-[#020B08]/40 to-transparent blur-[130px]" />

      {/* 2. Very Subtle Gold Accent Ambient Light */}
      <div className="absolute top-[10%] right-[30%] h-[350px] w-[350px] rounded-full bg-[#D4AF37]/5 blur-[100px]" />

      {/* 3. Subtle Animated Floating Particles (CSS Keyframe driven, ultra lightweight) */}
      <div className="absolute inset-0 opacity-40">
        <span className="absolute top-[15%] left-[22%] h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse" style={{ animationDuration: '4s' }} />
        <span className="absolute top-[45%] left-[8%] h-1 w-1 rounded-full bg-[#A7F3D0] shadow-[0_0_6px_#A7F3D0] animate-ping" style={{ animationDuration: '6s' }} />
        <span className="absolute top-[28%] right-[18%] h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse" style={{ animationDuration: '5s' }} />
        <span className="absolute top-[65%] right-[25%] h-1 w-1 rounded-full bg-[#34D399] shadow-[0_0_6px_#34D399] animate-pulse" style={{ animationDuration: '7s' }} />
        <span className="absolute top-[80%] left-[35%] h-1.5 w-1.5 rounded-full bg-[#F5D98E] shadow-[0_0_8px_#F5D98E] animate-pulse" style={{ animationDuration: '4.5s' }} />
        <span className="absolute top-[52%] left-[60%] h-1 w-1 rounded-full bg-[#34D399] shadow-[0_0_6px_#34D399] animate-ping" style={{ animationDuration: '8s' }} />
        <span className="absolute top-[88%] right-[12%] h-1.5 w-1.5 rounded-full bg-[#A7F3D0] shadow-[0_0_8px_#A7F3D0] animate-pulse" style={{ animationDuration: '5.5s' }} />
      </div>

      {/* 4. Fine Subtle Cyber Grid Mesh Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#34D399 1px, transparent 1px), linear-gradient(90deg, #34D399 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
