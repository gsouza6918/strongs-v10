import React, { useState } from 'react';
import { EspionagemEntry } from '../types';
import { Button } from './Button';
import { Trash2, Plus, Trophy, Edit3, Save, X } from 'lucide-react';

interface EspionagemManagementProps {
  data: EspionagemEntry[];
  onUpdate: (data: EspionagemEntry[]) => void;
}

export const EspionagemManagement: React.FC<EspionagemManagementProps> = ({ data, onUpdate }) => {
  const [newEntry, setNewEntry] = useState<Partial<EspionagemEntry>>({
    confederationName: '',
    tag: '',
    wins: 0,
    draws: 0,
    losses: 0,
    team1: '',
    points: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EspionagemEntry>>({});

  const handleAdd = () => {
    if (!newEntry.confederationName || !newEntry.team1) {
      alert('Por favor, preencha o nome da confederação e o time 1.');
      return;
    }

    const entry: EspionagemEntry = {
      id: Math.random().toString(36).substr(2, 9),
      confederationName: newEntry.confederationName,
      tag: newEntry.tag || '',
      wins: Number(newEntry.wins) || 0,
      draws: Number(newEntry.draws) || 0,
      losses: Number(newEntry.losses) || 0,
      team1: newEntry.team1,
      points: Number(newEntry.points) || 0
    };

    onUpdate([...data, entry]);
    setNewEntry({
      confederationName: '',
      tag: '',
      wins: 0,
      draws: 0,
      losses: 0,
      team1: '',
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
    if (!editData.confederationName || !editData.team1) {
      alert('Por favor, preencha o nome da confederação e o time 1.');
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
          team1: editData.team1 || '',
          points: Number(editData.points) || 0
        };
      }
      return e;
    });

    onUpdate(updatedData);
    setEditingId(null);
    setEditData({});
  };

  const sortedData = [...data].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="text-strongs-gold" /> Adicionar Registro de Espionagem
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
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
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Vitórias</label>
            <input 
              type="number"
              value={newEntry.wins}
              onChange={e => setNewEntry({...newEntry, wins: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Empates</label>
            <input 
              type="number"
              value={newEntry.draws}
              onChange={e => setNewEntry({...newEntry, draws: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Derrotas</label>
            <input 
              type="number"
              value={newEntry.losses}
              onChange={e => setNewEntry({...newEntry, losses: Number(e.target.value)})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Time 1</label>
            <input 
              type="text"
              value={newEntry.team1}
              onChange={e => setNewEntry({...newEntry, team1: e.target.value})}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white"
              placeholder="Resultados"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Pontos</label>
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

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="text-strongs-gold" /> Tabela de Espionagem
          </h3>
          <span className="text-sm text-gray-400">{sortedData.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3 font-bold">Pos</th>
                <th className="px-4 py-3 font-bold">Confederação</th>
                <th className="px-4 py-3 font-bold">Tag</th>
                <th className="px-4 py-3 font-bold text-center">V</th>
                <th className="px-4 py-3 font-bold text-center">E</th>
                <th className="px-4 py-3 font-bold text-center">D</th>
                <th className="px-4 py-3 font-bold">Time 1</th>
                <th className="px-4 py-3 font-bold text-center text-strongs-gold">Pontos</th>
                <th className="px-4 py-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedData.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-500">{index + 1}º</td>
                  
                  {editingId === entry.id ? (
                    <>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={editData.confederationName} 
                          onChange={e => setEditData({...editData, confederationName: e.target.value})}
                          className="w-full bg-black/40 border border-gray-600 rounded p-1 text-white text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={editData.tag} 
                          onChange={e => setEditData({...editData, tag: e.target.value})}
                          className="w-full bg-black/40 border border-gray-600 rounded p-1 text-white text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={editData.wins} 
                          onChange={e => setEditData({...editData, wins: Number(e.target.value)})}
                          className="w-16 bg-black/40 border border-gray-600 rounded p-1 text-white text-sm text-center mx-auto block"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={editData.draws} 
                          onChange={e => setEditData({...editData, draws: Number(e.target.value)})}
                          className="w-16 bg-black/40 border border-gray-600 rounded p-1 text-white text-sm text-center mx-auto block"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={editData.losses} 
                          onChange={e => setEditData({...editData, losses: Number(e.target.value)})}
                          className="w-16 bg-black/40 border border-gray-600 rounded p-1 text-white text-sm text-center mx-auto block"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="text" 
                          value={editData.team1} 
                          onChange={e => setEditData({...editData, team1: e.target.value})}
                          className="w-full bg-black/40 border border-gray-600 rounded p-1 text-white text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          value={editData.points} 
                          onChange={e => setEditData({...editData, points: Number(e.target.value)})}
                          className="w-20 bg-black/40 border border-gray-600 rounded p-1 text-white text-sm text-center mx-auto block"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="primary" onClick={saveEdit} className="p-2">
                            <Save size={16} />
                          </Button>
                          <Button variant="ghost" onClick={cancelEdit} className="p-2">
                            <X size={16} />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-bold text-white">{entry.confederationName}</td>
                      <td className="px-4 py-3 text-gray-400">{entry.tag || '-'}</td>
                      <td className="px-4 py-3 text-center text-green-400">{entry.wins}</td>
                      <td className="px-4 py-3 text-center text-yellow-400">{entry.draws}</td>
                      <td className="px-4 py-3 text-center text-red-400">{entry.losses}</td>
                      <td className="px-4 py-3">{entry.team1}</td>
                      <td className="px-4 py-3 text-center font-bold text-strongs-gold text-lg">{entry.points}</td>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 italic">
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
};
