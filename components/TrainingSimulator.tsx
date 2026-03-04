import React, { useState, useMemo, useEffect } from 'react';
import { Save, Target, List } from 'lucide-react';
import { User, SavedTraining, Position, PlayerTier, TIER_ICONS, TIER_LABELS } from '../types';
import { saveData } from '../services/storage';

const POSITIONS: Position[] = ['NONE', 'GK', 'DL/DR', 'DC', 'DMC', 'ML/MR', 'MC', 'AML/AMR', 'AMC', 'ST'];

const TIER_DEDUCTIONS: Record<PlayerTier, number> = {
  NONE: 0,
  RARO: 10,
  ELITE: 30,
  CRAQUE: 50,
  MESTRE: 80,
  EPICO: 120,
  LENDARIO: 160
};

const ATTRIBUTES = {
  defense: ['Corte', 'Marcação', 'Posicionamento', 'Cabeçada', 'Coragem'],
  attack: ['Passe', 'Drible', 'Cruzamento', 'Chute', 'Finalização'],
  physical: ['Condicionamento', 'Força', 'Agressividade', 'Velocidade', 'Criatividade'],
  gk: ['Reflexos', 'Agilidade', 'Antecipação', 'Sair na Bola', 'Comunicação', 'Arremesso', 'Chutar', 'Espalmar', 'Jogo Aéreo', 'Concentração']
};

const WHITE_ATTRIBUTES: Record<Position, string[]> = {
  'NONE': [],
  'ST': ['Chute', 'Finalização', 'Força', 'Velocidade', 'Cabeçada', 'Posicionamento', 'Passe', 'Drible', 'Criatividade'],
  'AMC': ['Passe', 'Drible', 'Chute', 'Finalização', 'Velocidade', 'Criatividade', 'Cabeçada', 'Condicionamento'],
  'AML/AMR': ['Passe', 'Drible', 'Cruzamento', 'Chute', 'Finalização', 'Velocidade', 'Criatividade', 'Condicionamento'],
  'MC': ['Condicionamento', 'Criatividade', 'Passe', 'Drible', 'Posicionamento', 'Marcação', 'Corte', 'Coragem', 'Chute', 'Velocidade'],
  'ML/MR': ['Condicionamento', 'Velocidade', 'Criatividade', 'Cruzamento', 'Passe', 'Drible', 'Posicionamento'],
  'DMC': ['Condicionamento', 'Força', 'Agressividade', 'Corte', 'Marcação', 'Posicionamento', 'Cabeçada', 'Coragem', 'Passe', 'Criatividade'],
  'DC': ['Força', 'Agressividade', 'Corte', 'Marcação', 'Posicionamento', 'Cabeçada', 'Coragem', 'Condicionamento'],
  'DL/DR': ['Condicionamento', 'Velocidade', 'Agressividade', 'Corte', 'Marcação', 'Posicionamento', 'Cruzamento', 'Coragem'],
  'GK': ['Reflexos', 'Agilidade', 'Antecipação', 'Sair na Bola', 'Comunicação', 'Arremesso', 'Chutar', 'Espalmar', 'Jogo Aéreo', 'Concentração', 'Condicionamento']
};

