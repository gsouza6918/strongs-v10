import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { EspionagemEntry } from '../types';
import { Button } from './Button';
import { Trash2, Plus, Trophy, Edit3, Save, X, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface EspionagemManagementProps {
  data: EspionagemEntry[];
  onUpdate: (data: EspionagemEntry[]) => void;
}

export const EspionagemManagement: React.FC<EspionagemManagementProps> = ({ data, onUpdate }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<EspionagemEntry>>({
    confederationName: '',
    tag: '',
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EspionagemEntry>>({});

  const calcCurrentPoints = (e: Partial<EspionagemEntry>) => {
    let p = (e.currentWins || 0) * 12 + (e.currentDraws || 0) * 4;
    (e.team1Placements || []).forEach(val => {
      if (val === 1) p += 120;
      else if (val === 2) p += 80;
      else if (val === 3) p += 40;
      else if (val === 4) p += 20;
    });
    (e.resultadoSemanal || []).forEach(val => {
      if (val === 1) p += 120;
      else if (val === 2) p += 80;
      else if (val === 3) p += 40;
      else if (val === 4) p += 20;
    });
    return p;
  };

  const calcLostPoints = (e: Partial<EspionagemEntry>) => {
    let l = (e.currentDraws || 0) * 8 + (e.currentLosses || 0) * 12;
    (e.team1Placements || []).forEach(val => {
      if (val === 2) l += 40;
      else if (val === 3) l += 80;
      else if (val === 4) l += 100;
    });
    (e.resultadoSemanal || []).forEach(val => {
      if (val === 2) l += 40;
      else if (val === 3) l += 80;
      else if (val === 4) l += 100;
    });
    return l;
  };

  const handleAdd = () => {
    if (!newEntry.confederationName) {
      alert('Por favor, preencha o nome da confederação.');
      return;
    }

    const entry: EspionagemEntry = {
      id: Math.random().toString(36).substr(2, 9),
      confederationName: newEntry.confederationName,
      tag: newEntry.tag || '',
      wins: Number(newEntry.wins) || 0,
      draws: Number(newEntry.draws) || 0,
      losses: Number(newEntry.losses) || 0,
      team1: '',
      points: Number(newEntry.points) || 0,
      currentWins: 0,
      currentDraws: 0,
      currentLosses: 0,
      team1Placements: [null, null, null, null],
      resultadoSemanal: [null, null, null, null]
    };

    onUpdate([...data, entry]);
    setNewEntry({
      confederationName: '',
      tag: '',
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
      onUpdate(data.filter(e => e.id !== id));
    }
  };

  const startEdit = (entry: EspionagemEntry) => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = () => {
    if (!editData.confederationName) {
      alert('Por favor, preencha o nome da confederação.');
      return;
    }

    const updatedData = data.map(e => {
      if (e.id === editingId) {
        return {
          ...e,
          confederationName: editData.confederationName || '',
          tag: editData.tag || '',
          wins: Number(editData.wins) || 0,
          draws: Number(editData.draws) || 0,
          losses: Number(editData.losses) || 0,
          points: Number(editData.points) || 0
        };
      }
      return e;
    });

    onUpdate(updatedData);
    setEditingId(null);
    setEditData({});
  };

  const handleIncrement = (id: string, field: 'currentWins' | 'currentDraws' | 'currentLosses', delta: number) => {
    onUpdate(data.map(entry => {
      if (entry.id === id) {
        const val = (entry[field] || 0) + delta;
        if (val < 0) return entry; // Not allowing negative current stats
        
        let histField: 'wins' | 'draws' | 'losses' = 'wins';
        if (field === 'currentDraws') histField = 'draws';
        if (field === 'currentLosses') histField = 'losses';

        return { 
          ...entry, 
          [field]: val,
          [histField]: Math.max(0, (entry[histField] || 0) + delta)
        };
      }
      return entry;
    }));
  };

  const handlePlacementChange = (id: string, index: number, value: string) => {
    onUpdate(data.map(entry => {
      if (entry.id === id) {
        const placements = [...(entry.team1Placements || [null, null, null, null])];
        placements[index] = value ? parseInt(value) as 1|2|3|4 : null;
        return { ...entry, team1Placements: placements };
      }
      return entry;
    }));
  };

  const handleResultadoSemanalChange = (id: string, index: number, value: string) => {
    onUpdate(data.map(entry => {
      if (entry.id === id) {
        const placements = [...(entry.resultadoSemanal || [null, null, null, null])];
        placements[index] = value ? parseInt(value) as 1|2|3|4 : null;
        return { ...entry, resultadoSemanal: placements };
      }
      return entry;
    }));
  };

  const handleSeasonReset = () => {
    if (window.confirm("ATENÇÃO: Você irá somar a pontuação da temporada atual ao histórico e ZERAR a temporada atual. As vitórias, empates e derrotas já foram contabilizadas no histórico em tempo real. Deseja prosseguir?")) {
      onUpdate(data.map(entry => {
        const curPoints = calcCurrentPoints(entry);
        
        return {
          ...entry,
          points: (entry.points || 0) + curPoints,
          currentWins: 0,
          currentDraws: 0,
          currentLosses: 0,
          team1Placements: [null, null, null, null],
          resultadoSemanal: [null, null, null, null]
        };
      }));
    }
  };

  const getTotalPoints = (entry: EspionagemEntry) => (entry.points || 0) + calcCurrentPoints(entry);

  const sortedData = [...data].sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

  const content = (
    <div className={`space-y-6 animate-fadeIn ${isFullScreen ? 'fixed inset-0 z-50 bg-black/95 p-4 overflow-y-auto' : ''}`}>
      {!isFullScreen && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="text-strongs-gold" /> Adicionar Registro de Espionagem
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Confederação</label>
            <input 
              type="text"
              value={newEntry.confederationName}
              onChange={e => setNewEntry({...newEntry, confederationName: e.target.value})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
              placeholder="Nome da Confederação"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Tag</label>
            <input 
              type="text"
              value={newEntry.tag}
              onChange={e => setNewEntry({...newEntry, tag: e.target.value})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
              placeholder="#00000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Vitórias (Histórico)</label>
            <input 
              type="number"
              value={newEntry.wins}
              onChange={e => setNewEntry({...newEntry, wins: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Empates (Histórico)</label>
            <input 
              type="number"
              value={newEntry.draws}
              onChange={e => setNewEntry({...newEntry, draws: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Derrotas (Histórico)</label>
            <input 
              type="number"
              value={newEntry.losses}
              onChange={e => setNewEntry({...newEntry, losses: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Pontos (Histórico)</label>
            <input 
              type="number"
              value={newEntry.points}
              onChange={e => setNewEntry({...newEntry, points: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">Adicionar Registro</Button>
      </div>

      )}

      <div className={`bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden ${isFullScreen ? 'min-h-[90vh]' : ''}`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20 flex-wrap gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="text-strongs-gold" /> Tabela de Espionagem
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{sortedData.length} registros</span>
            <Button variant="danger" className="text-xs px-3 py-1" onClick={handleSeasonReset}>
              <RefreshCw size={14} className="mr-1 inline" /> Zerar Temporada
            </Button>
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)} 
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300 min-w-max">
            <thead className="bg-gray-800/50 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-3 py-3 font-bold border-r border-gray-700" rowSpan={2}>Pos</th>
                <th className="px-4 py-3 font-bold border-r border-gray-700" rowSpan={2}>Confederação</th>
                <th className="px-2 py-2 font-bold text-center border-r border-gray-700 border-b" colSpan={3}>Histórico</th>
                <th className="px-2 py-2 font-bold text-center border-r border-gray-700 border-b" colSpan={3}>Temporada Atual</th>
                <th className="px-3 py-3 font-bold text-center border-r border-gray-700" rowSpan={2}>Time 1</th>
                <th className="px-3 py-3 font-bold text-center border-r border-gray-700" rowSpan={2}>Resultado Semanal</th>
                <th className="px-3 py-3 font-bold text-center border-r border-gray-700 text-strongs-gold" rowSpan={2}>Pontos<br/>Totais</th>
                <th className="px-3 py-3 font-bold text-center border-r border-gray-700 text-red-500" rowSpan={2}>Pontos<br/>Perdidos</th>
                <th className="px-4 py-3 font-bold text-right" rowSpan={2}>Ações</th>
              </tr>
              <tr>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-green-500">V</th>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-yellow-500">E</th>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-red-500">D</th>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-green-500">V</th>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-yellow-500">E</th>
                <th className="px-2 py-1 font-bold text-center border-r border-gray-700 text-red-500">D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedData.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-3 font-bold text-gray-500 border-r border-gray-800">{index + 1}º</td>
                  
                  {editingId === entry.id ? (
                    // EDIT MODE
                    <>
                      <td className="px-2 py-2 border-r border-gray-800">
                        <input type="text" value={editData.confederationName} onChange={e => setEditData({...editData, confederationName: e.target.value})} className="w-full bg-black/40 border border-gray-600 rounded p-1 text-white text-sm mb-1" placeholder="Conf" />
                        <input type="text" value={editData.tag} onChange={e => setEditData({...editData, tag: e.target.value})} className="w-full bg-black/40 border border-gray-600 rounded p-1 text-white text-xs" placeholder="Tag" />
                      </td>
                      <td className="px-1 py-2 border-r border-gray-800 text-center"><input type="number" value={editData.wins} onChange={e => setEditData({...editData, wins: Number(e.target.value)})} className="w-12 bg-black/40 border border-gray-600 rounded p-1 text-white text-xs text-center mx-auto block" /></td>
                      <td className="px-1 py-2 border-r border-gray-800 text-center"><input type="number" value={editData.draws} onChange={e => setEditData({...editData, draws: Number(e.target.value)})} className="w-12 bg-black/40 border border-gray-600 rounded p-1 text-white text-xs text-center mx-auto block" /></td>
                      <td className="px-1 py-2 border-r border-gray-800 text-center"><input type="number" value={editData.losses} onChange={e => setEditData({...editData, losses: Number(e.target.value)})} className="w-12 bg-black/40 border border-gray-600 rounded p-1 text-white text-xs text-center mx-auto block" /></td>
                      <td colSpan={3} className="px-2 py-2 border-r border-gray-800 text-center text-xs text-gray-500">Utilize a visão normal para editar</td>
                      <td className="px-2 py-2 border-r border-gray-800 text-center text-xs text-gray-500">Utilize a visão normal para editar</td>
                      <td className="px-2 py-2 border-r border-gray-800 text-center text-xs text-gray-500">Utilize a visão normal para editar</td>
                      <td className="px-1 py-2 border-r border-gray-800 text-center"><input type="number" value={editData.points} onChange={e => setEditData({...editData, points: Number(e.target.value)})} className="w-16 bg-black/40 border border-gray-600 rounded p-1 text-white text-xs text-center mx-auto block" title="Pontos Históricos" /></td>
                      <td className="px-2 py-2 border-r border-gray-800 text-center text-xs text-gray-500">-</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="primary" onClick={saveEdit} className="p-1 px-2"><Save size={14} /></Button>
                          <Button variant="ghost" onClick={cancelEdit} className="p-1 px-2"><X size={14} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // VIEW MODE
                    <>
                      <td className="px-3 py-3 border-r border-gray-800 min-w-32">
                        <div className="font-bold text-white">{entry.confederationName}</div>
                        <div className="text-xs text-gray-500">{entry.tag || '-'}</div>
                      </td>
                      <td className="px-2 py-3 text-center border-r border-gray-800 text-gray-400">{entry.wins || 0}</td>
                      <td className="px-2 py-3 text-center border-r border-gray-800 text-gray-400">{entry.draws || 0}</td>
                      <td className="px-2 py-3 text-center border-r border-gray-800 text-gray-400">{entry.losses || 0}</td>
                      
                      {/* Current Season V/E/D */}
                      <td className="px-1 py-2 text-center border-r border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleIncrement(entry.id, 'currentWins', -1)} className="text-gray-500 hover:text-white px-1 leading-none font-bold text-lg">-</button>
                          <span className="w-4 font-bold text-green-400">{entry.currentWins || 0}</span>
                          <button onClick={() => handleIncrement(entry.id, 'currentWins', 1)} className="text-gray-500 hover:text-green-500 px-1 leading-none font-bold text-lg">+</button>
                        </div>
                      </td>
                      <td className="px-1 py-2 text-center border-r border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleIncrement(entry.id, 'currentDraws', -1)} className="text-gray-500 hover:text-white px-1 leading-none font-bold text-lg">-</button>
                          <span className="w-4 font-bold text-yellow-400">{entry.currentDraws || 0}</span>
                          <button onClick={() => handleIncrement(entry.id, 'currentDraws', 1)} className="text-gray-500 hover:text-yellow-500 px-1 leading-none font-bold text-lg">+</button>
                        </div>
                      </td>
                      <td className="px-1 py-2 text-center border-r border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleIncrement(entry.id, 'currentLosses', -1)} className="text-gray-500 hover:text-white px-1 leading-none font-bold text-lg">-</button>
                          <span className="w-4 font-bold text-red-400">{entry.currentLosses || 0}</span>
                          <button onClick={() => handleIncrement(entry.id, 'currentLosses', 1)} className="text-gray-500 hover:text-red-500 px-1 leading-none font-bold text-lg">+</button>
                        </div>
                      </td>

                      <td className="px-2 py-3 border-r border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          {[0, 1, 2, 3].map(i => (
                            <select 
                              key={i}
                              value={entry.team1Placements?.[i] || ''}
                              onChange={(e) => handlePlacementChange(entry.id, i, e.target.value)}
                              className="bg-black/50 border border-gray-600 rounded text-xs text-white p-0.5 outline-none cursor-pointer hover:border-gray-500 appearance-none text-center min-w-8"
                            >
                              <option value="">-</option>
                              <option value="1">1º</option>
                              <option value="2">2º</option>
                              <option value="3">3º</option>
                              <option value="4">4º</option>
                            </select>
                          ))}
                        </div>
                      </td>

                      <td className="px-2 py-3 border-r border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          {[0, 1, 2, 3].map(i => (
                            <select 
                              key={`res_${i}`}
                              value={entry.resultadoSemanal?.[i] || ''}
                              onChange={(e) => handleResultadoSemanalChange(entry.id, i, e.target.value)}
                              className="bg-black/50 border border-gray-600 rounded text-xs text-white p-0.5 outline-none cursor-pointer hover:border-gray-500 appearance-none text-center min-w-8"
                            >
                              <option value="">-</option>
                              <option value="1">1º</option>
                              <option value="2">2º</option>
                              <option value="3">3º</option>
                              <option value="4">4º</option>
                            </select>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center border-r border-gray-800">
                        <div className="font-bold text-strongs-gold text-base">{getTotalPoints(entry)}</div>
                        {(calcCurrentPoints(entry) > 0) && <div className="text-[10px] text-green-400">+{calcCurrentPoints(entry)} na temp.</div>}
                      </td>

                      <td className="px-3 py-3 text-center border-r border-gray-800">
                        <div className="font-bold text-red-500 text-base">{calcLostPoints(entry)}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" onClick={() => startEdit(entry)} className="p-2 text-gray-400 hover:text-white">
                            <Edit3 size={16} />
                          </Button>
                          <Button variant="danger" onClick={() => handleDelete(entry.id)} className="p-2">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500 italic">
                    Nenhum registro de espionagem encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return isFullScreen ? createPortal(content, document.body) : content;
};
