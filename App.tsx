
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Rankings } from './components/Rankings';
import { AdminPanel } from './components/AdminPanel';
import { Button } from './components/Button';
import { AppData, UserRole, ConfTier, JoinApplication, Member, GameResult, Attendance, Confederation, User, NewsPost, Top100Entry, ArchivedSeason, GlobalSettings } from './types';
import { loadData } from './services/storage'; // We keep this just for DEFAULT_DATA structure
import { Trophy, ChevronRight, Lock, Users, Shield, UserPlus, Send, Briefcase, Coins, Percent, Smartphone, Star, Loader2, AlertTriangle, CheckSquare, RefreshCw } from 'lucide-react';

// Firebase Imports
import { db, isConfigured } from './services/firebase';
import { ref, onValue, set, remove, update } from "firebase/database";

const App: React.FC = () => {
  // Initialize with minimal state, data will come from Firebase
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null); // New state for save errors
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedNews, setSelectedNews] = useState<string | null>(null);

  // Auth State (Local session only)
  const [currentUser, setCurrentUser] = useState<AppData['currentUser']>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Use a ref to track currentUser inside the Firebase callback closure
  const currentUserRef = useRef(currentUser);

  // Sync ref with state
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [keepConnected, setKeepConnected] = useState(false); // New state for persistence
  const [registerName, setRegisterName] = useState('');
  const [registerUser, setRegisterUser] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Helper to force arrays
  const ensureArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.filter(item => item !== null && item !== undefined);
    }
    return Object.values(data).filter(item => item !== null && item !== undefined);
  };

  const sanitizeMembers = (input: any): Member[] => {
      if (!input) return [];
      
      let list: any[] = [];
      if (Array.isArray(input)) {
          list = input.filter(i => i !== null && i !== undefined);
      } else if (typeof input === 'object') {
          list = Object.values(input).filter(i => i !== null && i !== undefined);
      }

      return list.map((m: any) => {
          const id = m.id || Math.random().toString(36).substr(2, 9);
          const rawWeeks = m.weeks || {}; 
          
          const sanitizedWeeks = [0, 1, 2, 3].map(weekIdx => {
              const w = rawWeeks[weekIdx] || {};
              const rawGames = w.games || {};
              
              const sanitizedGames = [0, 1, 2, 3].map(gameIdx => {
                  const g = rawGames[gameIdx] || {};
                  return {
                      result: g.result || 'NONE' as GameResult,
                      attendance: g.attendance || 'NONE' as Attendance
                  };
              });

              return { games: sanitizedGames };
          });

          return {
              ...m,
              id,
              weeks: sanitizedWeeks
          };
      });
  };

  // 1. Connect to Firebase on Mount (READ ONLY)
  useEffect(() => {
    let unsubscribe = () => {};

    if (!isConfigured || !db) {
      setErrorMsg("O Firebase não está configurado ou inicializado.");
      setLoading(false);
      return;
    }

    try {
        const dataRef = ref(db, 'strongs_db');
        
        const timeoutId = setTimeout(() => {
            if (loading) { 
                setLoading((currentLoading) => {
                    if (currentLoading) {
                        setErrorMsg("A conexão com o banco de dados está demorando muito.");
                        return false; 
                    }
                    return currentLoading;
                });
            }
        }, 15000); 

        // READ LISTENER
        unsubscribe = onValue(dataRef, (snapshot) => {
          clearTimeout(timeoutId);
          const val = snapshot.val();
          const sessionUser = currentUserRef.current;

          if (val) {
            // Priority Read: membersConf (Map) -> fallback to members (Array)
            const rawMembers = val.membersConf || val.members;
            const membersArray = sanitizeMembers(rawMembers);

            const safeData: AppData = {
                ...val,
                users: ensureArray(val.users),
                confederations: ensureArray(val.confederations),
                members: membersArray, 
                news: ensureArray(val.news),
                top100History: ensureArray(val.top100History),
                joinApplications: ensureArray(val.joinApplications),
                archivedSeasons: ensureArray(val.archivedSeasons),
                settings: val.settings || { activeWeek: 0 },
                currentUser: sessionUser 
            };

            // Session Restoration
            if (sessionUser) {
                const freshUser = safeData.users.find(u => u.id === sessionUser.id);
                if (freshUser) safeData.currentUser = freshUser;
            } 
            else {
                const storedUid = localStorage.getItem('strongs_session_uid');
                if (storedUid) {
                    const restoredUser = safeData.users.find(u => u.id === storedUid);
                    if (restoredUser) {
                        safeData.currentUser = restoredUser;
                        setCurrentUser(restoredUser); 
                        currentUserRef.current = restoredUser; 
                    }
                }
            }

            setData(safeData);
          } else {
            // First Run / Empty DB
            const defaultData = loadData();
            defaultData.members = sanitizeMembers(defaultData.members);
            
            const initialPayload = { ...defaultData };
            const membersMap: Record<string, Member> = {};
            defaultData.members.forEach(m => { if(m.id) membersMap[m.id] = m; });
            
            // @ts-ignore
            initialPayload.membersConf = membersMap;
            // @ts-ignore
            delete initialPayload.members;

            set(dataRef, initialPayload);
            setData(defaultData);
          }
          setLoading(false);
          setErrorMsg(null);
        }, (error) => {
          clearTimeout(timeoutId);
          console.error("Firebase read error:", error);
          setErrorMsg(`Erro de conexão: ${error.message}`);
          setLoading(false);
        });

    } catch (err: any) {
        console.error("Critical Firebase Error:", err);
        setErrorMsg("Erro crítico ao conectar: " + err.message);
        setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // --- HELPER: Sanitize for Firebase (removes undefined) ---
  const sanitizeForFirebase = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };

  // --- GRANULAR WRITE OPERATIONS ---

  // 1. Members (Granular on membersConf/{id})
  const handleSaveMember = async (member: Member) => {
      if (!db || !isConfigured) return;
      try {
          console.log(`Saving member ${member.id} to membersConf...`);
          const payload = sanitizeForFirebase(member);
          await set(ref(db, `strongs_db/membersConf/${member.id}`), payload);
          setSaveError(null);
      } catch (err: any) {
          console.error("Error saving member:", err);
          setSaveError("Erro ao salvar membro: " + err.message);
      }
  };

  const handleDeleteMember = async (memberId: string) => {
      if (!db || !isConfigured) return;
      try {
          console.log(`Deleting member ${memberId}...`);
          await remove(ref(db, `strongs_db/membersConf/${memberId}`));
          setSaveError(null);
      } catch (err: any) {
          console.error("Error deleting member:", err);
          setSaveError("Erro ao excluir membro: " + err.message);
      }
  };

  // 2. Lists (Write to specific list node, avoiding root write)
  const handleUpdateUsers = async (users: User[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(users);
      await set(ref(db, 'strongs_db/users'), payload);
  };

  const handleUpdateConfs = async (confs: Confederation[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(confs);
      await set(ref(db, 'strongs_db/confederations'), payload);
  };

  const handleUpdateNews = async (news: NewsPost[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(news);
      await set(ref(db, 'strongs_db/news'), payload);
  };

  const handleUpdateTop100 = async (history: Top100Entry[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(history);
      await set(ref(db, 'strongs_db/top100History'), payload);
  };

  const handleUpdateJoinApps = async (apps: JoinApplication[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(apps);
      await set(ref(db, 'strongs_db/joinApplications'), payload);
  };

  const handleUpdateSeasons = async (seasons: ArchivedSeason[]) => {
      if (!db) return;
      const payload = sanitizeForFirebase(seasons);
      await set(ref(db, 'strongs_db/archivedSeasons'), payload);
  };
  
  const handleUpdateSettings = async (settings: GlobalSettings) => {
      if (!db) return;
      const payload = sanitizeForFirebase(settings);
      await set(ref(db, 'strongs_db/settings'), payload);
  };

  // Special case: Resetting DB (Dangerous, keeps root write but only for owner)
  const handleResetDB = async (fullData: AppData) => {
      if (!db) return;
      const payload = sanitizeForFirebase(fullData);
      await set(ref(db, 'strongs_db'), payload);
  };

  // --- AUTH HANDLERS ---

  const handleLogin = () => {
    if (!data) return;
    const user = data.users.find(u => u.username === loginUser.trim() && u.password === loginPass);
    if (user) {
      // Local update only for session
      setCurrentUser(user);
      if (keepConnected) {
        localStorage.setItem('strongs_session_uid', user.id);
      } else {
        localStorage.removeItem('strongs_session_uid');
      }
      setLoginError(null);
      setCurrentPage('home');
    } else {
      setLoginError("Senha ou usuário incorretos");
    }
  };

  const handleRegister = () => {
    if (!data) return;
    if(!registerName || !registerUser || !registerPass) return alert("Preencha tudo");
    if(data.users.find(u => u.username === registerUser)) return alert("Usuário já existe");

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: registerName,
      username: registerUser,
      password: registerPass,
      role: UserRole.USER 
    };

    // Granular update
    const updatedUsers = [...data.users, newUser];
    handleUpdateUsers(updatedUsers);
    
    // Auto login
    setCurrentUser(newUser);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('strongs_session_uid');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handleDeleteUser = (userId: string) => {
      if(!data) return;
      const user = data.users.find(u => u.id === userId);
      if(!user) return;
      if (user.role === UserRole.OWNER) return alert("Dono não pode ser excluído.");
      if(confirm(`Excluir ${user.username}?`)) handleUpdateUsers(data.users.filter(u => u.id !== userId));
  };

  const handleJoinRequest = (app: JoinApplication) => {
      // Logic from JoinUsPage moved here to use granular update
      if (!data) return;
      const updatedApps = [...data.joinApplications, app];
      handleUpdateJoinApps(updatedApps);
  };

  // --- PAGES ---

  const HomePage = () => (
    <div className="space-y-12 animate-fadeIn">
      {/* Hero */}
      <div className="text-center py-12 px-4 bg-gradient-to-b from-transparent to-black/40 rounded-3xl border border-strongs-gold/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4 drop-shadow-lg">
            BEM VINDO À <span className="text-strongs-gold">ELITE</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light">
            Acompanhe rankings, gerencie sua confederação e faça parte da história da Strongs Brazil.
          </p>
          <Button 
            className="text-xl px-8 py-3 shadow-lg shadow-strongs-gold/20" 
            onClick={() => setCurrentPage('rankings')}
          >
            Ver Rankings <ChevronRight className="inline ml-1"/>
          </Button>
        </div>
      </div>

      {/* News Feed */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white mb-6 pl-4 border-l-4 border-strongs-gold">
          Últimas Notícias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.news.map(post => (
             <div key={post.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-strongs-gold transition-all duration-300 group cursor-pointer" onClick={() => { setSelectedNews(post.id); setCurrentPage('news-detail'); }}>
               <div className="h-48 overflow-hidden relative">
                 <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                 <span className="absolute bottom-2 left-2 text-xs text-gray-300 bg-black/50 px-2 py-1 rounded backdrop-blur">{new Date(post.date).toLocaleDateString()}</span>
               </div>
               <div className="p-5">
                 <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-strongs-gold transition-colors">{post.title}</h3>
                 <p className="text-gray-400 text-sm line-clamp-3">{post.subject}</p>
                 <div className="mt-4 text-strongs-gold text-sm font-bold uppercase tracking-wider flex items-center">
                   Ler Mais <ChevronRight size={16} />
                 </div>
               </div>
             </div>
          ))}
          {data?.news.length === 0 && <div className="col-span-3 text-center text-gray-500 py-10">Nenhuma notícia publicada ainda.</div>}
        </div>
      </div>
    </div>
  );

  const JoinUsPage = () => {
    const [name, setName] = useState('');
    const [greens, setGreens] = useState('');
    const [tokens, setTokens] = useState('');
    const [percent, setPercent] = useState('');
    const [ddd, setDdd] = useState('');
    const [phone, setPhone] = useState('');
    const [hasAttributed, setHasAttributed] = useState<'YES' | 'NO' | ''>('');
    const [attributedCount, setAttributedCount] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      // Validation Logic
      const isAttributedValid = hasAttributed === 'NO' || (hasAttributed === 'YES' && attributedCount !== '');
      
      if (!name || !greens || !tokens || !percent || !ddd || !phone || hasAttributed === '' || !isAttributedValid) {
        alert("Responda todas as perguntas antes de enviar cadastro.");
        return;
      }

      const app: JoinApplication = {
        id: Date.now().toString(),
        name,
        greens: parseInt(greens),
        tokens: parseInt(tokens),
        teamPercentage: parseInt(percent),
        whatsapp: `(${ddd}) ${phone}`,
        hasAttributedPlayers: hasAttributed === 'YES',
        attributedPlayersCount: hasAttributed === 'YES' ? parseInt(attributedCount) : 0,
        status: 'PENDING',
        date: new Date().toISOString()
      };

      handleJoinRequest(app);
      setSubmitted(true);
    };

    if (submitted) {
      return (
        <div className="max-w-2xl mx-auto text-center py-20 px-4">
           <div className="w-24 h-24 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500">
             <Send size={48} className="text-green-500" />
           </div>
           <h2 className="text-4xl font-display font-bold text-white mb-4">Solicitação Enviada!</h2>
           <p className="text-xl text-gray-300 mb-8">
             Seu cadastro para uma de nossas confederações foi enviado com sucesso, aguarde um de nossos administradores entrar em contato com você.
           </p>
           <Button onClick={() => setCurrentPage('home')}>Voltar ao Início</Button>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
             <UserPlus className="inline mr-2 text-strongs-gold" size={32} />
             Quero me <span className="text-strongs-gold">Juntar</span>
          </h2>
          <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full mb-4"></div>
          <p className="text-gray-400">Preencha o formulário abaixo para se candidatar a uma de nossas confederações.</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-8 rounded-2xl shadow-2xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Nome Completo <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="text-gray-500" size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/40 border border-gray-600 rounded p-3 pl-10 text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="Como devemos te chamar?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Maletas Verdes <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="text-green-500" size={18} />
                  </div>
                  <input 
                    type="number" 
                    value={greens}
                    onChange={e => setGreens(e.target.value)}
                    className="w-full bg-black/40 border border-gray-600 rounded p-3 pl-10 text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="Qtd."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Tokens <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="text-yellow-500" size={18} />
                  </div>
                  <input 
                    type="number" 
                    value={tokens}
                    onChange={e => setTokens(e.target.value)}
                    className="w-full bg-black/40 border border-gray-600 rounded p-3 pl-10 text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="Qtd."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Porcentagem do Time (%) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="text-blue-500" size={18} />
                  </div>
                  <input 
                    type="number" 
                    value={percent}
                    onChange={e => setPercent(e.target.value)}
                    className="w-full bg-black/40 border border-gray-600 rounded p-3 pl-10 text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="ex: 120"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">WhatsApp <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={ddd}
                    onChange={e => setDdd(e.target.value)}
                    maxLength={2}
                    className="w-16 bg-black/40 border border-gray-600 rounded p-3 text-center text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="DDD"
                  />
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="text-gray-500" size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-black/40 border border-gray-600 rounded p-3 pl-10 text-white focus:border-strongs-gold outline-none transition-colors"
                      placeholder="99999-9999"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 border-t border-gray-700 pt-4 mt-2">
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase flex items-center">
                  <Star className="text-strongs-gold mr-2" size={16}/>
                  Tem jogadores atributados? <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="hasAttributed" 
                      value="YES" 
                      checked={hasAttributed === 'YES'} 
                      onChange={() => setHasAttributed('YES')}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full mr-2 flex items-center justify-center transition-colors ${hasAttributed === 'YES' ? 'border-strongs-gold' : 'border-gray-500'}`}>
                      {hasAttributed === 'YES' && <div className="w-2.5 h-2.5 bg-strongs-gold rounded-full" />}
                    </div>
                    <span className={`font-bold transition-colors ${hasAttributed === 'YES' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>Sim</span>
                  </label>

                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="hasAttributed" 
                      value="NO" 
                      checked={hasAttributed === 'NO'} 
                      onChange={() => { setHasAttributed('NO'); setAttributedCount(''); }}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full mr-2 flex items-center justify-center transition-colors ${hasAttributed === 'NO' ? 'border-strongs-gold' : 'border-gray-500'}`}>
                      {hasAttributed === 'NO' && <div className="w-2.5 h-2.5 bg-strongs-gold rounded-full" />}
                    </div>
                    <span className={`font-bold transition-colors ${hasAttributed === 'NO' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>Não</span>
                  </label>
                </div>
              </div>

              {hasAttributed === 'YES' && (
                <div className="col-span-1 md:col-span-2 animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Quantos? <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    value={attributedCount}
                    onChange={e => setAttributedCount(e.target.value)}
                    className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
                    placeholder="Número de jogadores atributados"
                  />
                </div>
              )}

           </div>
           
           <Button fullWidth onClick={handleSubmit} className="text-lg py-4 shadow-lg shadow-strongs-gold/20">
             Enviar Cadastro
           </Button>
        </div>
      </div>
    );
  };

  const ConfederationsPage = () => (
    <div className="space-y-8 animate-fadeIn">
       <div className="text-center mb-10">
          <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
            Nossas <span className="text-strongs-gold">Confederações</span>
          </h2>
          <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full mb-4"></div>
          <p className="text-gray-400">Conheça as elites da Strongs Brazil.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {data?.confederations.filter(c => c.active !== false).map(conf => {
             const members = data.members.filter(m => m.confId === conf.id);
             return (
               <div key={conf.id} className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 hover:border-strongs-gold/50 transition-all group min-h-[400px] flex flex-col">
                  
                  {/* --- GLOBAL BACKGROUND LAYER --- */}
                  {/* Background Image with slightly higher opacity for prominence */}
                  {conf.imageUrl ? (
                    <>
                         <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50 z-0"
                            style={{ backgroundImage: `url(${conf.imageUrl})` }}
                         />
                         {/* Gradient Overlay: Darker at bottom for text, lighter at top for image visibility */}
                         <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/80 to-black/95 z-0" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-900 z-0" />
                  )}

                  {/* --- CONTENT LAYER (z-10 ensures it is above background) --- */}
                  <div className="relative z-10 flex flex-col h-full">
                      
                      {/* Header Section */}
                      <div className="p-6 border-b border-white/10 flex items-center justify-between backdrop-blur-sm">
                         <div className="flex items-center gap-4">
                            {conf.imageUrl ? (
                               <img src={conf.imageUrl} className="w-16 h-16 rounded-full border-2 border-strongs-gold object-contain bg-black/50" alt={conf.name} />
                            ) : (
                               <div className="w-16 h-16 rounded-full border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                                  <Shield size={32} className="text-gray-500"/>
                               </div>
                            )}
                            <div>
                               <h3 className="text-2xl font-display font-bold text-white shadow-black drop-shadow-md">{conf.name}</h3>
                               <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                  conf.tier === ConfTier.SUPREME ? 'bg-purple-900 text-purple-200' :
                                  conf.tier === ConfTier.DIAMOND ? 'bg-blue-900 text-blue-200' :
                                  conf.tier === ConfTier.PLATINUM ? 'bg-slate-600 text-white' :
                                  'bg-yellow-900 text-yellow-200'
                               }`}>
                                  {conf.tier}
                               </span>
                            </div>
                         </div>
                         <div className="text-right hidden sm:block">
                            <span className="block text-3xl font-display font-bold text-white shadow-black drop-shadow-md">{members.length}</span>
                            <span className="text-xs text-gray-400 uppercase">Membros</span>
                         </div>
                      </div>
                      
                      {/* Members List Section - Now transparent to show BG */}
                      <div className="p-4 flex-1">
                         <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <Users size={12}/> Elenco Atual
                         </h4>
                         {members.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {members.map(member => (
                                  <div key={member.id} className="flex items-center gap-3 bg-black/40 backdrop-blur-sm p-2 rounded border border-white/10 hover:bg-black/60 transition-colors">
                                     <div className="w-8 h-8 rounded bg-gray-800/80 flex items-center justify-center font-bold text-gray-500 text-xs">
                                        {member.name.charAt(0)}
                                     </div>
                                     <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-gray-200 truncate">{member.teamName}</p>
                                        <p className="text-xs text-gray-400 truncate">{member.name}</p>
                                     </div>
                                     {member.isManager && (
                                        <span className="ml-auto text-[10px] bg-blue-900/80 text-blue-200 px-1 rounded uppercase font-bold" title="Gestor">G</span>
                                     )}
                                  </div>
                               ))}
                            </div>
                         ) : (
                            <p className="text-sm text-gray-500 italic">Nenhum membro registrado.</p>
                         )}
                      </div>
                      
                      {/* Footer Section */}
                      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-center mt-auto">
                         <Button variant="ghost" className="text-xs w-full hover:bg-white/10" onClick={() => setCurrentPage('rankings')}>
                            Ver Performance no Ranking
                         </Button>
                      </div>

                  </div>
               </div>
             );
           })}
        </div>
    </div>
  );

  const LoginPage = () => (
    <div className="max-w-md mx-auto mt-10 animate-fadeIn">
      <div className="bg-gray-900/90 backdrop-blur p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-display font-bold text-white mb-2">
             {authMode === 'LOGIN' ? 'Acessar Conta' : 'Criar Conta'}
           </h2>
           <p className="text-gray-400 text-sm">
             {authMode === 'LOGIN' ? 'Bem-vindo de volta à Strongs Brazil.' : 'Junte-se à nossa comunidade.'}
           </p>
        </div>

        {loginError && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">
            {loginError}
          </div>
        )}

        {authMode === 'LOGIN' ? (
          <div className="space-y-4">
             <div>
               <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Usuário</label>
               <input 
                 className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                 value={loginUser}
                 onChange={e => setLoginUser(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleLogin()}
                 placeholder="Seu usuário"
               />
             </div>
             <div>
               <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Senha</label>
               <input 
                 type="password"
                 className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                 value={loginPass}
                 onChange={e => setLoginPass(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleLogin()}
                 placeholder="Sua senha"
               />
             </div>
             
             <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="keepConnected"
                  checked={keepConnected}
                  onChange={e => setKeepConnected(e.target.checked)}
                  className="mr-2 accent-strongs-gold h-4 w-4"
                />
                <label htmlFor="keepConnected" className="text-sm text-gray-400 cursor-pointer select-none">Manter conectado</label>
             </div>

             <Button fullWidth onClick={handleLogin} className="py-3 text-lg mt-2">Entrar</Button>
             
             <p className="text-center text-sm text-gray-500 mt-4">
               Não tem uma conta? <button onClick={() => { setAuthMode('REGISTER'); setLoginError(null); }} className="text-strongs-gold hover:underline font-bold">Cadastre-se</button>
             </p>
          </div>
        ) : (
          <div className="space-y-4">
             <div>
               <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nome de Exibição</label>
               <input 
                 className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                 value={registerName}
                 onChange={e => setRegisterName(e.target.value)}
                 placeholder="Ex: João Silva"
               />
             </div>
             <div>
               <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Usuário (Login)</label>
               <input 
                 className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                 value={registerUser}
                 onChange={e => setRegisterUser(e.target.value)}
                 placeholder="user123"
               />
             </div>
             <div>
               <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Senha</label>
               <input 
                 type="password"
                 className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                 value={registerPass}
                 onChange={e => setRegisterPass(e.target.value)}
                 placeholder="******"
               />
             </div>

             <Button fullWidth onClick={handleRegister} className="py-3 text-lg mt-2">Criar Conta</Button>
             
             <p className="text-center text-sm text-gray-500 mt-4">
               Já tem conta? <button onClick={() => { setAuthMode('LOGIN'); setLoginError(null); }} className="text-strongs-gold hover:underline font-bold">Faça Login</button>
             </p>
          </div>
        )}
      </div>
    </div>
  );

  const NewsDetailPage = () => {
    const post = data?.news.find(n => n.id === selectedNews);

    if (!post) return (
       <div className="text-center py-20">
          <h2 className="text-2xl text-white font-bold">Notícia não encontrada.</h2>
          <Button onClick={() => setCurrentPage('home')} className="mt-4">Voltar</Button>
       </div>
    );

    return (
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 animate-fadeIn">
         <div className="h-64 md:h-96 w-full relative">
            <img src={post.coverImage} className="w-full h-full object-cover" alt={post.title}/>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
               <Button onClick={() => setCurrentPage('home')} variant="ghost" className="text-white border-white/30 hover:bg-white/10 mb-4 text-xs">
                  ← Voltar para Início
               </Button>
               <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 leading-tight drop-shadow-lg">{post.title}</h1>
               <div className="flex items-center text-gray-300 text-sm">
                  <span className="bg-strongs-gold text-black px-2 py-0.5 rounded font-bold uppercase text-xs mr-3">Notícia</span>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
               </div>
            </div>
         </div>
         
         <div className="p-6 md:p-10">
            <div className="prose prose-invert prose-lg max-w-none text-gray-300">
               <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
         </div>
      </div>
    );
  };

  // Critical Error Screen (Connection Failed)
  if (errorMsg) {
    return (
        <div className="min-h-screen bg-strongs-darker flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-red-500 rounded-xl p-8 max-w-lg text-center shadow-2xl relative overflow-hidden">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
                
                <div className="relative z-10">
                    <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl text-white font-bold mb-4 font-display uppercase tracking-widest">Erro de Conexão</h1>
                    
                    <div className="bg-black/40 p-4 rounded-lg border border-red-900/50 mb-6 text-left">
                        <p className="text-red-200 text-sm font-mono break-words">
                            {errorMsg}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-gray-400 text-sm">
                            Possíveis causas:
                        </p>
                        <ul className="text-gray-500 text-xs text-left list-disc pl-5 space-y-1 mb-6">
                            <li>O serviço "Realtime Database" não foi criado no console do Firebase.</li>
                            <li>As Regras de Segurança estão bloqueando o acesso (não estão em modo teste).</li>
                            <li>As chaves de API estão incorretas.</li>
                            <li>Sua conexão com a internet caiu.</li>
                        </ul>
                    </div>

                    <Button onClick={() => window.location.reload()} variant="primary" className="w-full flex items-center justify-center gap-2">
                        <RefreshCw size={20} /> Tentar Novamente
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  // Loading Screen
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-strongs-darker flex items-center justify-center">
         <div className="text-center">
            <Loader2 size={64} className="text-strongs-gold animate-spin mb-4 mx-auto" />
            <p className="text-white font-display text-xl tracking-widest animate-pulse">CARREGANDO DADOS...</p>
         </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      onNavigate={setCurrentPage} 
      currentPage={currentPage}
      onLogout={handleLogout}
      confederations={data.confederations}
    >
      {/* Global Error Banner for Save Failures */}
      {saveError && (
          <div className="bg-red-900/90 text-white text-center p-2 fixed top-0 left-0 right-0 z-[60] animate-fadeIn border-b border-red-500">
             <AlertTriangle size={18} className="inline mr-2 mb-1"/> 
             {saveError}
             <button onClick={() => setSaveError(null)} className="ml-4 underline text-xs">Fechar</button>
          </div>
      )}

      {currentPage === 'home' && HomePage()}
      {currentPage === 'confederations' && <ConfederationsPage />}
      {currentPage === 'rankings' && <Rankings data={data} />}
      {currentPage === 'join-us' && <JoinUsPage />}
      {currentPage === 'admin' && currentUser && (
          <AdminPanel 
            data={data} 
            currentUser={currentUser} 
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onUpdateUsers={handleUpdateUsers}
            onDeleteUser={handleDeleteUser}
            onUpdateConfs={handleUpdateConfs}
            onUpdateNews={handleUpdateNews}
            onUpdateTop100={handleUpdateTop100}
            onUpdateJoinApps={handleUpdateJoinApps}
            onUpdateSeasons={handleUpdateSeasons}
            onUpdateSettings={handleUpdateSettings} // Pass new settings handler
            onResetDB={handleResetDB}
          />
      )}
      {currentPage === 'login' && LoginPage()}
      {currentPage === 'news-detail' && NewsDetailPage()}
    </Layout>
  );
};

export default App;