const DRILLS = {
  attack: [
    { name: 'Marcar Homem a Homem', difficulty: 'Fácil', attrs: ['Antecipação', 'Sair na Bola', 'Corte', 'Drible', 'Finalização'] },
    { name: 'Passe, vá e dispare', difficulty: 'Fácil', attrs: ['Antecipação', 'Velocidade', 'Passe', 'Chute'] },
    { name: 'Jogada ensaiada', difficulty: 'Médio', attrs: ['Sair na Bola', 'Marcação', 'Cabeçada', 'Cruzamento', 'Chute'] },
    { name: 'Técnica de chute', difficulty: 'Médio', attrs: ['Reflexos', 'Agilidade', 'Força', 'Chute', 'Finalização'] },
    { name: 'Drible de slalom', difficulty: 'Difícil', attrs: ['Condicionamento', 'Velocidade', 'Passe', 'Drible'] },
    { name: 'Jogo na ponta', difficulty: 'Difícil', attrs: ['Espalmar', 'Cabeçada', 'Cruzamento', 'Chute', 'Finalização'] },
    { name: 'Contra-ataque rápido', difficulty: 'Muito Difícil', attrs: ['Comunicação', 'Criatividade', 'Passe', 'Cruzamento', 'Finalização'] }
  ],
  defense: [
    { name: 'Análise de vídeo', difficulty: 'Muito Fácil', attrs: ['Comunicação', 'Criatividade', 'Posicionamento', 'Coragem'] },
    { name: 'Cabeceada', difficulty: 'Fácil', attrs: ['Criatividade', 'Posicionamento', 'Cabeçada', 'Passe'] },
    { name: 'Uma linha de defesa', difficulty: 'Médio', attrs: ['Comunicação', 'Concentração', 'Marcação', 'Posicionamento'] },
    { name: 'Parar o atacante', difficulty: 'Médio', attrs: ['Força', 'Corte', 'Marcação', 'Coragem', 'Drible'] },
    { name: 'Cruzamento defesa', difficulty: 'Médio', attrs: ['Jogo Aéreo', 'Marcação', 'Cabeçada', 'Coragem', 'Cruzamento'] },
    { name: 'Pressione o play', difficulty: 'Difícil', attrs: ['Agressividade', 'Corte', 'Marcação', 'Posicionamento', 'Coragem'] },
    { name: 'Treino de goleiro', difficulty: 'Difícil', attrs: ['Reflexos', 'Agilidade', 'Arremesso', 'Chutar', 'Jogo Aéreo'] }
  ],
  possession: [
    { name: 'Controle de bola', difficulty: 'Muito Fácil', attrs: ['Concentração', 'Criatividade', 'Cabeçada', 'Drible'] },
    { name: 'Jogo de bobinho', difficulty: 'Fácil', attrs: ['Condicionamento', 'Agressividade', 'Corte', 'Posicionamento', 'Passe'] },
    { name: 'Matada de bola', difficulty: 'Fácil', attrs: ['Arremesso', 'Condicionamento', 'Passe', 'Drible'] },
    { name: 'Virada de jogo', difficulty: 'Médio', attrs: ['Comunicação', 'Velocidade', 'Criatividade', 'Posicionamento', 'Passe', 'Cruzamento'] },
    { name: 'Posicionamento', difficulty: 'Médio', attrs: ['Jogo Aéreo', 'Condicionamento', 'Velocidade', 'Posicionamento'] },
    { name: 'Entradas', difficulty: 'Médio', attrs: ['Força', 'Agressividade', 'Marcação', 'Coragem', 'Drible'] },
    { name: 'Passes para o chute', difficulty: 'Difícil', attrs: ['Antecipação', 'Criatividade', 'Posicionamento', 'Passe', 'Finalização'] }
  ],
  physical: [
    { name: 'Aquecimento', difficulty: 'Muito Fácil', attrs: ['Reflexos', 'Condicionamento', 'Agressividade', 'Cabeçada'] },
    { name: 'Alongamento', difficulty: 'Fácil', attrs: ['Agilidade', 'Condicionamento', 'Força', 'Velocidade'] },
    { name: 'Carioca com escadas', difficulty: 'Fácil', attrs: ['Agilidade', 'Concentração', 'Agressividade', 'Velocidade'] },
    { name: 'Corrida longa', difficulty: 'Médio', attrs: ['Concentração', 'Condicionamento', 'Velocidade'] },
    { name: 'Corrida ir e vir', difficulty: 'Difícil', attrs: ['Agilidade', 'Força', 'Velocidade', 'Coragem'] },
    { name: 'Corrida de obstáculos', difficulty: 'Difícil', attrs: ['Chutar', 'Agressividade', 'Velocidade', 'Coragem'] },
    { name: 'Academia', difficulty: 'Muito Difícil', attrs: ['Arremesso', 'Chutar', 'Condicionamento', 'Força'] },
    { name: 'Arrancada', difficulty: 'Muito Difícil', attrs: ['Sair na Bola', 'Condicionamento', 'Velocidade', 'Drible'] }
  ]
};

