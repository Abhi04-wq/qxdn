import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wallet, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ onOpenWhitepaper }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Concise single-line navigation labels with section IDs
  const navLinks = [
    { id: 'hero', label: 'Ecosystem', href: '#hero' },
    { id: 'tiers', label: 'Tiers', href: '#tiers' },
    { id: 'calculator', label: 'Calculator', href: '#calculator' },
    { id: 'token-drops', label: 'Airdrops', href: '#token-drops' },
    { id: 'referrals', label: 'Network', href: '#referrals' },
    { id: 'security', label: 'Security', href: '#security' },
  ];

  // Dynamic Scroll Spy to detect the currently viewed section
  useEffect(() => {
    const sectionIds = ['hero', 'tiers', 'calculator', 'token-drops', 'referrals', 'security'];

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

      // Trigger threshold offset for header
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLaunchApp = () => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } else {
      navigate('/login');
    }
  };

  const toggleWallet = () => {
    setWalletConnected((prev) => !prev);
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth',
      });
      setActiveSection(targetId);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 py-4 transition-all duration-300 pointer-events-none">
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full rounded-2xl transition-all duration-300 px-3.5 sm:px-6 flex items-center justify-between pointer-events-auto ${
          scrolled
            ? 'max-w-6xl py-2.5 bg-[#020B08]/90 backdrop-blur-2xl border border-[#D4AF37]/35 shadow-[0_15px_45px_-10px_rgba(2,44,34,0.9),0_0_35px_rgba(52,211,153,0.18)]'
            : 'max-w-7xl py-3 bg-[#020B08]/75 backdrop-blur-xl border border-[#1E493B]/90 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.7)]'
        }`}
      >
        {/* Brand Logo with ambient rotating aura & gold emblem */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="flex items-center gap-2.5 sm:gap-3 group relative shrink-0"
        >
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#064E3B]/90 via-[#0B3D2E] to-[#022C22] border border-[#D4AF37]/40 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:border-[#D4AF37]/80 transition-all duration-300">
            {/* Subtle ambient rotating aura */}
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.45),transparent_70%)] animate-spin opacity-60"
              style={{ animationDuration: '8s' }}
            />
            <span className="font-mono text-base font-black tracking-widest text-[#F5D98E] relative z-10">Q</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base sm:text-lg text-[#F5F5F0] font-mono group-hover:text-[#A7F3D0] transition-colors">
                QNDX
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded bg-[#064E3B]/80 text-[#34D399] border border-[#34D399]/40 shadow-sm">
                v2.0
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#A7B8AE] tracking-wider uppercase font-medium">
              Emerald Mint Ecosystem
            </span>
          </div>
        </a>

        {/* Center Desktop Navigation Links (STRICTLY ONE HORIZONTAL LINE) */}
        <div className="hidden lg:flex items-center flex-nowrap shrink-0 gap-0.5 xl:gap-1 px-1.5 py-1 rounded-xl bg-[#071C18]/70 border border-[#1E493B]/80 backdrop-blur-md shadow-inner">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative px-2.5 xl:px-3 py-1.5 text-xs xl:text-[13px] font-mono tracking-wide whitespace-nowrap shrink-0 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#34D399] font-bold'
                    : 'text-[#A7B8AE] hover:text-[#F5F5F0] hover:bg-[#064E3B]/20'
                }`}
              >
                {/* Active Section Glowing Background Pill */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#064E3B] to-[#0B3D2E] border border-[#34D399]/70 shadow-[0_0_18px_rgba(52,211,153,0.35)] -z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse shrink-0" />
                  )}
                  {link.label}
                </span>
              </a>
            );
          })}

          {/* Whitepaper Spec Button */}
          <button
            onClick={onOpenWhitepaper}
            className="relative px-2.5 xl:px-3 py-1.5 text-xs xl:text-[13px] font-mono tracking-wide whitespace-nowrap shrink-0 text-[#A7F3D0] hover:text-[#F5D98E] transition-colors rounded-lg flex items-center gap-1.5 hover:bg-[#064E3B]/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Whitepaper</span>
          </button>
        </div>

        {/* Right CTA Group */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Wallet indicator pill */}
          <button
            onClick={toggleWallet}
            className="relative px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 border border-[#1E493B] bg-[#022C22]/80 hover:border-[#D4AF37]/50 text-[#F5F5F0] shadow-sm whitespace-nowrap"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                walletConnected ? 'bg-[#34D399] shadow-[0_0_8px_#34D399]' : 'bg-[#34D399] animate-pulse'
              }`}
            />
            <Wallet className="w-3.5 h-3.5 text-[#34D399]" />
            <span>{walletConnected ? '0x71C...4E89' : 'BEP-20 Live'}</span>
          </button>

          {/* Luxury Primary CTA Button with light sweep */}
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLaunchApp}
            className="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-[#064E3B] via-[#0B3D2E] to-[#064E3B] border border-[#D4AF37]/65 text-[#F5F5F0] font-mono font-bold text-xs tracking-wide transition-all shadow-[0_0_25px_rgba(212,175,55,0.25),0_0_15px_rgba(52,211,153,0.2)] flex items-center gap-1.5 hover:border-[#D4AF37] whitespace-nowrap"
          >
            {/* Animated light sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform ease-in-out pointer-events-none" />
            <span className="relative z-10 text-[#F5D98E] font-bold">{user ? 'Dashboard' : 'Launch App'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#F5D98E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform relative z-10" />
          </motion.button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={handleLaunchApp}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-[#064E3B] to-[#0B3D2E] border border-[#D4AF37]/50 text-[#F5D98E]"
          >
            App
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#022C22] text-[#A7B8AE] border border-[#1E493B]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#34D399]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute top-20 inset-x-4 p-5 rounded-2xl bg-[#020B08]/95 border border-[#D4AF37]/35 backdrop-blur-2xl shadow-2xl z-50 pointer-events-auto lg:hidden"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleNavClick(e, link.href);
                    }}
                    className={`px-3.5 py-2.5 text-sm font-mono rounded-xl transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-[#064E3B] text-[#34D399] font-bold border border-[#34D399]/40 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                        : 'text-[#A7B8AE] hover:text-[#F5F5F0] hover:bg-[#064E3B]/30'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399] animate-pulse" />
                    )}
                  </a>
                );
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWhitepaper();
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-mono font-medium text-[#F5D98E] hover:bg-[#064E3B]/30 rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Technical Whitepaper
              </button>

              <div className="pt-3 border-t border-[#1E493B] flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLaunchApp();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#0B3D2E] border border-[#D4AF37]/60 text-[#F5D98E] font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <span>{user ? 'Open Dashboard' : 'Launch Staking App'}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#F5D98E]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
