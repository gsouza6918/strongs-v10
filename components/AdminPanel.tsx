
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ReactQuill from 'react-quill'; // Importando o Editor Rico
import { AppData, User, UserRole, Member, Confederation, NewsPost, JoinApplication, ArchivedSeason, Top100Entry, GameResult, Attendance, GlobalSettings, ConfTier } from '../types';
import { Button } from './Button';
import { Trash2, ShieldCheck, ClipboardList, UserPlus, History, AlertOctagon, Users, Edit3, X, Save, CheckCircle2, XCircle, MinusCircle, UserMinus, UserCheck, Dumbbell, ArrowLeft, Settings, Lock, Plus, Power, Archive, AlertTriangle, FileEdit, Globe, EyeOff } from 'lucide-react';
import { loadData } from '../services/storage';

interface AdminPanelProps {
  data: AppData;
  currentUser: User;
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onUpdateUsers: (users: User[]) => void;
  onDeleteUser: (userId: string) => void; 
  onUpdateConfs: (confs: Confederation[]) => void;
  onUpdateNews: (news: NewsPost[]) => void;
  onUpdateTop100: (history: Top100Entry[]) => void;
  onUpdateJoinApps: (apps: JoinApplication[]) => void;
  onUpdateSeasons: (seasons: ArchivedSeason[]) => void;
  onUpdateSettings: (settings: GlobalSettings) => void;
  onResetDB: (fullData: AppData) => void;
}

// --- SUB-COMPONENTS ---