const DRILL_CATEGORIES = [
  { key: 'attack', label: 'ATAQUE', color: 'bg-red-900/40 text-red-400 border-red-900/50', drills: DRILLS.attack },
  { key: 'defense', label: 'DEFESA', color: 'bg-green-900/40 text-green-400 border-green-900/50', drills: DRILLS.defense },
  { key: 'possession', label: 'POSSE', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-900/50', drills: DRILLS.possession },
  { key: 'physical', label: 'FÍSICO E MENTAL', color: 'bg-blue-900/40 text-blue-400 border-blue-900/50', drills: DRILLS.physical }
];

export const TrainingSimulator: React.FC<{ currentUser: User | null, data: any, onDataChange: (d: any) => void, onUpdateSavedTrainings?: (trainings: SavedTraining[]) => Promise<void> }> = ({ currentUser, data, onDataChange, onUpdateSavedTrainings }) => {
  const [pos1, setPos1] = useState<Position>('NONE');
  const [pos2, setPos2] = useState<Position>('NONE');
  const [pos3, setPos3] = useState<Position>('NONE');
  const [playerTier, setPlayerTier] = useState<PlayerTier>('NONE');

  const [attributes, setAttributes] = useState<Record<string, number>>({});
  const [drills, setDrills] = useState<Record<string, number>>({});
  const [drillSteps, setDrillSteps] = useState<{ drillName: string, count: number }[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('loadTraining');
    if (savedData) {
      try {
        const training: SavedTraining = JSON.parse(savedData);
        setPos1(training.positions[0] as Position || 'NONE');
        setPos2(training.positions[1] as Position || 'NONE');
        setPos3(training.positions[2] as Position || 'NONE');
        setPlayerTier(training.tier || 'NONE');
        setAttributes(training.baseAttributes || {});
        setDrillSteps(training.drillSteps || []);
        
        const loadedDrills: Record<string, number> = {};
        training.drillSteps.forEach(step => {
          loadedDrills[step.drillName] = (loadedDrills[step.drillName] || 0) + step.count;
        });
        setDrills(loadedDrills);
        setSaveName(training.name);
        
        localStorage.removeItem('loadTraining');
      } catch (e) {
        console.error('Failed to load training', e);
      }
    }
  }, []);

  const isGK = pos1 === 'GK' || pos2 === 'GK' || pos3 === 'GK';

  const activeAttributes = useMemo(() => {
    if (isGK) {
      return [...ATTRIBUTES.gk, ...ATTRIBUTES.physical];
    }
    return [...ATTRIBUTES.defense, ...ATTRIBUTES.attack, ...ATTRIBUTES.physical];
  }, [isGK]);

  const whiteAttributes = useMemo(() => {
    const whites = new Set<string>();
    [pos1, pos2, pos3].forEach(pos => {
      if (pos !== 'NONE' && WHITE_ATTRIBUTES[pos]) {
        WHITE_ATTRIBUTES[pos].forEach(attr => whites.add(attr));
      }
    });
    return whites;
  }, [pos1, pos2, pos3]);

  const handleAttrChange = (attr: string, value: string) => {
    const num = parseInt(value) || 0;
    setAttributes(prev => ({ ...prev, [attr]: num }));
  };

  const handleDrillChange = (drillName: string, newValue: number) => {
    const current = drills[drillName] || 0;
    const next = Math.max(0, newValue);
    const delta = next - current;
    
    if (delta !== 0) {
      setDrills(prev => ({ ...prev, [drillName]: next }));
      
      setDrillSteps(steps => {
        let newSteps = [...steps];
        if (delta > 0) {
          if (newSteps.length > 0 && newSteps[newSteps.length - 1].drillName === drillName) {
            newSteps[newSteps.length - 1] = { ...newSteps[newSteps.length - 1], count: newSteps[newSteps.length - 1].count + delta };
          } else {
            newSteps.push({ drillName, count: delta });
          }
        } else {
          let remainingToRemove = -delta;
          for (let i = newSteps.length - 1; i >= 0 && remainingToRemove > 0; i--) {
            if (newSteps[i].drillName === drillName) {
              if (newSteps[i].count <= remainingToRemove) {
                remainingToRemove -= newSteps[i].count;
                newSteps.splice(i, 1);
              } else {
                newSteps[i] = { ...newSteps[i], count: newSteps[i].count - remainingToRemove };
                remainingToRemove = 0;
              }
            }
          }
        }
        return newSteps;
      });
    }
  };

  const increments = useMemo(() => {
    const incs: Record<string, number> = {};
    Object.values(DRILLS).flat().forEach(drill => {
      const count = drills[drill.name] || 0;
      if (count > 0) {
        drill.attrs.forEach(attr => {
          if (activeAttributes.includes(attr)) {
            const isWhite = whiteAttributes.has(attr);
            const gain = isWhite ? 1 : 0.5;
            incs[attr] = (incs[attr] || 0) + (count * gain);
          }
        });
      }
    });
    return incs;
  }, [drills, activeAttributes, whiteAttributes]);

  const stats = useMemo(() => {
    let currentTotal = 0;
    let realTotal = 0;
    let simulatedTotal = 0;
    let whiteCurrentTotal = 0;
    let whiteSimulatedTotal = 0;
    let greyCurrentTotal = 0;
    let greySimulatedTotal = 0;
    let whiteCount = 0;
    let greyCount = 0;

    const tierDeduction = TIER_DEDUCTIONS[playerTier] || 0;

    activeAttributes.forEach(attr => {
      const current = attributes[attr] || 0;
      const inc = increments[attr] || 0;
      const simulated = current + inc;

      if (whiteAttributes.has(attr)) {
        const currentWithDeduction = current - tierDeduction;

        currentTotal += current;
        realTotal += currentWithDeduction;
        simulatedTotal += simulated;
        
        whiteCurrentTotal += currentWithDeduction;
        whiteSimulatedTotal += simulated;
        whiteCount++;
      } else {
        currentTotal += current;
        realTotal += current;
        simulatedTotal += simulated;
        
        greyCurrentTotal += current;
        greySimulatedTotal += simulated;
        greyCount++;
      }
    });

    const currentAvg = activeAttributes.length > 0 ? currentTotal / 15 : 0;
    const realAvg = activeAttributes.length > 0 ? realTotal / 15 : 0;
    const simulatedAvg = activeAttributes.length > 0 ? simulatedTotal / 15 : 0;
    
    return {
      currentAvg,
      realAvg,
      simulatedAvg,
    };
  }, [activeAttributes, attributes, increments, whiteAttributes, playerTier]);

  const handleSaveTraining = async () => {
    if (!currentUser) return;
    if (!saveName.trim()) {
      alert('Dê um nome ao treino antes de salvar.');
      return;
    }
    if (drillSteps.length === 0) {
      alert('Adicione pelo menos um treino antes de salvar.');
      return;
    }

    setIsSaving(true);
    try {
      const newSavedTraining: SavedTraining = {
        id: Date.now().toString(),
        userId: currentUser.id,
        name: saveName.trim(),
        positions: [pos1, pos2, pos3].filter(p => p !== 'NONE'),
        tier: playerTier,
        baseAttributes: { ...attributes },
        drillSteps: [...drillSteps],
        createdAt: Date.now()
      };

      const newSavedTrainings = [...(data.savedTrainings || []), newSavedTraining];
      const updatedData = {
        ...data,
        savedTrainings: newSavedTrainings
      };

      await saveData(updatedData);
      await onDataChange(updatedData);
      if (onUpdateSavedTrainings) {
        await onUpdateSavedTrainings(newSavedTrainings);
      }
      setSaveName('');
      alert('Treino salvo com sucesso!');
    } catch (error) {
      console.error('Error saving training:', error);
      alert('Erro ao salvar o treino.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAttributeCategory = (catName: string, attrs: string[], catColor: string) => {
    if (attrs.length === 0 || (!isGK && catName === 'GOLEIRO') || (isGK && (catName === 'DEFESA' || catName === 'ATAQUE'))) return null;
    
    return (
      <>
        {attrs.map((attr, idx) => {
          const isWhite = whiteAttributes.has(attr);
          const current = attributes[attr] || 0;
          const real = current - (isWhite ? (TIER_DEDUCTIONS[playerTier] || 0) : 0);
          const inc = increments[attr] || 0;
          const simulated = current + inc;

          return (
            <tr key={attr} className={`group ${isWhite ? 'bg-gray-800 text-white' : 'bg-gray-900/40 text-gray-500'} hover:bg-gray-700/80 transition-colors relative`}>
              {idx === 0 && (
                <td rowSpan={attrs.length} className={`border border-gray-600 ${catColor} w-8`}>
                  <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-xs font-bold mx-auto">
                    {catName}
                  </div>
                </td>
              )}
              <td className="border border-gray-600 text-left px-2 font-bold text-xs whitespace-nowrap relative">
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-500/20 -translate-y-1/2 pointer-events-none"></div>
                <span className="relative z-10 px-1">{attr}</span>
              </td>
              <td className="border border-gray-600 p-0 w-16 relative">
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-500/20 -translate-y-1/2 pointer-events-none"></div>
                <input 
                  type="number" 
                  value={attributes[attr] || ''} 
                  onChange={(e) => handleAttrChange(attr, e.target.value)}
                  className="w-full h-full bg-transparent text-center outline-none font-bold relative z-10"
                />
              </td>
              <td className="border border-gray-600 w-16 relative">
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-500/20 -translate-y-1/2 pointer-events-none"></div>
                <span className="relative z-10 px-1">{real}%</span>
              </td>
              <td className={`border border-gray-600 font-bold w-16 relative ${inc > 0 ? 'text-strongs-gold' : ''}`}>
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-500/20 -translate-y-1/2 pointer-events-none"></div>
                <span className="relative z-10 px-1">{simulated}%</span>
              </td>
              
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => {
                  const trainsAttr = drill.attrs.includes(attr);
                  return (
                    <td key={drill.name} className="border border-gray-600 text-center w-8 relative hover:bg-gray-700/50 transition-colors">
                      <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-500/20 -translate-y-1/2 pointer-events-none"></div>
                      <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/20 -translate-x-1/2 pointer-events-none"></div>
                      {trainsAttr ? <span className={`${isWhite ? 'text-strongs-gold' : 'text-gray-400'} text-xl leading-none relative z-10 drop-shadow-md px-1`}>•</span> : null}
                    </td>
                  );
                })
              ))}
            </tr>
          );
        })}
      </>
    );
  };

  const getDrillEfficiencyData = (drill: any) => {
    const validAttrs = drill.attrs.filter((a: string) => activeAttributes.includes(a));
    let whites = 0;
    let greys = 0;
    validAttrs.forEach((a: string) => {
      if (whiteAttributes.has(a)) whites++;
      else greys++;
    });
    
    let bgColor = 'bg-gray-800 text-white';
    if (greys === 0) {
      bgColor = 'bg-green-700 text-white';
    } else if (greys === 1) {
      bgColor = 'bg-green-500 text-black';
    } else if (greys >= 2) {
      if (whites === greys) bgColor = 'bg-yellow-500 text-black';
      else if (greys > whites) bgColor = 'bg-red-600 text-white';
      else bgColor = 'bg-green-500 text-black';
    }

    return { text: `${whites}/${greys}`, bgColor };
  };

  const getDrillAverage = (drill: any) => {
    const validAttrs = drill.attrs.filter((a: string) => activeAttributes.includes(a));
    if (validAttrs.length === 0) return '0%';
    let sum = 0;
    const tierDeduction = TIER_DEDUCTIONS[playerTier] || 0;
    validAttrs.forEach((attr: string) => {
      let current = attributes[attr] || 0;
      let real = current - (whiteAttributes.has(attr) ? tierDeduction : 0);
      let inc = increments[attr] || 0;
      sum += (real + inc);
    });
    return (sum / validAttrs.length).toFixed(0) + '%';
  };

  const renderLog = () => {
    let currentAttrs = { ...attributes };
    
    return drillSteps.map((step, index) => {
      const drillDef = Object.values(DRILLS).flat().find(d => d.name === step.drillName);
      if (!drillDef) return null;

      const validAttrs = drillDef.attrs.filter(a => activeAttributes.includes(a));
      if (validAttrs.length === 0) return null;

      // Find a white attribute to display, fallback to first valid
      const targetAttr = validAttrs.find(a => whiteAttributes.has(a)) || validAttrs[0];
      
      // Update ALL attributes for this step
      drillDef.attrs.forEach(attr => {
        if (activeAttributes.includes(attr)) {
           const attrIsWhite = whiteAttributes.has(attr);
           const attrGain = attrIsWhite ? 1 : 0.5;
           currentAttrs[attr] = (currentAttrs[attr] || 0) + (step.count * attrGain);
        }
      });

      const afterValue = currentAttrs[targetAttr];

      return (
        <div key={index} className="text-sm text-gray-300 mb-2 border-l-2 border-strongs-gold pl-3 py-1">
          Fazer treinamento de: <span className="font-bold text-white">{step.drillName}</span> até <span className="text-strongs-gold font-bold">{targetAttr} {afterValue.toFixed(1)}</span>
          <div className="text-xs text-gray-500 mt-0.5">({step.count}x treinos aplicados)</div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest">
          Simulador de <span className="text-strongs-gold">Treinos</span>
        </h2>
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-700 custom-scrollbar shadow-2xl">
        <table className="w-full text-sm border-collapse text-center min-w-max">
          <thead>
            <tr>
              <th colSpan={2} rowSpan={2} className="border border-gray-600 bg-gray-800 p-2 min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-left">
                    <div>
                      <label className="text-gray-400 font-bold">Pos 1:</label>
                      <select className="w-full bg-black text-white p-1 rounded border border-gray-600" value={pos1} onChange={e => setPos1(e.target.value as Position)}>
                        {POSITIONS.map(p => <option key={p} value={p}>{p === 'NONE' ? '-' : p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold">Pos 2:</label>
                      <select className="w-full bg-black text-white p-1 rounded border border-gray-600" value={pos2} onChange={e => setPos2(e.target.value as Position)}>
                        {POSITIONS.map(p => <option key={p} value={p}>{p === 'NONE' ? '-' : p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold">Pos 3:</label>
                      <select className="w-full bg-black text-white p-1 rounded border border-gray-600" value={pos3} onChange={e => setPos3(e.target.value as Position)}>
                        {POSITIONS.map(p => <option key={p} value={p}>{p === 'NONE' ? '-' : p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 font-bold">Tier:</label>
                      <select className="w-full bg-black text-white p-1 rounded border border-gray-600" value={playerTier} onChange={e => setPlayerTier(e.target.value as PlayerTier)}>
                        {(Object.keys(TIER_LABELS) as PlayerTier[]).map(tier => <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </th>
              <th rowSpan={2} className="border border-gray-600 bg-gray-800 p-2 w-12">
                <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-white font-bold text-xs mx-auto">Habilidade Iniciais</div>
              </th>
              <th rowSpan={2} className="border border-gray-600 bg-gray-800 p-2 w-12">
                <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-white font-bold text-xs mx-auto">Habilidade Real</div>
              </th>
              <th rowSpan={2} className="border border-gray-600 bg-gray-800 p-2 w-12">
                <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-white font-bold text-xs mx-auto">Simulação</div>
              </th>
              
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => (
                  <th key={drill.name} className="border border-gray-600 bg-gray-200 text-black text-[10px] p-1 h-20 align-bottom w-8 relative">
                    <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/30 -translate-x-1/2 pointer-events-none"></div>
                    <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap mx-auto relative z-10">
                      {drill.difficulty}
                    </div>
                  </th>
                ))
              ))}
            </tr>
            <tr>
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => (
                  <th key={drill.name} className={`border border-gray-600 ${cat.color} p-2 h-40 w-8 relative`}>
                    <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/30 -translate-x-1/2 pointer-events-none"></div>
                    <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-xs font-bold mx-auto relative z-10">
                      {drill.name}
                    </div>
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {isGK ? (
              <>
                {renderAttributeCategory('GOLEIRO', ATTRIBUTES.gk, 'bg-green-700')}
                {renderAttributeCategory('FÍSICO E MENTAL', ATTRIBUTES.physical, 'bg-blue-800')}
              </>
            ) : (
              <>
                {renderAttributeCategory('DEFESA', ATTRIBUTES.defense, 'bg-green-700')}
                {renderAttributeCategory('ATAQUE', ATTRIBUTES.attack, 'bg-red-800')}
                {renderAttributeCategory('FÍSICO E MENTAL', ATTRIBUTES.physical, 'bg-blue-800')}
              </>
            )}
            
            {/* MÉDIAS GERAIS Section */}
            <tr className="border-y-4 border-strongs-gold bg-gray-900 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
              <td colSpan={2} className="border border-gray-600 p-4 text-strongs-gold font-display font-bold text-right text-sm uppercase tracking-widest">MÉDIA GERAL:</td>
              <td className="border border-gray-600 p-4 text-white font-bold text-lg">{stats.currentAvg.toFixed(1)}%</td>
              <td className="border border-gray-600 p-4 text-white font-bold text-lg">{stats.realAvg.toFixed(1)}%</td>
              <td className="border border-gray-600 p-4 text-strongs-gold font-bold text-xl bg-strongs-gold/10">{stats.simulatedAvg.toFixed(1)}%</td>
              <td colSpan={DRILL_CATEGORIES.reduce((acc, cat) => acc + cat.drills.length, 0)} className="border border-gray-600"></td>
            </tr>
            
            {/* DADOS Section */}
            <tr>
              <td rowSpan={4} className="border border-gray-600 bg-gray-800 text-white w-8">
                <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-xs font-bold mx-auto">
                  DADOS
                </div>
              </td>
              <td className="border border-gray-600 bg-gray-800 text-gray-400 font-bold text-right pr-2 text-xs">EFICIÊNCIA DO TREINO:</td>
              <td colSpan={3} className="border border-gray-600 bg-gray-800"></td>
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => {
                  const eff = getDrillEfficiencyData(drill);
                  return (
                    <td key={drill.name} className={`border border-gray-600 ${eff.bgColor} font-bold text-xs relative`}>
                      <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/30 -translate-x-1/2 pointer-events-none"></div>
                      <span className="relative z-10">{eff.text}</span>
                    </td>
                  );
                })
              ))}
            </tr>
            <tr>
              <td className="border border-gray-600 bg-gray-800 text-gray-400 font-bold text-right pr-2 text-xs">MÉDIA DO TREINO:</td>
              <td colSpan={3} className="border border-gray-600 bg-gray-800 text-white font-bold">{stats.simulatedAvg.toFixed(0)}%</td>
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => (
                  <td key={drill.name} className="border border-gray-600 bg-gray-800 text-white font-bold text-xs relative">
                    <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/20 -translate-x-1/2 pointer-events-none"></div>
                    <span className="relative z-10">{getDrillAverage(drill)}</span>
                  </td>
                ))
              ))}
            </tr>
            <tr>
              <td className="border border-gray-600 bg-gray-800 text-gray-400 font-bold text-right pr-2 text-xs">BARRA DE ROLAMENTO:</td>
              <td colSpan={3} className="border border-gray-600 bg-gray-800 p-1">
                <button 
                  onClick={() => {
                    setDrills({});
                    setDrillSteps([]);
                  }}
                  className="w-full py-1 bg-red-900/40 hover:bg-red-800 text-red-400 hover:text-white text-xs font-bold rounded transition-colors border border-red-900/50"
                  title="Zerar todos os treinos"
                >
                  ZERAR
                </button>
              </td>
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => (
                  <td key={drill.name} className="border border-gray-600 bg-black p-0 relative">
                    <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/20 -translate-x-1/2 pointer-events-none"></div>
                    <input 
                      type="number" 
                      min="0"
                      value={drills[drill.name] || ''} 
                      onChange={(e) => handleDrillChange(drill.name, parseInt(e.target.value) || 0)}
                      className="w-full h-full text-center text-white bg-transparent font-bold outline-none py-1 focus:bg-strongs-gold/20 relative z-10"
                    />
                  </td>
                ))
              ))}
            </tr>
            <tr>
              <td className="border border-gray-600 bg-gray-800 text-gray-400 font-bold text-right pr-2 text-xs">INCREMENTO:</td>
              <td colSpan={3} className="border border-gray-600 bg-gray-800"></td>
              {DRILL_CATEGORIES.map(cat => (
                cat.drills.map(drill => {
                  const count = drills[drill.name] || 0;
                  return (
                    <td key={drill.name} className="border border-gray-600 bg-gray-900 text-strongs-gold font-bold text-xs relative">
                      <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-500/20 -translate-x-1/2 pointer-events-none"></div>
                      <span className="relative z-10">{count > 0 ? count : 0}</span>
                    </td>
                  );
                })
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save Training Section & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Log de Treinos */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <List className="text-strongs-gold" /> Log de Treinos
          </h3>
          <div className="bg-black/50 border border-gray-800 rounded p-4 h-[200px] overflow-y-auto custom-scrollbar">
            {drillSteps.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center mt-16">Nenhum treino adicionado ainda.</p>
            ) : (
              renderLog()
            )}
          </div>
        </div>

        {/* Save Training */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-xl flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Save className="text-strongs-gold" /> Salvar Simulação
            </h3>
            <p className="text-gray-400 text-sm">Salve este treino para acessá-lo futuramente no seu painel.</p>
          </div>
          
          {currentUser ? (
            <div className="flex flex-col sm:flex-row w-full gap-4">
              <input 
                type="text" 
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nome do Treino (ex: Mutante ST)"
                className="w-full bg-black/50 border border-gray-700 rounded px-4 py-3 text-white focus:border-strongs-gold outline-none"
              />
              <button 
                onClick={handleSaveTraining}
                disabled={isSaving || Object.values(drills).every(v => v === 0)}
                className="bg-strongs-gold text-strongs-darker px-8 py-3 rounded font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Save size={18} /> Salvar Treino
              </button>
            </div>
          ) : (
            <p className="text-gray-500 italic p-4 bg-black/30 rounded border border-gray-800">Faça login para salvar seus treinos.</p>
          )}
        </div>
      </div>
    </div>
  );
};
