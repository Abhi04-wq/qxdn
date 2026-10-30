import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useMotionValue } from 'framer-motion';
import ParticleCanvas from '../components/landing/ParticleCanvas.jsx';
import Navbar from '../components/landing/Navbar.jsx';
import Hero from '../components/landing/Hero.jsx';
import TierCards from '../components/landing/TierCards.jsx';
import StakingCalculator from '../components/landing/StakingCalculator.jsx';
import TokenDrops from '../components/landing/TokenDrops.jsx';
import ReferralTree from '../components/landing/ReferralTree.jsx';
import SecurityGrid from '../components/landing/SecurityGrid.jsx';
import Footer from '../components/landing/Footer.jsx';
import WhitepaperModal from '../components/landing/WhitepaperModal.jsx';

export default function LandingPage() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);

  // Buttery-smooth scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Soft ambient cursor follower for desktop
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorSpringX = useSpring(cursorX, { stiffness: 300, damping: 28 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 300, damping: 28 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <div className="relative min-h-screen bg-[#020B08] text-[#F5F5F0] overflow-x-hidden selection:bg-[#34D399]/25 selection:text-[#F5F5F0]">
      {/* Top scroll progress line with Emerald & Gold gradient */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#064E3B] via-[#34D399] to-[#D4AF37] z-50 origin-left shadow-[0_0_10px_rgba(52,211,153,0.5)]"
      />

      {/* Subtle cursor ambient glow (Desktop only) */}
      <motion.div
        style={{
          x: cursorSpringX,
          y: cursorSpringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="fixed top-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.04),transparent_65%)] pointer-events-none z-30 hidden md:block rounded-full"
      />

      {/* Interactive WebGL / HTML5 5-Layer Canvas */}
      <ParticleCanvas />

      {/* Deep glowing cyberpunk grid with neon intersection matrix */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-85 z-0" />
      <div className="fixed inset-0 bg-grid-glow-points pointer-events-none opacity-90 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.18),transparent_70%)] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[950px] h-[550px] bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none z-0" />

      {/* Floating Dynamic Navbar */}
      <Navbar onOpenWhitepaper={() => setWhitepaperOpen(true)} />

      {/* Main Content Sections */}
      <main className="relative z-10 space-y-12 sm:space-y-20">
        {/* 1. Hero Section with 3D Parallax Tilt Widget */}
        <Hero onOpenWhitepaper={() => setWhitepaperOpen(true)} />

        {/* 2. Tiered Staking Cards Section (3D Tilt Cards) */}
        <TierCards />

        {/* 3. Live Interactive Staking Yield Calculator */}
        <StakingCalculator />

        {/* 4. The 4 Promotional Airdrop Tokens Showcase */}
        <TokenDrops />

        {/* 5. Multi-Level Referral Network (10 Levels Breakdown & Simulator) */}
        <ReferralTree />

        {/* 6. Institutional Security, Audits & Append-Only Ledger */}
        <SecurityGrid onOpenWhitepaper={() => setWhitepaperOpen(true)} />
      </main>

      {/* Premium Animated Footer */}
      <Footer onOpenWhitepaper={() => setWhitepaperOpen(true)} />

      {/* Technical Architecture Whitepaper Modal */}
      <WhitepaperModal isOpen={whitepaperOpen} onClose={() => setWhitepaperOpen(false)} />
    </div>
  );
}