// 1. Modal for Editing/Creating a Confederation
const ConfEditor: React.FC<{
    conf: Confederation | null, // null means creating new
    onSave: (c: Confederation) => void,
    onClose: () => void
}> = ({ conf, onSave, onClose }) => {
    const [formData, setFormData] = useState<Confederation>(
        conf || { 
            id: '', 
            name: '', 
            tier: ConfTier.GOLD, 
            imageUrl: '', 
            active: true 
        }
    );

    const handleSubmit = () => {
        if (!formData.name) return alert("Nome é obrigatório");
        onSave(formData);
        onClose();
    };

    // Use Portal to break out of parent containers (specifically those with transform/animations)
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-900 w-full max-w-md rounded-xl border border-strongs-gold shadow-2xl flex flex-col p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-display text-2xl text-white uppercase tracking-wider mb-2">
                    {conf ? 'Editar Confederação' : 'Nova Confederação'}
                </h3>
                
                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Nome</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Tier (Nível)</label>
                    <select 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
                        value={formData.tier}
                        onChange={e => setFormData({...formData, tier: e.target.value as ConfTier})}
                    >
                        {Object.values(ConfTier).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">URL da Imagem (Logo/Fundo)</label>
                    <input 
                        className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white" 
                        value={formData.imageUrl || ''} 
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                        placeholder="https://..."
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                     <button 
                        onClick={() => setFormData({...formData, active: !formData.active})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.active ? 'bg-green-600' : 'bg-gray-600'}`}
                     >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                     <span className="text-sm text-gray-300 font-bold uppercase">
                         {formData.active ? 'Ativa' : 'Inativa'}
                     </span>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Salvar</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 2. New Modal Component for Editing a Member's Score
const MemberEditor: React.FC<{ 
    member: Member, 
    activeWeekSetting: number, 
    isOwner: boolean,
    onSave: (m: Member) => void, 
    onClose: () => void 
}> = ({ member, activeWeekSetting, isOwner, onSave, onClose }) => {
    const [editedMember, setEditedMember] = useState<Member>(JSON.parse(JSON.stringify(member))); // Deep copy
    // If not owner, force active week only? Let's allow browsing but maybe highlight active
    const [activeWeek, setActiveWeek] = useState(activeWeekSetting);

    const updateGame = (weekIdx: number, gameIdx: number, field: 'result' | 'attendance', value: any) => {
        const newWeeks = [...editedMember.weeks];
        if (!newWeeks[weekIdx]) newWeeks[weekIdx] = { games: [] };
        if (!newWeeks[weekIdx].games[gameIdx]) newWeeks[weekIdx].games[gameIdx] = { result: 'NONE', attendance: 'NONE' };
        
        newWeeks[weekIdx].games[gameIdx] = {
            ...newWeeks[weekIdx].games[gameIdx],
            [field]: value
        };

        setEditedMember({ ...editedMember, weeks: newWeeks });
    };

    const handleSave = () => {
        onSave(editedMember);
        onClose();
    };

    // Lock logic: Only Owner can edit past/future weeks. Managers/Mods locked to active week.
    const isWeekLocked = (weekIdx: number) => {
        if (isOwner) return false;
        return weekIdx !== activeWeekSetting;
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-strongs-gold shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div>
                        <h3 className="font-display text-2xl text-white uppercase tracking-wider">{editedMember.teamName}</h3>
                        <p className="text-gray-400 text-sm">{editedMember.name}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose}><X size={24}/></Button>
                </div>

                {/* Week Tabs */}
                <div className="flex border-b border-gray-700 bg-gray-900 overflow-x-auto">
                    {[0, 1, 2, 3].map(weekIdx => {
                        const locked = isWeekLocked(weekIdx);
                        return (
                            <button
                                key={weekIdx}
                                onClick={() => setActiveWeek(weekIdx)}
                                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                    activeWeek === weekIdx 
                                    ? 'border-strongs-gold text-strongs-gold bg-strongs-gold/10' 
                                    : locked
                                        ? 'border-transparent text-gray-600 cursor-not-allowed'
                                        : 'border-transparent text-gray-500 hover:text-white'
                                }`}
                            >
                                Semana {weekIdx + 1} {locked && <Lock size={12} className="inline ml-1"/>}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isWeekLocked(activeWeek) ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 py-10">
                            <Lock size={48} className="mb-4" />
                            <p className="uppercase font-bold tracking-widest">Semana Fechada para Edição</p>
                         </div>
                    ) : (
                        <div className="space-y-6">
                            {[0, 1, 2, 3].map(gameIdx => {
                                const game = editedMember.weeks[activeWeek]?.games[gameIdx] || { result: 'NONE', attendance: 'NONE' };
                                
                                return (
                                    <div key={gameIdx} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                        <div className="mb-2 text-xs text-strongs-gold font-bold uppercase tracking-widest">Jogo {gameIdx + 1}</div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Results */}
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Resultado</label>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'result', 'WIN')}
                                                        className={`flex-1 p-2 rounded text-xs font-bold border transition-all ${game.result === 'WIN' ? 'bg-green-600 text-white border-green-400' : 'bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        VITÓRIA
                                                    </button>
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'result', 'DRAW')}
                                                        className={`flex-1 p-2 rounded text-xs font-bold border transition-all ${game.result === 'DRAW' ? 'bg-gray-500 text-white border-gray-300' : 'bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        EMPATE
                                                    </button>
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'result', 'LOSS')}
                                                        className={`flex-1 p-2 rounded text-xs font-bold border transition-all ${game.result === 'LOSS' ? 'bg-red-600 text-white border-red-400' : 'bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        DERROTA
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Attendance */}
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Presença</label>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'attendance', 'PRESENT')}
                                                        title="Presente"
                                                        className={`flex-1 p-2 rounded flex items-center justify-center transition-all border ${game.attendance === 'PRESENT' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800 text-gray-600 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'attendance', 'ABSENT')}
                                                        title="Ausente"
                                                        className={`flex-1 p-2 rounded flex items-center justify-center transition-all border ${game.attendance === 'ABSENT' ? 'bg-yellow-600 text-white border-yellow-400' : 'bg-gray-800 text-gray-600 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'attendance', 'NO_TRAIN')}
                                                        title="Sem Treino (Penalidade)"
                                                        className={`flex-1 p-2 rounded flex items-center justify-center transition-all border ${game.attendance === 'NO_TRAIN' ? 'bg-red-800 text-white border-red-500' : 'bg-gray-800 text-gray-600 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        <Dumbbell size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateGame(activeWeek, gameIdx, 'attendance', 'NONE')}
                                                        title="Limpar"
                                                        className={`flex-1 p-2 rounded flex items-center justify-center transition-all border ${game.attendance === 'NONE' ? 'bg-gray-600 text-white border-gray-400' : 'bg-gray-800 text-gray-600 border-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        <MinusCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    {!isWeekLocked(activeWeek) && (
                         <Button onClick={handleSave} className="flex items-center gap-2">
                            <Save size={16} /> Salvar Alterações
                        </Button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// 3. Settings Component (For Owner to set Active Week)
const SettingsManagement: React.FC<{
    data: AppData,
    onUpdateSettings: (s: GlobalSettings) => void
}> = ({ data, onUpdateSettings }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl mx-auto">
            <h3 className="font-display text-2xl text-white mb-6 border-b border-gray-700 pb-2">Configurações Globais</h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-gray-400 font-bold uppercase tracking-wider mb-2">Semana Vigente (Edição Aberta)</label>
                    <div className="grid grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map(weekIdx => (
                            <button
                                key={weekIdx}
                                onClick={() => onUpdateSettings({ ...data.settings, activeWeek: weekIdx })}
                                className={`p-4 rounded border-2 transition-all ${
                                    data.settings.activeWeek === weekIdx
                                    ? 'bg-strongs-gold/20 border-strongs-gold text-white shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                                    : 'bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-800'
                                }`}
                            >
                                <span className="font-display text-xl block">Semana {weekIdx + 1}</span>
                                <span className="text-xs uppercase">
                                    {data.settings.activeWeek === weekIdx ? 'Aberta' : 'Fechada'}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        * Define qual semana os Gestores e Moderadores podem editar. O Dono sempre tem acesso total.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ... SeasonsManagement: New Component for Archiving Logic ...
const SeasonsManagement: React.FC<{
    data: AppData,
    onUpdateSeasons: (s: ArchivedSeason[]) => void,
    onSaveMember: (m: Member) => void // To reset members
}> = ({ data, onUpdateSeasons, onSaveMember }) => {
    const [seasonName, setSeasonName] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    const handleArchiveAndReset = () => {
        if (!seasonName) return alert("Digite um nome para a temporada (ex: Temporada 15)");

        // 1. Create Archive Snapshot
        const newArchive: ArchivedSeason = {
            id: Date.now().toString(),
            name: seasonName,
            date: new Date().toISOString(),
            members: JSON.parse(JSON.stringify(data.members)), // Deep copy
            confederations: JSON.parse(JSON.stringify(data.confederations)) // Deep copy
        };

        const updatedSeasons = [...data.archivedSeasons, newArchive];
        onUpdateSeasons(updatedSeasons);

        // 2. Reset Current Members (Clear Scores/Attendance)
        // Helper to create empty weeks
        const createEmptyWeeks = () => {
            return Array(4).fill(null).map(() => ({
                games: Array(4).fill(null).map(() => ({
                    result: 'NONE' as GameResult,
                    attendance: 'NONE' as Attendance
                }))
            }));
        };

        // Loop through all members and save the "reset" state
        // This relies on the parent's onSaveMember which likely updates Firebase individually
        data.members.forEach(member => {
            const cleanMember: Member = {
                ...member,
                weeks: createEmptyWeeks()
            };
            onSaveMember(cleanMember);
        });

        setSeasonName('');
        setIsConfirming(false);
        alert("Temporada arquivada e pontuações resetadas com sucesso!");
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="font-display text-2xl text-white mb-6 flex items-center gap-2">
                <Archive size={24} className="text-strongs-gold"/>
                Gerenciador de Temporadas
            </h3>

            {/* Current Season Actions */}
            <div className="bg-gray-900 border border-strongs-gold/30 p-6 rounded-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-lg text-white font-bold mb-2 uppercase tracking-wide">Finalizar Temporada Atual</h4>
                    <p className="text-gray-400 text-sm mb-4">
                        Isso irá salvar os dados atuais (Membros, Confederações e Pontuações) no histórico e 
                        <strong className="text-red-400 ml-1">zerar todas as pontuações</strong> dos membros atuais para iniciar uma nova.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:flex-1">
                            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Nome da Temporada para Salvar</label>
                            <input 
                                className="w-full bg-black/40 border border-gray-600 rounded p-3 text-white focus:border-strongs-gold outline-none"
                                placeholder="Ex: Janeiro 2024 - Temp 15"
                                value={seasonName}
                                onChange={e => setSeasonName(e.target.value)}
                            />
                        </div>
                        
                        {!isConfirming ? (
                            <Button onClick={() => setIsConfirming(true)} className="whitespace-nowrap h-[50px]">
                                Arquivar & Resetar
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-red-900/20 p-2 rounded border border-red-500/50 animate-fadeIn">
                                <span className="text-red-400 text-xs font-bold mr-2">Tem certeza? Isso zera os pontos!</span>
                                <Button variant="danger" onClick={handleArchiveAndReset} className="text-sm py-1 px-3">Sim, Confirmar</Button>
                                <Button variant="ghost" onClick={() => setIsConfirming(false)} className="text-sm py-1 px-3">Cancelar</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Archive List */}
            <div>
                <h4 className="text-gray-400 font-bold uppercase tracking-wider mb-4 text-sm border-b border-gray-700 pb-2">
                    Histórico Arquivado ({data.archivedSeasons.length})
                </h4>
                <div className="space-y-3">
                    {[...data.archivedSeasons].reverse().map(season => (
                        <div key={season.id} className="bg-gray-900 p-4 rounded border border-gray-700 flex justify-between items-center group hover:border-gray-500 transition-colors">
                            <div>
                                <h5 className="text-white font-bold text-lg">{season.name}</h5>
                                <p className="text-xs text-gray-500">Arquivado em: {new Date(season.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-400 text-sm block">{season.members.length} Membros</span>
                                <span className="text-gray-500 text-xs">{season.confederations.length} Confederações</span>
                            </div>
                        </div>
                    ))}
                    {data.archivedSeasons.length === 0 && (
                        <p className="text-center text-gray-500 italic py-4">Nenhuma temporada arquivada ainda.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (UserManagement stays similar) ...
const UserManagement: React.FC<{ 
    data: AppData, 
    currentUser: User, 
    onUpdateUsers: (users: User[]) => void,
    onDeleteUser: (userId: string) => void 
}> = ({ data, currentUser, onUpdateUsers, onDeleteUser }) => {
    const canManageUsers = ['ADMIN', 'OWNER', 'MOD'].includes(currentUser.role);
    const canDeleteUsers = ['ADMIN', 'OWNER'].includes(currentUser.role);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        const updated = data.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
        onUpdateUsers(updated);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-display text-2xl text-white mb-4 pl-2 border-l-4 border-strongs-gold">Gerenciar Usuários</h3>
            
            {/* Added solid background container for contrast against busy background image */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-strongs-gold uppercase bg-black/40 font-bold tracking-wider border-b border-gray-700">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Função</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {data.users.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors bg-gray-800/40">
                                    <td className="p-4 font-medium text-white">{user.username}</td>
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            className="bg-gray-950 border border-gray-600 rounded p-1.5 text-xs text-white focus:border-strongs-gold focus:ring-1 focus:ring-strongs-gold outline-none"
                                            disabled={(!canManageUsers) || (user.role === 'OWNER')}
                                        >
                                            {Object.values(UserRole).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-4 text-right">
                                        {canDeleteUsers && user.role !== 'OWNER' && (
                                            <button 
                                                onClick={() => onDeleteUser(user.id)}
                                                className="text-red-400 hover:text-white hover:bg-red-600 p-2 rounded transition-all"
                                                title="Excluir Usuário"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ... Refactored ConfManagement to use Modal and allow CRUD ...
const ConfManagement: React.FC<{ 
    data: AppData, 
    currentUser: User, 
    onSaveMember: (m: Member) => void, 
    onDeleteMember: (id: string) => void, 
    onUpdateConfs: (c: Confederation[]) => void,
    onUpdateUsers: (u: User[]) => void
}> = ({ data, currentUser, onSaveMember, onDeleteMember, onUpdateConfs }) => {
    const [selectedConfId, setSelectedConfId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editingConf, setEditingConf] = useState<Confederation | null>(null); // For edit modal
    
    // Member Create State
    const [newMemberName, setNewMemberName] = useState('');
    const [newTeamName, setNewTeamName] = useState('');

    const handleSaveConf = (conf: Confederation) => {
        let newConfs = [...data.confederations];
        if (conf.id) {
            // Edit existing
            const idx = newConfs.findIndex(c => c.id === conf.id);
            if (idx >= 0) newConfs[idx] = conf;
        } else {
            // Create new
            newConfs.push({ ...conf, id: Date.now().toString() });
        }
        onUpdateConfs(newConfs);
        setEditingConf(null);
    };

    const handleAddMember = () => {
        if (!selectedConfId || !newMemberName || !newTeamName) return;
        const newMember: Member = {
            id: Date.now().toString(),
            name: newMemberName,
            teamName: newTeamName,
            confId: selectedConfId,
            isManager: false,
            weeks: Array(4).fill(null).map(() => ({ games: Array(4).fill(null).map(() => ({ result: 'NONE' as GameResult, attendance: 'NONE' as Attendance })) }))
        };
        onSaveMember(newMember);
        setNewMemberName('');
        setNewTeamName('');
    };

    const selectedConfName = data.confederations.find(c => c.id === selectedConfId)?.name;
    const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(currentUser.role);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
             {/* Member Edit Modal */}
             {editingMember && (
                 <MemberEditor 
                    member={editingMember}
                    activeWeekSetting={data.settings?.activeWeek || 0}
                    isOwner={currentUser.role === 'OWNER'}
                    onSave={onSaveMember} 
                    onClose={() => setEditingMember(null)} 
                 />
             )}

             {/* Conf Create/Edit Modal */}
             {editingConf && (
                 <ConfEditor 
                    conf={editingConf.id ? editingConf : null}
                    onSave={handleSaveConf}
                    onClose={() => setEditingConf(null)}
                 />
             )}

             {/* Confederation List Column */}
             <div className={`bg-gray-800 p-4 rounded-lg md:col-span-1 border border-gray-700 ${selectedConfId ? 'hidden md:block' : 'block'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-xl text-white">Confederações</h3>
                    {isOwnerOrAdmin && (
                        <Button 
                            variant="ghost" 
                            className="p-1 px-2 text-xs border-dashed" 
                            onClick={() => setEditingConf({ id: '', name: '', tier: ConfTier.GOLD, imageUrl: '', active: true })}
                        >
                            <Plus size={14} className="mr-1 inline"/> Nova
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {data.confederations.map(conf => (
                        <div 
                            key={conf.id} 
                            className={`p-3 rounded border transition-colors relative group ${selectedConfId === conf.id ? 'border-strongs-gold bg-strongs-gold/10' : 'border-gray-700 hover:bg-gray-700'} ${!conf.active ? 'opacity-50' : ''}`}
                        >
                            <div 
                                onClick={() => setSelectedConfId(conf.id)}
                                className="flex justify-between items-center cursor-pointer"
                            >
                                <div>
                                    <span className="font-bold text-white uppercase tracking-wider block">{conf.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">{conf.tier}</span>
                                        {!conf.active && <span className="text-[10px] text-red-500 font-bold uppercase">Inativa</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Edit Button (Only for admins/owners) */}
                            {isOwnerOrAdmin && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingConf(conf); }}
                                    className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded hover:bg-gray-600"
                                >
                                    <Edit3 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
             </div>

             {/* Member List Column */}
             <div className={`bg-gray-800 p-4 rounded-lg md:col-span-2 border border-gray-700 ${selectedConfId ? 'block' : 'hidden md:block'}`}>
                {/* Mobile Back Button */}
                <div className="md:hidden mb-4 pb-4 border-b border-gray-700">
                    <button 
                        onClick={() => setSelectedConfId(null)}
                        className="flex items-center gap-2 text-strongs-gold font-bold uppercase tracking-wider text-sm"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>

                <h3 className="font-display text-xl text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-strongs-gold"/>
                    {selectedConfId ? `${selectedConfName}` : 'Selecione uma Confederação'}
                </h3>
                
                {selectedConfId ? (
                    <>
                        <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-gray-900/50 p-4 rounded border border-gray-700">
                            <input placeholder="Nome" className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                            <input placeholder="Time" className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                            <Button onClick={handleAddMember} className="text-xs whitespace-nowrap">Adicionar</Button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {data.members.filter(m => m.confId === selectedConfId).map(member => (
                                <div key={member.id} className="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-700">
                                    <div className="flex-grow min-w-0 pr-4">
                                        <div className="font-bold text-white text-base truncate">{member.teamName}</div>
                                        <div className="text-xs text-gray-500 truncate uppercase tracking-wider">{member.name}</div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button 
                                            variant="secondary" 
                                            className="p-2 h-10 w-10 flex items-center justify-center bg-blue-900/20 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" 
                                            onClick={() => setEditingMember(member)}
                                            title="Editar Resultados e Presença"
                                        >
                                            <Edit3 size={18}/>
                                        </Button>
                                        <Button variant="danger" className="p-2 h-10 w-10 flex items-center justify-center" onClick={() => onDeleteMember(member.id)}>
                                            <Trash2 size={18}/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {data.members.filter(m => m.confId === selectedConfId).length === 0 && (
                                <p className="text-center text-gray-500 italic py-10">Nenhum membro nesta confederação.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 italic min-h-[200px]">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p>Selecione uma confederação ao lado para gerenciar membros.</p>
                    </div>
                )}
             </div>
        </div>
    );
};

const NewsManagement: React.FC<{ data: AppData, onUpdateNews: (n: NewsPost[]) => void }> = ({ data, onUpdateNews }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [isPrivate, setIsPrivate] = useState(false); // New state for privacy
    const [editingId, setEditingId] = useState<string | null>(null);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    const handleSaveNews = () => {
        if (!title || !content) return alert("Título e Conteúdo são obrigatórios.");

        if (editingId) {
            // Updating existing news
            const updatedNewsList = data.news.map(n => {
                if (n.id === editingId) {
                    return {
                        ...n,
                        title,
                        content,
                        coverImage: coverImage || 'https://picsum.photos/seed/soccer/800/400',
                        isPrivate // Add private state
                    };
                }
                return n;
            });
            onUpdateNews(updatedNewsList);
            setEditingId(null);
        } else {
            // Creating new news
            const newPost: NewsPost = {
                id: Date.now().toString(),
                title,
                subject: 'Notícias',
                coverImage: coverImage || 'https://picsum.photos/seed/soccer/800/400',
                content,
                date: new Date().toISOString(),
                isPrivate // Add private state
            };
            onUpdateNews([newPost, ...data.news]);
        }
        
        setTitle('');
        setContent('');
        setCoverImage('');
        setIsPrivate(false);
    };

    const handleEditClick = (post: NewsPost) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setCoverImage(post.coverImage);
        setIsPrivate(post.isPrivate || false); // Load private state
        
        // Scroll to top of editor
        const editorElement = document.getElementById('news-editor-top');
        if(editorElement) editorElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setCoverImage('');
        setIsPrivate(false);
    };

    const handleDeleteNews = (id: string, e?: React.MouseEvent) => {
        // Stop bubbling if coming from a button click inside another element
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (window.confirm('Tem certeza que deseja excluir esta notícia permanentemente?')) {
            // Ensure ID comparison is safe (String vs Number)
            const updatedList = data.news.filter(x => String(x.id) !== String(id));
            onUpdateNews(updatedList);
            if (editingId === id) handleCancelEdit();
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
             <div id="news-editor-top" className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-display text-white flex items-center gap-2">
                    <ClipboardList className="text-strongs-gold"/> {editingId ? 'Editar Notícia' : 'Editor de Notícias'}
                 </h3>
                 {editingId && (
                     <Button variant="ghost" onClick={handleCancelEdit} className="text-xs">Cancelar Edição</Button>
                 )}
             </div>
             
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Título</label>
                        <input 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-strongs-gold outline-none" 
                            placeholder="Título da Notícia" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Visibilidade</label>
                        <button 
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={`w-full p-2 rounded border flex items-center justify-center gap-2 transition-all ${isPrivate ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}
                        >
                            {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                            <span className="font-bold uppercase text-sm">
                                {isPrivate ? 'Privada (Apenas Membros)' : 'Pública (Todos)'}
                            </span>
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Imagem de Capa (URL)</label>
                    <input 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-strongs-gold outline-none text-sm" 
                        placeholder="https://..." 
                        value={coverImage} 
                        onChange={e => setCoverImage(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Conteúdo</label>
                    <div className="bg-gray-900 rounded overflow-hidden border border-gray-600">
                        <ReactQuill 
                            theme="snow" 
                            value={content} 
                            onChange={setContent} 
                            modules={modules}
                            className="text-white min-h-[200px]"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    {editingId && <Button variant="ghost" onClick={handleCancelEdit} className="flex-1">Cancelar</Button>}
                    <Button onClick={handleSaveNews} fullWidth className="flex-1">
                        {editingId ? 'Salvar Alterações' : 'Publicar'}
                    </Button>
                </div>
             </div>

             <div className="mt-8 space-y-2">
                 <h4 className="text-gray-400 font-bold uppercase text-xs border-b border-gray-700 pb-2 mb-4">
                    Publicações Recentes
                 </h4>
                 {data.news.map(n => (
                     <div key={n.id} className={`bg-gray-900 p-2 rounded flex justify-between items-center border hover:border-gray-600 transition-all ${editingId === n.id ? 'border-strongs-gold bg-strongs-gold/5' : 'border-gray-800'}`}>
                         <div className="flex items-center gap-3 overflow-hidden">
                             <img src={n.coverImage} className="w-10 h-10 object-cover rounded bg-gray-800" alt="" />
                             <div className="flex flex-col min-w-0">
                                 <span className="text-white text-sm truncate font-bold">{n.title}</span>
                                 <span className="text-xs text-gray-500 flex items-center gap-1">
                                    {n.isPrivate ? <Lock size={10} className="text-red-400"/> : <Globe size={10} className="text-green-400"/>}
                                    {n.isPrivate ? 'Privada' : 'Pública'}
                                 </span>
                             </div>
                         </div>
                         <div className="flex gap-3">
                             <button 
                                type="button"
                                onClick={() => handleEditClick(n)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-strongs-darker bg-strongs-gold rounded hover:bg-yellow-400 transition-colors"
                             >
                                <Edit3 size={14} />
                                <span className="hidden sm:inline">Editar</span>
                             </button>
                             <button 
                                type="button"
                                onClick={(e) => handleDeleteNews(n.id, e)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600/20 border border-red-600/50 rounded hover:bg-red-600 hover:border-red-600 transition-all"
                             >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Excluir</span>
                             </button>
                         </div>
                     </div>
                 ))}
                 {data.news.length === 0 && <p className="text-gray-500 italic text-sm">Nenhuma notícia.</p>}
             </div>
        </div>
    );
};

// ... JoinRequestsManagement remains same logic, just styling update if needed ...
const JoinRequestsManagement: React.FC<{ data: AppData, onUpdateJoinApps: (a: JoinApplication[]) => void }> = ({ data, onUpdateJoinApps }) => {
    return (
        <div className="space-y-4">
             {data.joinApplications.map(app => (
                 <div key={app.id} className="bg-gray-800 p-4 rounded border-l-4 border-strongs-gold">
                     <div className="font-bold text-white">{app.name}</div>
                     <div className="text-gray-400 text-sm">{app.whatsapp}</div>
                     <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Greens: {app.greens}</span>
                        <span>Tokens: {app.tokens}</span>
                        <span>%: {app.teamPercentage}</span>
                     </div>
                 </div>
             ))}
             {data.joinApplications.length === 0 && <div className="text-gray-500">Nenhuma solicitação.</div>}
        </div>
    );
};

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'CONFS' | 'NEWS' | 'JOIN_APPS' | 'SEASONS' | 'CONFIG' | 'RESET'>('USERS');

  // Filter tabs for non-owners
  const isOwner = props.currentUser.role === 'OWNER';
  
  const tabs = [
    { id: 'USERS', icon: Users, label: 'Usuários' },
    { id: 'CONFS', icon: ShieldCheck, label: 'Confederações' },
    { id: 'NEWS', icon: ClipboardList, label: 'Notícias' },
    { id: 'JOIN_APPS', icon: UserPlus, label: 'Solicitações' },
    { id: 'SEASONS', icon: History, label: 'Arquivo' },
  ];

  if (isOwner) {
      tabs.push({ id: 'CONFIG', icon: Settings, label: 'Config' });
  }

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider">
          Painel Administrativo
        </h2>
        
        {/* Scrollable Tab Navigation for Mobile - Updated for better scrolling */}
        <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 bg-gray-900/50 p-2 rounded-xl border border-gray-800 w-full snap-x">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap snap-center ${
                        activeTab === tab.id 
                        ? 'bg-strongs-gold text-black shadow-lg shadow-strongs-gold/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="min-h-[500px]">
         {activeTab === 'USERS' && <UserManagement data={props.data} currentUser={props.currentUser} onUpdateUsers={props.onUpdateUsers} onDeleteUser={props.onDeleteUser} />}
         {activeTab === 'CONFS' && <ConfManagement data={props.data} currentUser={props.currentUser} onSaveMember={props.onSaveMember} onDeleteMember={props.onDeleteMember} onUpdateConfs={props.onUpdateConfs} onUpdateUsers={props.onUpdateUsers} />}
         {activeTab === 'NEWS' && <NewsManagement data={props.data} onUpdateNews={props.onUpdateNews} />}
         {activeTab === 'JOIN_APPS' && <JoinRequestsManagement data={props.data} onUpdateJoinApps={props.onUpdateJoinApps} />}
         {activeTab === 'SEASONS' && <SeasonsManagement data={props.data} onUpdateSeasons={props.onUpdateSeasons} onSaveMember={props.onSaveMember} />}
         {activeTab === 'CONFIG' && isOwner && <SettingsManagement data={props.data} onUpdateSettings={props.onUpdateSettings} />}
      </div>
    </div>
  );
};
