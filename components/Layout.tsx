
import React, { useState, useEffect } from 'react';
import { UserRole, User, Confederation, ConfTier } from '../types';
import { Menu, X, LogOut, Shield, User as UserIcon, Trophy, Home, Newspaper, Users, Circle, UserPlus, Calculator, Globe, Briefcase, MessageCircle, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  confederations: Confederation[];
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  onNavigate, 
  currentPage,
  onLogout,
  confederations
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isMaletasExpanded, setIsMaletasExpanded] = useState(false);
  const [isFabsVisible, setIsFabsVisible] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const storyImages = [
    'https://i.imgur.com/1U084Wh.png',
    'https://i.imgur.com/hcC9Hrt.png',
    'https://i.imgur.com/EebQZSn.png'
  ];

  const toggleFullscreen = () => {
    const elem = document.getElementById('maletas-image-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMaletasExpanded) {
      timer = setInterval(() => {
        setCurrentStoryIndex((prev) => (prev + 1) % storyImages.length);
      }, 20000);
    } else {
      setCurrentStoryIndex(0);
    }
    return () => clearInterval(timer);
  }, [isMaletasExpanded, currentStoryIndex]);


  // Filter only active confederations for display in marquee
  const activeConfs = confederations.filter(c => c.active !== false);

  // Helper to determine styling based on Tier
  const getTierIconStyle = (tier: ConfTier) => {
    switch (tier) {
      case ConfTier.SUPREME:
        return "border-purple-500 animate-glow-supreme shadow-purple-500/50";
      case ConfTier.DIAMOND:
        return "border-cyan-400 animate-glow-diamond shadow-cyan-400/50";
      default:
        return "border-gray-700";
    }
  };

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg w-full md:w-auto transition-colors ${
        currentPage === page 
          ? 'bg-strongs-gold text-strongs-darker font-bold' 
          : 'text-gray-300 hover:text-strongs-gold hover:bg-white/5'
      }`}
    >
      <Icon size={20} />
      <span className="font-display text-xl uppercase tracking-wide">{label}</span>
    </button>
  );

  const isAdminOrMod = currentUser && ['ADMIN', 'OWNER', 'MOD', 'MANAGER'].includes(currentUser.role);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-strongs-darker/95 border-b border-strongs-gold/30 backdrop-blur-sm shadow-lg shadow-black/50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
             {!imgError ? (
               <img 
                 src="https://i.imgur.com/w4Yb9ZC.png" 
                 onError={() => setImgError(true)}
                 alt="Strongs Brazil Logo" 
                 className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-lg group-hover:border-strongs-gold transition-colors bg-strongs-dark" 
               />
             ) : (
               <div className="w-12 h-12 rounded-full bg-strongs-gold flex items-center justify-center text-strongs-darker font-bold border-2 border-white shadow-lg group-hover:bg-white transition-colors">
                  SB
               </div>
             )}
             <h1 className="text-3xl font-display font-bold text-white tracking-widest group-hover:text-strongs-gold transition-colors">
               STRONGS <span className="text-strongs-gold">BRAZIL</span>
             </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavItem page="home" icon={Home} label="Início" />
            <NavItem page="confederations" icon={Users} label="Confederações" />
            <NavItem page="rankings" icon={Trophy} label="Rankings" />
            <NavItem page="simulador" icon={Calculator} label="Simulador" />
            <NavItem page="recrutamento" icon={UserPlus} label="Recrutamento" />
            {currentUser && <NavItem page="admin" icon={Shield} label={isAdminOrMod ? "Painel Admin" : "Meu Painel"} />}

            {currentUser ? (
              <div className="ml-4 flex items-center space-x-4 border-l border-gray-700 pl-4">
                <div className="flex flex-col items-end">
                  <span className={`font-display text-lg leading-none ${currentUser.role === 'OWNER' ? 'text-strongs-gold' : 'text-white'}`}>
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">{currentUser.role}</span>
                </div>
                <button onClick={onLogout} className="text-gray-400 hover:text-red-400" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <NavItem page="login" icon={UserIcon} label="Entrar" />
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              className="text-strongs-gold"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-strongs-darker border-b border-gray-800 p-4 space-y-2">
            <NavItem page="home" icon={Home} label="Início" />
            <NavItem page="confederations" icon={Users} label="Confederações" />
            <NavItem page="rankings" icon={Trophy} label="Rankings" />
            <NavItem page="simulador" icon={Calculator} label="Simulador" />
            <NavItem page="recrutamento" icon={UserPlus} label="Recrutamento" />
            {currentUser && <NavItem page="admin" icon={Shield} label={isAdminOrMod ? "Painel Admin" : "Meu Painel"} />}
            
            {currentUser ? (
              <div className="pt-4 border-t border-gray-800 mt-2">
                 <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-xl text-white">{currentUser.name}</span>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-strongs-gold">{currentUser.role}</span>
                 </div>
                 <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center space-x-2 bg-red-900/30 text-red-400 py-2 rounded"
                 >
                   <LogOut size={16} /> <span>Sair</span>
                 </button>
              </div>
            ) : (
              <NavItem page="login" icon={UserIcon} label="Entrar" />
            )}
          </div>
        )}
      </header>

      {/* Marquee Section (Moved to Top) */}
      <div className="relative border-b border-gray-800 bg-strongs-darker py-3 overflow-hidden z-40">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-strongs-darker to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-strongs-darker to-transparent z-10 pointer-events-none"></div>
        
        {/* Single Track Wrapper */}
        <div className="flex w-full overflow-hidden">
          <div className="flex items-center space-x-12 animate-scroll w-max pr-12">
            
            {/* Set 1: Original */}
            {activeConfs.length === 0 ? (
               <span className="text-gray-600 font-display px-4">Sem confederações cadastradas...</span>
            ) : (
              activeConfs.map((conf, i) => (
                <div key={`orig-${conf.id}-${i}`} className="flex items-center space-x-3 transition-opacity flex-shrink-0 cursor-default opacity-90 hover:opacity-100">
                   {conf.imageUrl ? (
                     <img 
                      src={conf.imageUrl} 
                      className={`w-10 h-10 rounded-full border-2 bg-black/50 object-contain ${getTierIconStyle(conf.tier)}`} 
                      alt={conf.name} 
                     />
                   ) : (
                     <div className={`w-10 h-10 rounded-full border-2 bg-gray-800 flex items-center justify-center ${getTierIconStyle(conf.tier)}`}>
                       <Circle size={20} className="text-gray-500" />
                     </div>
                   )}
                   <span className="font-display text-lg text-white uppercase tracking-wider">{conf.name}</span>
                </div>
              ))
            )}

            {/* Set 2: Duplicate for seamless loop */}
            {activeConfs.length > 0 && activeConfs.map((conf, i) => (
              <div key={`dup-${conf.id}-${i}`} className="flex items-center space-x-3 transition-opacity flex-shrink-0 cursor-default opacity-90 hover:opacity-100">
                 {conf.imageUrl ? (
                   <img 
                    src={conf.imageUrl} 
                    className={`w-10 h-10 rounded-full border-2 bg-black/50 object-contain ${getTierIconStyle(conf.tier)}`} 
                    alt={conf.name} 
                   />
                 ) : (
                   <div className={`w-10 h-10 rounded-full border-2 bg-gray-800 flex items-center justify-center ${getTierIconStyle(conf.tier)}`}>
                     <Circle size={20} className="text-gray-500" />
                   </div>
                 )}
                 <span className="font-display text-lg text-white uppercase tracking-wider">{conf.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Modal for "Consiga Maletas" */}
      {isMaletasExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 w-full max-w-5xl h-[85vh] rounded-2xl border border-green-500 shadow-2xl flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Briefcase className="text-green-500" /> Consiga Maletas
              </h3>
              <button 
                onClick={() => setIsMaletasExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Body */}
            <div id="maletas-image-container" className="flex-1 overflow-hidden relative bg-black/80 flex flex-col items-center justify-center">
              <style>{`
                @keyframes storyProgress {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              `}</style>
              
              {/* Progress Bars */}
              <div className="absolute top-4 left-4 right-16 flex gap-2 z-20">
                {storyImages.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1.5 bg-gray-600/50 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      key={`progress-${idx}-${currentStoryIndex}`}
                      className={`h-full bg-white ${idx === currentStoryIndex ? '' : idx < currentStoryIndex ? 'w-full' : 'w-0'}`}
                      style={idx === currentStoryIndex ? { animation: 'storyProgress 20s linear forwards' } : {}}
                    />
                  </div>
                ))}
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-4 z-20 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>

              {/* Navigation Left */}
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white z-20 transition-colors"
                onClick={() => setCurrentStoryIndex(prev => prev > 0 ? prev - 1 : storyImages.length - 1)}
              >
                <ChevronLeft size={32} />
              </button>

              {/* Navigation Right */}
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white z-20 transition-colors"
                onClick={() => setCurrentStoryIndex(prev => (prev + 1) % storyImages.length)}
              >
                <ChevronRight size={32} />
              </button>

              <img 
                key={currentStoryIndex}
                src={storyImages[currentStoryIndex]} 
                alt="Consiga Maletas" 
                className="w-full h-full object-contain animate-fadeIn"
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex flex-col sm:flex-row gap-4 justify-end bg-gray-900/50">
              <button 
                onClick={() => setIsMaletasExpanded(false)}
                className="px-6 py-3 rounded-lg font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border border-gray-700"
              >
                Retornar ao Site
              </button>
              <a 
                href="https://wa.me/5579988126434?text=Ol%C3%A1%2C%20eu%20vim%20pelo%20site%20da%20Strongs%20Brazil.%20Gostaria%20de%20or%C3%A7ar%20o%20seu%20servi%C3%A7o%20com%20o%20cupom%20do%20site.%20%3A%29"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-green-600/20"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons Container */}
      {currentPage !== 'simulador' && (
        <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-4">
          {isFabsVisible ? (
            <>
              {/* Toggle Button (Minimize) */}
              <button 
                onClick={() => setIsFabsVisible(false)}
                className="bg-gray-800 text-gray-400 hover:text-white p-2 rounded-full shadow-lg border border-gray-700 transition-colors"
                title="Minimizar botões"
              >
                <ChevronRight size={20} />
              </button>

              {/* Recrutamento */}
              {currentPage !== 'rankings' && (
                <button
                  onClick={() => onNavigate('recrutamento')}
                  className="bg-strongs-gold text-strongs-darker p-4 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.5)] border-2 border-white hover:scale-110 transition-transform duration-300 group relative"
                  title="Inscreva-se em uma confederação"
                >
                  <UserPlus size={32} strokeWidth={2.5} />
                  <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold uppercase tracking-wide">
                    Recrutamento
                  </span>
                </button>
              )}

              {/* Consiga Maletas */}
              {currentPage !== 'rankings' && (
                <button
                  onClick={() => setIsMaletasExpanded(true)}
                  className="bg-gray-900 text-white px-4 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] border-2 border-green-500 hover:scale-105 transition-transform duration-300 flex items-center gap-2"
                  title="Consiga Maletas"
                >
                  <Briefcase size={24} className="text-green-500" />
                  <span className="font-bold uppercase tracking-wide text-sm hidden sm:inline">Consiga Maletas</span>
                </button>
              )}

              {/* WhatsApp Group */}
              <a
                href="https://chat.whatsapp.com/BgVkLvb5y2BLBga2PKoJrk"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-4 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)] border-2 border-white hover:scale-105 transition-transform duration-300 flex items-center gap-2"
                title="Junte-se ao nosso grupo"
              >
                <MessageCircle size={24} className="text-white" />
                <span className="font-bold uppercase tracking-wide text-sm hidden sm:inline">Junte-se ao nosso grupo</span>
              </a>
            </>
          ) : (
            <button 
              onClick={() => setIsFabsVisible(true)}
              className="bg-gray-800 text-white p-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-gray-600 hover:scale-110 hover:border-strongs-gold hover:text-strongs-gold transition-all duration-300 flex items-center justify-center animate-pulse-slow"
              title="Mostrar botões"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-strongs-darker border-t border-gray-800 py-6 text-center text-gray-500 text-sm relative z-10">
        <p>© {new Date().getFullYear()} STRONGS BRAZIL. Desordem e Regresso.</p>
        <p className="mt-1 text-xs">Desenvolvido para a comunidade.</p>
      </footer>
    </div>
  );
};
