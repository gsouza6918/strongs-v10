import React, { useState } from 'react';
import { AppData, User, SavedTraining, TIER_ICONS, TIER_LABELS } from '../types';
import { Dumbbell, Trash2, Play, Search, Target } from 'lucide-react';
import { saveData } from '../services/storage';

interface SavedTrainingsManagementProps {
  data: AppData;
  currentUser: User;
  onUpdateData: (data: AppData) => void;
  onUpdateSavedTrainings?: (trainings: SavedTraining[]) => void;
}

export const SavedTrainingsManagement: React.FC<SavedTrainingsManagementProps> = ({ data, currentUser, onUpdateData, onUpdateSavedTrainings }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const userTrainings = (data.savedTrainings || []).filter(t => t.userId === currentUser.id);
  
  const filteredTrainings = userTrainings.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.positions.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este treino salvo?')) {
      const newSavedTrainings = (data.savedTrainings || []).filter(t => t.id !== id);
      const updatedData = {
        ...data,
        savedTrainings: newSavedTrainings
      };
      await saveData(updatedData);
      onUpdateData(updatedData);
      if (onUpdateSavedTrainings) {
        onUpdateSavedTrainings(newSavedTrainings);
      }
    }
  };

  const handleLoad = (training: SavedTraining) => {
    localStorage.setItem('loadTraining', JSON.stringify(training));
    window.location.href = '/simulador';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-strongs-gold" /> Meus Treinos Salvos
          </h2>
          <p className="text-gray-400 text-sm">Gerencie os treinos que você salvou no simulador.</p>
        </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou posição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-strongs-gold outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-12 bg-black/30 rounded-lg border border-gray-800">
              <Dumbbell className="mx-auto text-gray-600 mb-3" size={48} />
              <p className="text-gray-400">Nenhum treino salvo encontrado.</p>
              <p className="text-sm text-gray-500 mt-1">Vá até o Simulador para criar e salvar seus treinos.</p>
            </div>
          ) : (
            filteredTrainings.map(training => (
              <div key={training.id} className="bg-black/50 border border-gray-700 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-strongs-gold/50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{training.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-strongs-gold bg-strongs-gold/10 px-2 py-0.5 rounded">
                      <Target size={14} /> {training.positions.join(', ')}
                    </span>
                    {training.tier && training.tier !== 'NONE' && (
                      <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded text-white">
                        <img 
                          src={TIER_ICONS[training.tier]} 
                          alt={TIER_LABELS[training.tier]} 
                          className="w-4 h-4 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        {TIER_LABELS[training.tier]}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {training.drillSteps.length} etapas de treino
                    </span>
                    <span className="text-gray-500 text-xs">
                      Salvo em: {new Date(training.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Mini Log Preview */}
                  <div className="mt-3 pl-3 border-l-2 border-gray-700 space-y-1">
                    {training.drillSteps.slice(0, 3).map((step, idx) => (
                      <div key={idx} className="text-xs text-gray-400">
                        <span className="text-white">{step.count}x</span> {step.drillName}
                      </div>
                    ))}
                    {training.drillSteps.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        + {training.drillSteps.length - 3} etapas...
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleLoad(training)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-strongs-gold text-strongs-darker px-4 py-2 rounded font-bold hover:bg-yellow-400 transition-colors"
                  >
                    <Play size={16} /> Carregar
                  </button>
                  <button
                    onClick={() => handleDelete(training.id)}
                    className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
