import React, { useState, useMemo } from 'react';
import { AppData, User, UserRole, ConfTier, Member, Confederation, GameResult, Attendance, NewsPost, JoinApplication } from '../types';
import { Button } from './Button';
import { Trash2, Edit, Plus, UserPlus, ShieldCheck, ChevronDown, ChevronUp, Save, Check, Trophy, XCircle, ImageIcon, ClipboardList, CheckCircle2, Clock, ExternalLink, Power, PowerOff } from 'lucide-react';
import ReactQuill from 'react-quill';

interface AdminPanelProps {
  data: AppData;
  currentUser: User;
  onUpdateData: (newData: Partial<AppData>) => void;
}

// --- EXTRACTED COMPONENTS ---

const UserManagement: React.FC<{data: AppData, currentUser: User, onUpdateData: (d: Partial<AppData>) => void}> = ({data, currentUser, onUpdateData}) => {
    const canManageUsers = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        const updatedUsers = data.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
        onUpdateData({ users: updatedUsers });
    };

    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-display text-white border-b border-gray-700 pb-2">Gerenciar Usuários</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800 text-gray-200 uppercase font-bold">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Usuário</th>
                <th className="p-3">Cargo Atual</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.id} className={`border-b border-gray-800 hover:bg-white/5 ${user.role === 'OWNER' ? 'bg-yellow-900/10' : ''}`}>
                  <td className="p-3 font-medium text-white">{user.name} {user.role === 'OWNER' && '👑'}</td>
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.role === 'OWNER' ? 'bg-strongs-gold text-black' :
                      user.role === 'ADMIN' ? 'bg-red-900 text-red-200' :
                      user.role === 'MEMBER' ? 'bg-green-900 text-green-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-3">
                    {user.role !== 'OWNER' && canManageUsers && (
                      <select 
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      >
                        <option value={UserRole.USER}>Usuário</option>
                        <option value={UserRole.MEMBER}>Membro</option>
                        <option value={UserRole.MANAGER}>Gestor</option>
                        <option value={UserRole.MOD}>Moderador</option>
                        {currentUser.role === 'OWNER' && <option value={UserRole.ADMIN}>Admin</option>}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
};

const ConfManagement: React.FC<{data: AppData, currentUser: User, onUpdateData: (d: Partial<AppData>) => void}> = ({data, currentUser, onUpdateData}) => {
    const canManageConfs = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);

    const [newConfName, setNewConfName] = useState('');
    const [newConfImage, setNewConfImage] = useState('');
    const [newConfTier, setNewConfTier] = useState<ConfTier>(ConfTier.GOLD);
    const [newConfActive, setNewConfActive] = useState(true);
    const [editingConfId, setEditingConfId] = useState<string | null>(null);
    const [expandedConf, setExpandedConf] = useState<string | null>(null);

    // Member creation state
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberTeam, setNewMemberTeam] = useState('');
    const [newMemberLinkUser, setNewMemberLinkUser] = useState('');

    const handleSaveConf = () => {
      if (!newConfName) return;

      if (editingConfId) {
          // Update existing
          const updatedConfs = data.confederations.map(c => 
              c.id === editingConfId 
              ? { ...c, name: newConfName, tier: newConfTier, imageUrl: newConfImage || undefined, active: newConfActive }
              : c
          );
          onUpdateData({ confederations: updatedConfs });
          setEditingConfId(null);
      } else {
          // Create new
          const newConf: Confederation = {
            id: Math.random().toString(36).substr(2, 9),
            name: newConfName,
            tier: newConfTier,
            imageUrl: newConfImage || undefined,
            active: newConfActive
          };
          onUpdateData({ confederations: [...data.confederations, newConf] });
      }
      setNewConfName('');
      setNewConfImage('');
      setNewConfTier(ConfTier.GOLD);
      setNewConfActive(true);
    };

    const startEditConf = (conf: Confederation) => {
        setNewConfName(conf.name);
        setNewConfImage(conf.imageUrl || '');
        setNewConfTier(conf.tier);
        setNewConfActive(conf.active !== false); // Handle legacy undefined as true
        setEditingConfId(conf.id);
        // Collapse others or scroll to top? Just set state.
    };

    const cancelEdit = () => {
        setNewConfName('');
        setNewConfImage('');
        setNewConfTier(ConfTier.GOLD);
        setNewConfActive(true);
        setEditingConfId(null);
    };

    const handleDeleteConf = (id: string) => {
      if(!window.confirm("Tem certeza? Isso apagará todos os membros desta confederação.")) return;
      onUpdateData({ 
        confederations: data.confederations.filter(c => c.id !== id),
        members: data.members.filter(m => m.confId !== id)
      });
      if (editingConfId === id) cancelEdit();
    };

    const handleAddMember = (confId: string) => {
      const currentCount = data.members.filter(m => m.confId === confId).length;
      if (currentCount >= 6) {
        alert("Limite de 6 membros atingido.");
        return;
      }
      if (!newMemberName || !newMemberTeam) {
        alert("Nome e Time são obrigatórios");
        return;
      }

      // Init empty weeks structure
      const emptyGames = Array(4).fill(null).map(() => ({ result: 'NONE' as GameResult, attendance: 'NONE' as Attendance }));
      const emptyWeeks = Array(4).fill(null).map(() => ({ games: [...emptyGames] }));

      const newMember: Member = {
        id: Math.random().toString(36).substr(2, 9),
        confId,
        name: newMemberName,
        teamName: newMemberTeam,
        isManager: false,
        linkedUserId: newMemberLinkUser || undefined,
        weeks: emptyWeeks
      };

      // If linked user, update user role to MEMBER if they are just USER
      let updatedUsers = data.users;
      if (newMemberLinkUser) {
        updatedUsers = data.users.map(u => 
          u.id === newMemberLinkUser && u.role === 'USER' 
            ? { ...u, role: UserRole.MEMBER, linkedMemberId: newMember.id } 
            : u.id === newMemberLinkUser ? { ...u, linkedMemberId: newMember.id } : u
        );
      }

      onUpdateData({ 
        members: [...data.members, newMember],
        users: updatedUsers
      });
      
      setNewMemberName('');
      setNewMemberTeam('');
      setNewMemberLinkUser('');
    };

    const toggleManager = (memberId: string) => {
       const updatedMembers = data.members.map(m => m.id === memberId ? { ...m, isManager: !m.isManager } : m);
       // Also update User role if linked
       const member = data.members.find(m => m.id === memberId);
       let updatedUsers = data.users;
       if (member && member.linkedUserId) {
         updatedUsers = data.users.map(u => {
           if (u.id === member.linkedUserId) {
             const newRole = !member.isManager ? UserRole.MANAGER : UserRole.MEMBER;
             if ((!member.isManager && u.role === UserRole.MEMBER) || (member.isManager && u.role === UserRole.MANAGER)) {
               return { ...u, role: newRole };
             }
           }
           return u;
         });
       }

       onUpdateData({ members: updatedMembers, users: updatedUsers });
    };

    const updateScore = (memberId: string, weekIdx: number, gameIdx: number, field: 'result' | 'attendance', value: string) => {
      const updatedMembers = data.members.map(m => {
        if (m.id !== memberId) return m;
        const newWeeks = [...m.weeks];
        if(!newWeeks[weekIdx]) newWeeks[weekIdx] = { games: Array(4).fill({result: 'NONE', attendance: 'NONE'}) };
        const newGames = [...newWeeks[weekIdx].games];
        newGames[gameIdx] = { ...newGames[gameIdx], [field]: value };
        newWeeks[weekIdx] = { ...newWeeks[weekIdx], games: newGames };
        return { ...m, weeks: newWeeks };
      });
      onUpdateData({ members: updatedMembers });
    };

    const availableUsers = data.users.filter(u => !u.linkedMemberId);

    // Sort confederations: Active first, then Inactive
    const sortedConfs = [...data.confederations].sort((a, b) => {
        if (a.active === b.active) return 0;
        return a.active ? -1 : 1;
    });

    return (
      <div className="space-y-6">
        {/* Only show creation/edit panel for Admins/Mods */}
        {canManageConfs && (
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white">{editingConfId ? 'Editar Confederação' : 'Nova Confederação'}</h4>
                {editingConfId && <Button variant="ghost" onClick={cancelEdit} className="text-xs py-1 flex items-center gap-1"><XCircle size={14}/> Cancelar</Button>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <input 
                    className={`bg-gray-900 border border-gray-600 rounded p-2 text-white flex-grow ${editingConfId ? 'border-strongs-gold ring-1 ring-strongs-gold' : ''}`}
                    placeholder="Nome da Confederação"
                    value={newConfName}
                    onChange={(e) => setNewConfName(e.target.value)}
                  />
                  <select 
                    className="bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    value={newConfTier}
                    onChange={(e) => setNewConfTier(e.target.value as ConfTier)}
                  >
                    {Object.values(ConfTier).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded px-3">
                     <label className="text-gray-300 text-sm font-bold cursor-pointer select-none flex items-center">
                        <input 
                            type="checkbox" 
                            checked={newConfActive} 
                            onChange={e => setNewConfActive(e.target.checked)}
                            className="mr-2 h-4 w-4 accent-strongs-gold"
                        />
                        {newConfActive ? <span className="text-green-400">Ativa</span> : <span className="text-red-400">Inativa</span>}
                     </label>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <div className="flex-grow relative w-full">
                    <ImageIcon className="absolute left-2 top-2.5 text-gray-500" size={16}/>
                    <input 
                      className="bg-gray-900 border border-gray-600 rounded p-2 pl-8 text-white w-full"
                      placeholder="URL da Imagem/Logo (Opcional)"
                      value={newConfImage}
                      onChange={(e) => setNewConfImage(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveConf} className="md:w-32">
                      {editingConfId ? <><Save size={16} className="inline mr-1"/> Salvar</> : 'Criar'}
                  </Button>
                </div>
              </div>
            </div>
        )}

        <div className="space-y-4">
          {sortedConfs.map(conf => {
            const isExpanded = expandedConf === conf.id;
            const members = data.members.filter(m => m.confId === conf.id);
            const userIsManager = currentUser.linkedMemberId && members.find(m => m.id === currentUser.linkedMemberId && m.isManager);
            const hasEditAccess = canManageConfs || userIsManager;
            const isEditing = editingConfId === conf.id;
            const isActive = conf.active !== false;

            return (
              <div key={conf.id} className={`bg-gray-900/80 border rounded-lg overflow-hidden ${isEditing ? 'border-strongs-gold ring-1 ring-strongs-gold' : 'border-gray-700'} ${!isActive ? 'opacity-60 grayscale' : ''}`}>
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer bg-gray-800 hover:bg-gray-750"
                  onClick={() => setExpandedConf(isExpanded ? null : conf.id)}
                >
                  <div className="flex items-center gap-4">
                    {conf.imageUrl && (
                      <img src={conf.imageUrl} alt={conf.name} className="w-10 h-10 object-contain rounded-full bg-gray-900 border border-gray-600"/>
                    )}
                    <div>
                      <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                          {conf.name} 
                          <span className="text-xs text-gray-400 font-sans bg-gray-700 px-1 rounded">{conf.tier}</span>
                          {!isActive && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded flex items-center gap-1"><PowerOff size={10}/> Inativa</span>}
                      </h3>
                      <p className="text-xs text-gray-400">{members.length}/6 Membros</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManageConfs && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startEditConf(conf); }} className="text-blue-400 p-2 hover:bg-blue-900/20 rounded" title="Editar"><Edit size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteConf(conf.id); }} className="text-red-500 p-2 hover:bg-red-900/20 rounded" title="Excluir"><Trash2 size={16}/></button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-strongs-gold"/> : <ChevronDown size={20} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-700 space-y-6">
                    {!isActive && (
                        <div className="bg-red-900/20 border border-red-500/50 p-2 rounded text-center text-red-300 text-sm mb-4">
                            Esta confederação está inativa e não pode receber novos membros.
                        </div>
                    )}
                    {canManageConfs && members.length < 6 && isActive && (
                      <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                        <p className="text-xs uppercase text-strongs-gold font-bold mb-2">Adicionar Membro</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input placeholder="Nome" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white"/>
                          <input placeholder="Time" value={newMemberTeam} onChange={e => setNewMemberTeam(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 text-sm text-white"/>
                          <select value={newMemberLinkUser} onChange={e => setNewMemberLinkUser(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 text-sm text-gray-300">
                            <option value="">Vincular Usuário (Opcional)</option>
                            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                          </select>
                          <Button variant="secondary" onClick={() => handleAddMember(conf.id)} className="text-sm py-1">Adicionar</Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {members.map(member => (
                        <div key={member.id} className="border border-gray-700 rounded bg-black/20 p-3">
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700/50">
                            <div>
                               <span className="font-bold text-white text-lg">{member.name}</span>
                               <span className="text-gray-400 text-sm ml-2">({member.teamName})</span>
                               {member.isManager && <span className="ml-2 bg-blue-900 text-blue-200 text-xs px-1 rounded">GESTOR</span>}
                            </div>
                            <div className="flex space-x-2">
                               {canManageConfs && (
                                   <Button 
                                    variant="ghost" 
                                    className="text-xs py-0.5 px-2"
                                    onClick={() => toggleManager(member.id)}
                                   >
                                     {member.isManager ? 'Remover Gestor' : 'Tornar Gestor'}
                                   </Button>
                               )}
                               {canManageConfs && (
                                 <button onClick={() => {
                                   if(window.confirm('Remover membro?')) {
                                     onUpdateData({ members: data.members.filter(m => m.id !== member.id) });
                                   }
                                 }} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                               )}
                            </div>
                          </div>

                          {hasEditAccess && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-gray-300">
                                <thead>
                                  <tr>
                                    <th className="p-1 text-left w-16 text-strongs-gold">Semana</th>
                                    <th className="p-1 text-center">Jogo 1</th>
                                    <th className="p-1 text-center">Jogo 2</th>
                                    <th className="p-1 text-center">Jogo 3</th>
                                    <th className="p-1 text-center">Jogo 4</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[0, 1, 2, 3].map(weekIdx => (
                                    <tr key={weekIdx} className="border-b border-gray-800">
                                      <td className="p-1 font-bold">SEM {weekIdx + 1}</td>
                                      {[0, 1, 2, 3].map(gameIdx => {
                                          const game = member.weeks[weekIdx]?.games[gameIdx] || { result: 'NONE', attendance: 'NONE' };
                                          return (
                                            <td key={gameIdx} className="p-1 min-w-[140px]">
                                              <div className="flex flex-col gap-1">
                                                <select 
                                                  value={game.result}
                                                  onChange={(e) => updateScore(member.id, weekIdx, gameIdx, 'result', e.target.value)}
                                                  className={`rounded p-1 text-xs border border-gray-600 bg-gray-900 text-white ${game.result === 'WIN' ? 'border-green-500 text-green-400' : game.result === 'LOSS' ? 'border-red-500 text-red-400' : ''}`}
                                                >
                                                  <option value="NONE">- Res -</option>
                                                  <option value="WIN">Venceu (+3)</option>
                                                  <option value="DRAW">Empatou (+1)</option>
                                                  <option value="LOSS">Perdeu (0)</option>
                                                </select>
                                                <select
                                                  value={game.attendance}
                                                  onChange={(e) => updateScore(member.id, weekIdx, gameIdx, 'attendance', e.target.value)}
                                                  className="bg-gray-800 border border-gray-600 rounded p-1 text-xs text-gray-300"
                                                >
                                                  <option value="NONE">- Pres -</option>
                                                  <option value="PRESENT">Presente (+3)</option>
                                                  <option value="ABSENT">Ausente (+1)</option>
                                                  <option value="NO_TRAIN">N/ Treino (-6)</option>
                                                </select>
                                              </div>
                                            </td>
                                          );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
};

const NewsManagement: React.FC<{data: AppData, onUpdateData: (d: Partial<AppData>) => void}> = ({data, onUpdateData}) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [image, setImage] = useState('');
    const [content, setContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const modules = useMemo(() => ({
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image', 'video'],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ],
    }), []);

    const handleSave = () => {
      if(!title || !content) return alert("Título e conteúdo obrigatórios");
      
      if (editingId) {
        const updatedNews = data.news.map(n => n.id === editingId ? {
            ...n,
            title,
            subject,
            coverImage: image || 'https://picsum.photos/800/400',
            content
        } : n);
        onUpdateData({ news: updatedNews });
        alert("Notícia atualizada!");
      } else {
        const post: NewsPost = {
          id: Date.now().toString(),
          title,
          subject,
          coverImage: image || 'https://picsum.photos/800/400',
          content,
          date: new Date().toISOString()
        };
        onUpdateData({ news: [post, ...data.news] });
        alert("Notícia publicada!");
      }
      resetForm();
    };

    const resetForm = () => {
        setTitle(''); setSubject(''); setImage(''); setContent('');
        setEditingId(null);
    };

    const startEdit = (post: NewsPost) => {
        setTitle(post.title);
        setSubject(post.subject);
        setImage(post.coverImage);
        setContent(post.content);
        setEditingId(post.id);
    };

    const deleteNews = (id: string) => {
        if(window.confirm('Apagar notícia?')) {
            onUpdateData({ news: data.news.filter(n => n.id !== id) });
            if (editingId === id) resetForm();
        }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col h-full">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Notícia' : 'Nova Notícia'}</h3>
               {editingId && <Button variant="ghost" onClick={resetForm} className="text-xs flex items-center gap-1"><XCircle size={14}/> Cancelar Edição</Button>}
           </div>
           
           <div className="space-y-4 flex-grow">
             <input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Título da Notícia" value={title} onChange={e => setTitle(e.target.value)} />
             <input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Assunto (Resumo)" value={subject} onChange={e => setSubject(e.target.value)} />
             <input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="URL da Imagem de Capa" value={image} onChange={e => setImage(e.target.value)} />
             <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">Conteúdo (Editor Avançado)</label>
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder="Escreva sua notícia aqui... Você pode colar imagens!"
                    className="text-white"
                  />
                </div>
             </div>
             <Button fullWidth onClick={handleSave} className="mt-4">
                {editingId ? <><Save size={16} className="inline mr-2"/> Salvar Alterações</> : 'Publicar Notícia'}
             </Button>
           </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
           <h3 className="text-xl font-bold text-white mb-4">Gerenciar Notícias</h3>
           <div className="space-y-3 max-h-[600px] overflow-y-auto">
             {data.news.map(post => (
               <div key={post.id} className={`flex justify-between items-start bg-gray-900 p-3 rounded border ${editingId === post.id ? 'border-strongs-gold ring-1 ring-strongs-gold' : 'border-gray-600'}`}>
                 <div>
                   <h4 className="font-bold text-strongs-gold">{post.title}</h4>
                   <p className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</p>
                 </div>
                 <div className="flex space-x-2">
                    <button onClick={() => startEdit(post)} className="text-blue-400 hover:text-blue-300 p-1 bg-blue-900/20 rounded" title="Editar"><Edit size={16}/></button>
                    <button onClick={() => deleteNews(post.id)} className="text-red-500 hover:text-red-400 p-1 bg-red-900/20 rounded" title="Excluir"><Trash2 size={16}/></button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
};

const Top100Management: React.FC<{data: AppData, onUpdateData: (d: Partial<AppData>) => void}> = ({data, onUpdateData}) => {
    const [selectedConf, setSelectedConf] = useState('');
    const [season, setSeason] = useState('');
    const [rank, setRank] = useState<number>(1);

    const handleAddHistory = () => {
      if (!selectedConf || !season || !rank) return;
      const parsedRank = parseInt(rank.toString());
      if (parsedRank < 1 || parsedRank > 100) return alert("Rank deve ser entre 1 e 100");

      const entry: any = {
        id: Date.now().toString(),
        confId: selectedConf,
        season,
        rank: parsedRank,
        points: 0, 
        bonus: 0,
        dateAdded: new Date().toISOString()
      };
      
      onUpdateData({ top100History: [...data.top100History, entry] });
      setSeason('');
      setRank(1);
    };

    return (
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Trophy className="text-strongs-gold"/> Registrar Top 100</h3>
        <div className="space-y-4">
           <div>
             <label className="text-sm text-gray-400">Confederação</label>
             <select className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" value={selectedConf} onChange={e => setSelectedConf(e.target.value)}>
               <option value="">Selecione...</option>
               {data.confederations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           </div>
           <div>
             <label className="text-sm text-gray-400">Temporada</label>
             <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" value={season} onChange={e => setSeason(e.target.value)} />
           </div>
           <div>
             <label className="text-sm text-gray-400">Colocação (1-100)</label>
             <input type="number" min="1" max="100" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" value={rank} onChange={e => setRank(parseInt(e.target.value))} />
           </div>
           <Button fullWidth onClick={handleAddHistory}>Adicionar Registro</Button>
        </div>

        <div className="mt-8">
          <h4 className="text-sm uppercase font-bold text-gray-500 mb-2">Últimos Registros</h4>
          <div className="space-y-2">
            {data.top100History.slice(-5).reverse().map(h => {
               const conf = data.confederations.find(c => c.id === h.confId);
               return (
                 <div key={h.id} className="text-xs bg-gray-900 p-2 rounded flex justify-between text-gray-300">
                   <span>{conf?.name || 'Unknown'} - T{h.season}</span>
                   <span className="text-strongs-gold font-bold">#{h.rank}</span>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    );
};

const JoinRequestsManagement: React.FC<{data: AppData, onUpdateData: (d: Partial<AppData>) => void}> = ({data, onUpdateData}) => {
    const pendingApps = data.joinApplications?.filter(a => a.status === 'PENDING') || [];
    const answeredApps = data.joinApplications?.filter(a => a.status === 'ANSWERED') || [];

    const toggleStatus = (id: string) => {
        const updatedApps = data.joinApplications.map(app => 
            app.id === id ? { ...app, status: app.status === 'PENDING' ? 'ANSWERED' : 'PENDING' as any } : app
        );
        onUpdateData({ joinApplications: updatedApps });
    };

    const renderList = (apps: JoinApplication[], isPending: boolean) => (
        <div className="space-y-3">
            {apps.length === 0 && <p className="text-gray-500 italic text-sm">Nenhuma solicitação nesta lista.</p>}
            {apps.map(app => (
                <div key={app.id} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${isPending ? 'border-yellow-500' : 'border-green-500'} flex flex-col md:flex-row justify-between gap-4`}>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-lg">{app.name}</h4>
                            <span className="text-xs text-gray-500 bg-gray-900 px-2 rounded">{new Date(app.date).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                            <div><span className="text-strongs-gold font-bold">Maletas:</span> {app.greens}</div>
                            <div><span className="text-strongs-gold font-bold">Tokens:</span> {app.tokens}</div>
                            <div><span className="text-strongs-gold font-bold">Time:</span> {app.teamPercentage}%</div>
                            <div><span className="text-strongs-gold font-bold">Atributados:</span> {app.hasAttributedPlayers ? `Sim (${app.attributedPlayersCount})` : 'Não'}</div>
                            <div className="col-span-2 md:col-span-1">
                              <span className="text-strongs-gold font-bold">WhatsApp:</span>{' '}
                              <a 
                                href={`https://wa.me/55${app.whatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-green-400 hover:underline transition-colors"
                              >
                                {app.whatsapp}
                              </a>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button 
                            variant={isPending ? 'secondary' : 'ghost'} 
                            onClick={() => toggleStatus(app.id)}
                            className="text-xs whitespace-nowrap"
                        >
                           {isPending ? <><CheckCircle2 size={16} className="mr-1 inline"/> Marcar Respondido</> : <><Clock size={16} className="mr-1 inline"/> Marcar Pendente</>}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="text-yellow-500"/> Aguardando Resposta ({pendingApps.length})
                </h3>
                {renderList(pendingApps, true)}
            </div>
            <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-600"/> Respondidas ({answeredApps.length})
                </h3>
                {renderList(answeredApps, false)}
            </div>
        </div>
    );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ data, currentUser, onUpdateData }) => {
  const [activeSection, setActiveSection] = useState<'USERS' | 'CONFS' | 'NEWS' | 'TOP100' | 'REQUESTS'>('USERS');

  const canManageConfs = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);
  const canManageUsers = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);
  const canManageNews = ['ADMIN', 'OWNER'].includes(currentUser.role);
  const canManageTop100 = ['ADMIN', 'OWNER'].includes(currentUser.role);
  const canManageRequests = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);
  
  // Manager specific access control
  const canViewConfs = ['ADMIN', 'OWNER', 'MOD', 'MANAGER'].includes(currentUser.role);

  return (
    <div className="bg-gray-900/90 backdrop-blur rounded-xl p-6 shadow-2xl">
      <h2 className="text-3xl font-display font-bold text-white mb-6 flex items-center gap-2">
        <ShieldCheck className="text-strongs-gold" size={32}/> Painel Administrativo
      </h2>

      {/* Admin Nav */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-4">
        {canManageUsers && (
          <Button variant={activeSection === 'USERS' ? 'primary' : 'ghost'} onClick={() => setActiveSection('USERS')}>
            <UserPlus size={18} className="mr-2 inline"/> Usuários
          </Button>
        )}
        {canViewConfs && (
          <Button variant={activeSection === 'CONFS' ? 'primary' : 'ghost'} onClick={() => setActiveSection('CONFS')}>
            <ShieldCheck size={18} className="mr-2 inline"/> Confederações
          </Button>
        )}
        {canManageNews && (
          <Button variant={activeSection === 'NEWS' ? 'primary' : 'ghost'} onClick={() => setActiveSection('NEWS')}>
            <Edit size={18} className="mr-2 inline"/> Notícias
          </Button>
        )}
        {canManageTop100 && (
          <Button variant={activeSection === 'TOP100' ? 'primary' : 'ghost'} onClick={() => setActiveSection('TOP100')}>
            <Trophy size={18} className="mr-2 inline"/> Histórico Top 100
          </Button>
        )}
        {canManageRequests && (
          <Button variant={activeSection === 'REQUESTS' ? 'primary' : 'ghost'} onClick={() => setActiveSection('REQUESTS')}>
            <ClipboardList size={18} className="mr-2 inline"/> Solicitações
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div>
        {activeSection === 'USERS' && canManageUsers && <UserManagement data={data} currentUser={currentUser} onUpdateData={onUpdateData} />}
        {activeSection === 'CONFS' && canViewConfs && <ConfManagement data={data} currentUser={currentUser} onUpdateData={onUpdateData} />}
        {activeSection === 'NEWS' && canManageNews && <NewsManagement data={data} onUpdateData={onUpdateData} />}
        {activeSection === 'TOP100' && canManageTop100 && <Top100Management data={data} onUpdateData={onUpdateData} />}
        {activeSection === 'REQUESTS' && canManageRequests && <JoinRequestsManagement data={data} onUpdateData={onUpdateData} />}
      </div>
    </div>
  );
};