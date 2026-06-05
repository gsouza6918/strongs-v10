import React, { useState } from 'react';
import { TrainingSimulator } from './TrainingSimulator';
import { TeamSimulator } from './TeamSimulator';
import { Dumbbell, Users } from 'lucide-react';
import { User, SavedTraining } from '../types';

interface SimulatorPageProps {
  currentUser: User | null;
  data: any;
  onDataChange: (d: any) => void;
  onUpdateSavedTrainings: (trainings: SavedTraining[]) => Promise<void>;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ currentUser, data, onDataChange, onUpdateSavedTrainings }) => {
  const [activeTab, setActiveTab] = useState<'TREINOS' | 'EQUIPE'>('TREINOS');

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-1 w-full max-w-md mx-auto shadow-lg relative z-20">
        <button
          onClick={() => setActiveTab('TREINOS')}
          className={`flex-1 py-3 text-sm font-bold uppercase transition-all rounded-md flex items-center justify-center gap-2 ${
            activeTab === 'TREINOS'
              ? 'bg-strongs-gold text-strongs-darker shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-black/40'
          }`}
        >
          <Dumbbell size={18} /> Simulador de Treinos
        </button>
        <button
          onClick={() => setActiveTab('EQUIPE')}
          className={`flex-1 py-3 text-sm font-bold uppercase transition-all rounded-md flex items-center justify-center gap-2 ${
            activeTab === 'EQUIPE'
              ? 'bg-strongs-gold text-strongs-darker shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-black/40'
          }`}
        >
          <Users size={18} /> Simulador de Equipe
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'TREINOS' ? (
          <TrainingSimulator 
            currentUser={currentUser} 
            data={data} 
            onDataChange={onDataChange} 
            onUpdateSavedTrainings={onUpdateSavedTrainings} 
          />
        ) : (
          <TeamSimulator />
        )}
      </div>
    </div>
  );
};
