import { memo } from 'react';

/**
 * AmbientBackground creates the sophisticated glowing cyber grid atmosphere:
 * - Deep emerald and near-black background (#020B08)
 * - Deep glowing cyberpunk grid with neon intersection matrix (exact match with Landing Page)
 * - Glowing radial light ellipses (top emerald & bottom gold)
 * - Deep ambient emerald glow blurs
 * - NO floating particles (as explicitly requested: "particles add korte hbe na")
 * - Supports isAbsolute for rendering inside floating inset containers
 */
const AmbientBackground = memo(({ isAbsolute = false }) => {
  const pos = isAbsolute ? 'absolute' : 'fixed';

  return (
    <div className={`pointer-events-none ${pos} inset-0 z-0 overflow-hidden`} aria-hidden="true">
      {/* 1. Deep Base Ambient Glow Blurs */}
      <div className="absolute -top-[25%] -left-[10%] h-[70vw] w-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-br from-[#064E3B]/25 via-[#022c22]/15 to-transparent blur-[120px]" />
      <div className="absolute top-[35%] -right-[15%] h-[60vw] w-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-[#064E3B]/20 via-[#0B2720]/10 to-transparent blur-[140px]" />
      <div className="absolute -bottom-[20%] left-[20%] h-[50vw] w-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-[#10352C]/20 via-[#071C18]/40 to-transparent blur-[130px]" />

      {/* 2. Top & Bottom Radial Glowing Aura Ellipses (Exact match with Landing Page) */}
      <div className={`${pos} top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.22),transparent_70%)] pointer-events-none`} />
      <div className={`${pos} bottom-0 right-1/4 w-[950px] h-[550px] bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none`} />
      <div className={`${pos} top-[45%] left-[8%] w-[650px] h-[450px] bg-[radial-gradient(circle,rgba(52,211,153,0.10),transparent_70%)] pointer-events-none`} />

      {/* 3. Deep Glowing Cyberpunk Grid Matrix (Exact match with Landing Page) */}
      <div className={`${pos} inset-0 bg-grid-cyber pointer-events-none opacity-85`} />

      {/* 4. Glowing Neon Intersections Matrix (Exact match with Landing Page) */}
      <div className={`${pos} inset-0 bg-grid-glow-points pointer-events-none opacity-90`} />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
