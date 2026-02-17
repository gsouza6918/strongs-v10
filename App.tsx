import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Rankings } from './components/Rankings';
import { AdminPanel } from './components/AdminPanel';
import { Button } from './components/Button';
import { AppData, UserRole, ConfTier, JoinApplication } from './types';
import { loadData } from './services/storage'; // We keep this just for DEFAULT_DATA structure
import { Trophy, ChevronRight, Lock, Users, Shield, UserPlus, Send, Briefcase, Coins, Percent, Smartphone, Star, Loader2, AlertTriangle, CheckSquare, RefreshCw } from 'lucide-react';

// Firebase Imports
import { db, isConfigured } from './services/firebase';
import { ref, onValue, set } from "firebase/database";

const App: React.FC = () => {
  // Initialize with minimal state, data will come from Firebase
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedNews, setSelectedNews] = useState<string | null>(null);

  // Auth State (Local session only)
  const [currentUser, setCurrentUser] = useState<AppData['currentUser']>(null);
  
  // Use a ref to track currentUser inside the Firebase callback closure
  // This prevents the user from being logged out when the database updates
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

  // 1. Connect to Firebase on Mount
  useEffect(() => {
    let unsubscribe = () => {};

    // Safety check for configuration
    if (!isConfigured) {
      setErrorMsg("O Firebase não está configurado. Verifique o arquivo services/firebase.ts.");
      setLoading(false);
      return;
    }

    if (!db) {
      setErrorMsg("Falha ao inicializar o banco de dados. Verifique as chaves no arquivo services/firebase.ts.");
      setLoading(false);
      return;
    }

    try {
        const dataRef = ref(db, 'strongs_db');
        
        // Timeout protection: if Firebase takes too long (e.g. firewall or bad rules), show error
        const timeoutId = setTimeout(() => {
            if (loading) { // logic here relies on closure, better to check if data is still null
                setLoading((currentLoading) => {
                    if (currentLoading) {
                        setErrorMsg("A conexão com o banco de dados está demorando muito. Verifique se o 'Realtime Database' está ativado e as Regras de Segurança estão em modo 'Teste'.");
                        return false; 
                    }
                    return currentLoading;
                });
            }
        }, 15000); // 15 seconds timeout

        // Listen for changes in the database
        unsubscribe = onValue(dataRef, (snapshot) => {
          clearTimeout(timeoutId); // Success, clear timeout
          const val = snapshot.val();
          const sessionUser = currentUserRef.current;

          if (val) {
            // CRITICAL FIX: Firebase strips empty arrays/keys. We must default them to [] 
            // to prevent "Cannot read properties of undefined (reading 'filter')" crashes.
            const safeData: AppData = {
                ...val,
                users: val.users || [],
                confederations: val.confederations || [],
                members: val.members || [],
                news: val.news || [],
                top100History: val.top100History || [],
                joinApplications: val.joinApplications || [],
                currentUser: sessionUser // Inject local session
            };

            // --- SESSION RESTORATION LOGIC ---
            // 1. If we have an active session user, update it with fresh data from DB
            if (sessionUser) {
                const freshUser = safeData.users.find(u => u.id === sessionUser.id);
                if (freshUser) safeData.currentUser = freshUser;
            } 
            // 2. If NO active session, check localStorage for "Keep me logged in" token
            else {
                const storedUid = localStorage.getItem('strongs_session_uid');
                if (storedUid) {
                    const restoredUser = safeData.users.find(u => u.id === storedUid);
                    if (restoredUser) {
                        safeData.currentUser = restoredUser;
                        currentUserRef.current = restoredUser; // Sync ref immediately
                    }
                }
            }

            setData(safeData);
          } else {
            // If Firebase is empty (first run), load default data and upload it
            const defaultData = loadData();
            set(dataRef, defaultData).catch(err => {
                console.error("Erro ao criar dados iniciais:", err);
                setErrorMsg("Erro ao criar dados iniciais: " + err.message);
            });
            setData(defaultData);
          }
          setLoading(false);
          setErrorMsg(null); // Clear any previous errors
        }, (error) => {
          clearTimeout(timeoutId);
          console.error("Firebase read error:", error);
          // Translate common errors
          let msg = error.message;
          if (msg.includes("permission_denied")) msg = "Permissão negada. Configure as Regras do Realtime Database para 'modo de teste' (leitura/escrita pública).";
          if (msg.includes("Client is offline")) msg = "Você está offline.";
          
          setErrorMsg(`Erro de conexão: ${msg}`);
          setLoading(false);
        });

    } catch (err: any) {
        console.error("Critical Firebase Error:", err);
        setErrorMsg("Erro crítico ao conectar: " + err.message);
        setLoading(false);
    }

    return () => unsubscribe();
  }, []); // Run once on mount

  // 2. Helper to update Data (Updates Local State + Sends to Firebase)
  const updateData = (newData: Partial<AppData>) => {
    if (!data) return;

    // Merge new data
    const updatedData = { ...data, ...newData };
    
    // Update Local State immediately (for UI responsiveness)
    setData(updatedData);

    // Update Session User if users list changed
    if (newData.users && currentUser) {
       const updatedSessionUser = newData.users.find(u => u.id === currentUser.id);
       if (updatedSessionUser) setCurrentUser(updatedSessionUser);
    }
    
    // Handle Session State (Current User login/logout)
    // We do NOT save 'currentUser' to Firebase, as that is per-browser session.
    if (newData.currentUser !== undefined) {
       setCurrentUser(newData.currentUser);
    }

    // PREPARE FOR FIREBASE SAVE
    // We strip 'currentUser' before saving to DB, because who is logged in is local info
    const { currentUser: _, ...dbPayload } = updatedData;
    
    // Save to Firebase ONLY if configured
    if (isConfigured && db) {
      set(ref(db, 'strongs_db'), dbPayload).catch(err => {
        console.error("Erro ao salvar no Firebase:", err);
        alert("Erro de conexão. Suas alterações podem não ter sido salvas.");
      });
    }
  };

  const handleLogin = () => {
    if (!data) return;
    const user = data.users.find(u => u.username === loginUser.trim() && u.password === loginPass);
    if (user) {
      updateData({ currentUser: user });
      
      // Handle "Keep me logged in"
      if (keepConnected) {
        localStorage.setItem('strongs_session_uid', user.id);
      } else {
        localStorage.removeItem('strongs_session_uid');
      }

      setCurrentPage('home');
    } else {
      alert("Credenciais inválidas");
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
      role: UserRole.USER // Default role
    };

    // Auto-login on register
    updateData({ users: [...data.users, newUser], currentUser: newUser });
    
    // Default to keep connected on register? Or adhere to checkbox? 
    // Usually simpler to just log them in for the session.
    // If you want persistence on register, uncomment below:
    // localStorage.setItem('strongs_session_uid', newUser.id);

    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('strongs_session_uid'); // Clear persistence
    updateData({ currentUser: null });
    setCurrentPage('login');
  };

  // --- PAGES ---

  const HomePage = () => (
    <div className="space-y-12">
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

      // Ensure joinApplications exists (legacy data protection)
      const currentApps = data?.joinApplications || [];
      updateData({ joinApplications: [...currentApps, app] });
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
      <div className="max-w-3xl mx-auto">
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

  const NewsDetailPage = () => {
    if (!data) return null;
    const post = data.news.find(n => n.id === selectedNews);
    if (!post) return <div>Notícia não encontrada</div>;

    const hasAccess = currentUser && ['MEMBER', 'MANAGER', 'MOD', 'ADMIN', 'OWNER'].includes(currentUser.role);

    return (
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="h-64 md:h-96 relative">
          <img src={post.coverImage} className="w-full h-full object-cover" alt={post.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 drop-shadow-md">{post.title}</h1>
            <p className="text-gray-300 text-lg">{post.subject}</p>
          </div>
        </div>
        
        <div className="p-8">
          {hasAccess ? (
            <div 
              className="prose prose-invert prose-lg max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center my-8">
              <Lock size={48} className="mx-auto text-strongs-gold mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Conteúdo Exclusivo</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Junte-se a nossa confederação e fique por dentro de nossas notícias e dicas a respeito do Top Eleven.
              </p>
              <Button onClick={() => setCurrentPage('login')}>Fazer Login / Cadastro</Button>
            </div>
          )}
          <div className="mt-8 pt-8 border-t border-gray-800">
             <Button variant="ghost" onClick={() => setCurrentPage('home')}>Voltar para Início</Button>
          </div>
        </div>
      </div>
    );
  };

  const ConfederationsPage = () => {
    if (!data) return null;
    // Filter active confs
    const activeConfs = data.confederations.filter(c => c.active !== false);

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
             <Users className="inline mr-2 text-strongs-gold" size={32} />
             Nossas <span className="text-strongs-gold">Confederações</span>
          </h2>
          <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeConfs.map(conf => {
            const members = data.members.filter(m => m.confId === conf.id);
            
            return (
              <div key={conf.id} className="bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden hover:border-strongs-gold/50 transition-all duration-300 shadow-xl group">
                <div className="p-6 bg-gradient-to-b from-gray-800 to-gray-900 relative">
                   {/* Background Tier Badge */}
                   <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        conf.tier === ConfTier.SUPREME ? 'bg-purple-900 text-purple-200' :
                        conf.tier === ConfTier.DIAMOND ? 'bg-blue-900 text-blue-200' :
                        conf.tier === ConfTier.PLATINUM ? 'bg-slate-600 text-white' :
                        'bg-yellow-900 text-yellow-200'
                      }`}>{conf.tier}</span>
                   </div>

                   <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-gray-600 mb-4 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-strongs-gold transition-colors">
                        {conf.imageUrl ? (
                          <img src={conf.imageUrl} alt={conf.name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield size={40} className="text-gray-600" />
                        )}
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white text-center">{conf.name}</h3>
                      <p className="text-sm text-gray-400">{members.length} / 6 Membros</p>
                   </div>
                </div>
                
                <div className="p-4 bg-black/20 border-t border-gray-800">
                  <h4 className="text-xs font-bold text-strongs-gold uppercase mb-3 tracking-wider">Membros do Time</h4>
                  <div className="space-y-2">
                    {members.length > 0 ? members.map(member => (
                      <div key={member.id} className="flex justify-between items-center text-sm p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors">
                        <span className="font-bold text-gray-200">{member.name}</span>
                        <span className="text-xs text-gray-500">{member.teamName}</span>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-gray-600 italic text-sm">Nenhum membro registrado</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const LoginPage = () => (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-strongs-gold rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-2xl border-4 border-gray-800 shadow-lg">SB</div>
           <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest">
             {authMode === 'LOGIN' ? 'Área de Membros' : 'Criar Conta'}
           </h2>
        </div>

        {authMode === 'LOGIN' ? (
          <div className="space-y-4">
            <input 
              className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
              placeholder="Usuário"
              value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
            />
            <input 
              type="password"
              className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
              placeholder="Senha"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
            />
            
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    id="keepConnected"
                    checked={keepConnected}
                    onChange={(e) => setKeepConnected(e.target.checked)}
                    className="mr-2 w-4 h-4 accent-strongs-gold cursor-pointer"
                />
                <label htmlFor="keepConnected" className="text-gray-400 text-sm cursor-pointer select-none">
                    Mantenha-me conectado
                </label>
            </div>

            <Button fullWidth onClick={handleLogin} className="py-3 text-lg">Entrar</Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Não tem conta? <button onClick={() => setAuthMode('REGISTER')} className="text-strongs-gold hover:underline">Cadastre-se</button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
              placeholder="Nome de Exibição"
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
            />
            <input 
              className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
              placeholder="Usuário"
              value={registerUser}
              onChange={e => setRegisterUser(e.target.value)}
            />
            <input 
              type="password"
              className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none transition-colors"
              placeholder="Senha"
              value={registerPass}
              onChange={e => setRegisterPass(e.target.value)}
            />
            <Button fullWidth onClick={handleRegister} className="py-3 text-lg">Criar Conta</Button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Já tem conta? <button onClick={() => setAuthMode('LOGIN')} className="text-strongs-gold hover:underline">Faça Login</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );

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
      {currentPage === 'home' && HomePage()}
      {currentPage === 'confederations' && <ConfederationsPage />}
      {currentPage === 'rankings' && <Rankings data={data} />}
      {currentPage === 'join-us' && <JoinUsPage />}
      {currentPage === 'admin' && currentUser && <AdminPanel data={data} currentUser={currentUser} onUpdateData={updateData} />}
      {currentPage === 'login' && LoginPage()}
      {currentPage === 'news-detail' && NewsDetailPage()}
    </Layout>
  );
};

export default App;