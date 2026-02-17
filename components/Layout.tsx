import React, { useState } from 'react';
import { UserRole, User, Confederation } from '../types';
import { Menu, X, LogOut, Shield, User as UserIcon, Trophy, Home, Newspaper, Users, Circle, UserPlus } from 'lucide-react';

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

  // Filter only active confederations for display in marquee
  const activeConfs = confederations.filter(c => c.active !== false);

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
    <div className="min-h-screen flex flex-col bg-strongs-darker bg-[url('/background.png')] bg-cover bg-center bg-fixed bg-blend-overlay">
      {/* Overlay to darken background image - adjusted opacity to let the art show through slightly more */}
      <div className="fixed inset-0 bg-strongs-darker/85 -z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-strongs-darker/95 border-b border-strongs-gold/30 backdrop-blur-sm shadow-lg shadow-black/50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
             <div className="w-10 h-10 rounded-full bg-strongs-gold flex items-center justify-center text-strongs-darker font-bold border-2 border-white">
                SB
             </div>
             <h1 className="text-3xl font-display font-bold text-white tracking-widest group-hover:text-strongs-gold transition-colors">
               STRONGS <span className="text-strongs-gold">BRAZIL</span>
             </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavItem page="home" icon={Home} label="Início" />
            <NavItem page="confederations" icon={Users} label="Confederações" />
            <NavItem page="rankings" icon={Trophy} label="Rankings" />
            <NavItem page="join-us" icon={UserPlus} label="Quero me Juntar" />
            {isAdminOrMod && <NavItem page="admin" icon={Shield} label="Painel" />}
            
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
              <NavItem page="login" icon={UserIcon} label="Login" />
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-strongs-gold"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-strongs-darker border-b border-gray-800 p-4 space-y-2">
            <NavItem page="home" icon={Home} label="Início" />
            <NavItem page="confederations" icon={Users} label="Confederações" />
            <NavItem page="rankings" icon={Trophy} label="Rankings" />
            <NavItem page="join-us" icon={UserPlus} label="Quero me Juntar" />
            {isAdminOrMod && <NavItem page="admin" icon={Shield} label="Painel" />}
            
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
              <NavItem page="login" icon={UserIcon} label="Entrar / Cadastrar" />
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>

      {/* Floating Action Button (FAB) for "Quero me Juntar" */}
      <button
        onClick={() => onNavigate('join-us')}
        className="fixed bottom-24 right-6 z-40 bg-strongs-gold text-strongs-darker p-4 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.5)] border-2 border-white hover:scale-110 transition-transform duration-300 group"
        title="Quero me juntar"
      >
        <UserPlus size={32} strokeWidth={2.5} />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold uppercase tracking-wide">
          Junte-se a nós!
        </span>
      </button>

      {/* Marquee Section */}
      <div className="relative border-t border-gray-800 bg-strongs-darker py-4 overflow-hidden z-20">
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
                <div key={`orig-${conf.id}-${i}`} className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                   {conf.imageUrl ? (
                     <img src={conf.imageUrl} className="w-12 h-12 rounded-full border-2 border-gray-700 bg-black/50 object-contain" alt={conf.name} />
                   ) : (
                     <div className="w-12 h-12 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center">
                       <Circle size={24} className="text-gray-500" />
                     </div>
                   )}
                   <span className="font-display text-xl text-white uppercase tracking-wider">{conf.name}</span>
                </div>
              ))
            )}

            {/* Set 2: Duplicate for seamless loop */}
            {activeConfs.length > 0 && activeConfs.map((conf, i) => (
              <div key={`dup-${conf.id}-${i}`} className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                 {conf.imageUrl ? (
                   <img src={conf.imageUrl} className="w-12 h-12 rounded-full border-2 border-gray-700 bg-black/50 object-contain" alt={conf.name} />
                 ) : (
                   <div className="w-12 h-12 rounded-full border-2 border-gray-700 bg-gray-800 flex items-center justify-center">
                     <Circle size={24} className="text-gray-500" />
                   </div>
                 )}
                 <span className="font-display text-xl text-white uppercase tracking-wider">{conf.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-strongs-darker border-t border-gray-800 py-6 text-center text-gray-500 text-sm relative z-10">
        <p>© {new Date().getFullYear()} STRONGS BRAZIL. Desordem e Regresso.</p>
        <p className="mt-1 text-xs">Desenvolvido para a comunidade.</p>
      </footer>
    </div>
  );
};