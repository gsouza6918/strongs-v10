import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Shield, Zap, Target, Plus, Minus, Calculator, Save, List } from 'lucide-react';
import { User, SavedTraining, Position, PlayerTier, TIER_ICONS, TIER_LABELS } from '../types';
import { saveData } from '../services/storage';

type Position = 'NONE' | 'GK' | 'DL/DR' | 'DC' | 'DMC' | 'ML/MR' | 'MC' | 'AML/AMR' | 'AMC' | 'ST';

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
    { name: 'Marcar Homem a Homem', attrs: ['Antecipação', 'Sair na Bola', 'Corte', 'Drible', 'Finalização'] },
    { name: 'Passe, vá e dispare', attrs: ['Antecipação', 'Velocidade', 'Passe', 'Chute'] },
    { name: 'Jogada ensaiada', attrs: ['Sair na Bola', 'Marcação', 'Cabeçada', 'Cruzamento', 'Chute'] },
    { name: 'Técnica de chute', attrs: ['Reflexos', 'Agilidade', 'Força', 'Chute', 'Finalização'] },
    { name: 'Drible de slalom', attrs: ['Condicionamento', 'Velocidade', 'Passe', 'Drible'] },
    { name: 'Jogo na ponta', attrs: ['Espalmar', 'Cabeçada', 'Cruzamento', 'Chute', 'Finalização'] },
    { name: 'Contra-ataque rápido', attrs: ['Comunicação', 'Criatividade', 'Passe', 'Cruzamento', 'Finalização'] }
  ],
  defense: [
    { name: 'Análise de vídeo', attrs: ['Comunicação', 'Criatividade', 'Posicionamento', 'Coragem'] },
    { name: 'Cabeceada', attrs: ['Criatividade', 'Posicionamento', 'Cabeçada', 'Passe'] },
    { name: 'Uma linha de defesa', attrs: ['Comunicação', 'Concentração', 'Marcação', 'Posicionamento'] },
    { name: 'Parar o atacante', attrs: ['Força', 'Corte', 'Marcação', 'Coragem', 'Drible'] },
    { name: 'Cruzamento defesa', attrs: ['Jogo Aéreo', 'Marcação', 'Cabeçada', 'Coragem', 'Cruzamento'] },
    { name: 'Pressione o play', attrs: ['Agressividade', 'Corte', 'Marcação', 'Posicionamento', 'Coragem'] },
    { name: 'Treino de goleiro', attrs: ['Reflexos', 'Agilidade', 'Arremesso', 'Chutar', 'Jogo Aéreo'] }
  ],
  possession: [
    { name: 'Controle de bola', attrs: ['Concentração', 'Criatividade', 'Cabeçada', 'Drible'] },
    { name: 'Jogo de bobinho', attrs: ['Condicionamento', 'Agressividade', 'Corte', 'Posicionamento', 'Passe'] },
    { name: 'Matada de bola', attrs: ['Arremesso', 'Condicionamento', 'Passe', 'Drible'] },
    { name: 'Virada de jogo', attrs: ['Comunicação', 'Velocidade', 'Criatividade', 'Posicionamento', 'Passe', 'Cruzamento'] },
    { name: 'Posicionamento', attrs: ['Jogo Aéreo', 'Condicionamento', 'Velocidade', 'Posicionamento'] },
    { name: 'Passes para o chute', attrs: ['Antecipação', 'Criatividade', 'Posicionamento', 'Passe', 'Finalização'] },
    { name: 'Entradas', attrs: ['Força', 'Agressividade', 'Marcação', 'Coragem', 'Drible'] }
  ],
  physical: [
    { name: 'Aquecimento', attrs: ['Reflexos', 'Condicionamento', 'Agressividade', 'Cabeçada'] },
    { name: 'Alongamento', attrs: ['Agilidade', 'Condicionamento', 'Força', 'Velocidade'] },
    { name: 'Carioca com escadas', attrs: ['Agilidade', 'Concentração', 'Agressividade', 'Velocidade'] },
    { name: 'Corrida longa', attrs: ['Concentração', 'Condicionamento', 'Velocidade'] },
    { name: 'Corrida ir e vir', attrs: ['Agilidade', 'Força', 'Velocidade', 'Coragem'] },
    { name: 'Corrida de obstáculos', attrs: ['Chutar', 'Agressividade', 'Velocidade', 'Coragem'] },
    { name: 'Academia', attrs: ['Arremesso', 'Chutar', 'Condicionamento', 'Força'] },
    { name: 'Arrancada', attrs: ['Sair na Bola', 'Condicionamento', 'Velocidade', 'Drible'] }
  ]
};

export const TrainingSimulator: React.FC<{ currentUser: User | null, data: any, onDataChange: (d: any) => void }> = ({ currentUser, data, onDataChange }) => {
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
        
        // Reconstruct drills state from steps
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

  const handleDrillChange = (drillName: string, deltaOrNewValue: number, isAbsolute: boolean = false) => {
    const current = drills[drillName] || 0;
    const next = isAbsolute ? Math.max(0, deltaOrNewValue) : Math.max(0, current + deltaOrNewValue);
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
        // Apply deduction only to white attributes for calculations
        const currentWithDeduction = current - tierDeduction;
        const simulatedWithDeduction = simulated - tierDeduction;

        currentTotal += currentWithDeduction;
        simulatedTotal += simulatedWithDeduction;
        
        whiteCurrentTotal += currentWithDeduction;
        whiteSimulatedTotal += simulatedWithDeduction;
        whiteCount++;
      } else {
        currentTotal += current;
        simulatedTotal += simulated;
        
        greyCurrentTotal += current;
        greySimulatedTotal += simulated;
        greyCount++;
      }
    });

    const currentAvg = activeAttributes.length > 0 ? currentTotal / 15 : 0;
    const simulatedAvg = activeAttributes.length > 0 ? simulatedTotal / 15 : 0;
    
    const whiteCurrentAvg = whiteCount > 0 ? whiteCurrentTotal / whiteCount : 0;
    const whiteSimulatedAvg = whiteCount > 0 ? whiteSimulatedTotal / whiteCount : 0;
    
    const greyCurrentAvg = greyCount > 0 ? greyCurrentTotal / greyCount : 0;
    const greySimulatedAvg = greyCount > 0 ? greySimulatedTotal / greyCount : 0;

    return {
      currentAvg,
      simulatedAvg,
      whiteCurrentAvg,
      whiteSimulatedAvg,
      greyCurrentAvg,
      greySimulatedAvg
    };
  }, [activeAttributes, attributes, increments, whiteAttributes, playerTier]);

  const renderAttributeRow = (attr: string) => {
    const isWhite = whiteAttributes.has(attr);
    const current = attributes[attr] || 0;
    const inc = increments[attr] || 0;
    const simulated = current + inc;

    return (
      <div key={attr} className={`flex items-center justify-between p-2 rounded mb-1 border ${isWhite ? 'bg-gray-800 border-gray-600' : 'bg-gray-900/50 border-gray-800 opacity-75'}`}>
        <span className={`w-1/3 text-sm font-bold ${isWhite ? 'text-white' : 'text-gray-500'}`}>{attr}</span>
        <input 
          type="number" 
          value={attributes[attr] || ''} 
          onChange={(e) => handleAttrChange(attr, e.target.value)}
          className="w-16 bg-black/50 border border-gray-700 rounded p-1 text-center text-white text-sm focus:border-strongs-gold outline-none"
          placeholder="0"
        />
        <span className="w-16 text-center text-strongs-gold font-bold">{simulated}</span>
        <span className="w-16 text-center text-green-500 font-bold">{inc > 0 ? `+${inc}` : '-'}</span>
      </div>
    );
  };

  const renderDrillItem = (drill: { name: string, attrs: string[] }) => {
    const count = drills[drill.name] || 0;
    
    const validAttrs = drill.attrs.filter(attr => activeAttributes.includes(attr));
    
    let whites = 0;
    let greys = 0;
    let validCount = 0;
    let sum = 0;
    const tierDeduction = TIER_DEDUCTIONS[playerTier] || 0;

    validAttrs.forEach(attr => {
      let val = (attributes[attr] || 0) + (increments[attr] || 0);
      if (whiteAttributes.has(attr)) {
        whites++;
        val -= tierDeduction;
      } else {
        greys++;
      }
      sum += val;
      validCount++;
    });
    
    let average = validCount > 0 ? sum / validCount : 0;

    let colorClass = 'text-white';
    if (validCount > 0) {
      if (greys === 0 && whites > 0) {
        colorClass = 'text-green-600';
      } else if (whites >= 2 && greys === 1) {
        colorClass = 'text-green-400';
      } else if (greys === 2) {
        colorClass = 'text-yellow-400';
      } else if (greys > whites) {
        colorClass = 'text-red-500';
      }
    }

    return (
      <div key={drill.name} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${colorClass}`}>{drill.name}</span>
            {validCount > 0 && (
              <span className="text-xs font-bold bg-gray-900 px-1.5 py-0.5 rounded text-gray-300">
                {whites}/{greys}
              </span>
            )}
            {validCount > 0 && (
              <span className="text-xs font-bold text-strongs-gold" title="Média dos atributos">
                M: {average.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">{validAttrs.join(', ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleDrillChange(drill.name, -1)} className="w-6 h-6 bg-red-900/50 text-red-500 rounded flex items-center justify-center hover:bg-red-900"><Minus size={14}/></button>
          <input 
            type="number" 
            min="0"
            value={count === 0 ? '' : count} 
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              handleDrillChange(drill.name, val, true);
            }}
            className="w-10 bg-black/50 border border-gray-700 rounded text-center text-white font-bold text-sm focus:border-strongs-gold outline-none py-0.5"
            placeholder="0"
          />
          <button onClick={() => handleDrillChange(drill.name, 1)} className="w-6 h-6 bg-green-900/50 text-green-500 rounded flex items-center justify-center hover:bg-green-900"><Plus size={14}/></button>
        </div>
      </div>
    );
  };

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

      const updatedData = {
        ...data,
        savedTrainings: [...(data.savedTrainings || []), newSavedTraining]
      };

      await saveData(updatedData);
      await onDataChange(updatedData);
      setSaveName('');
      alert('Treino salvo com sucesso!');
    } catch (error) {
      console.error('Error saving training:', error);
      alert('Erro ao salvar o treino.');
    } finally {
      setIsSaving(false);
    }
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
      const isWhite = whiteAttributes.has(targetAttr);
      const gain = isWhite ? 1 : 0.5;
      
      // Calculate value BEFORE this step
      const beforeValue = currentAttrs[targetAttr] || 0;
      
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
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
          Simulador de <span className="text-strongs-gold">Treino</span>
        </h2>
        <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full mb-4"></div>
        <p className="text-gray-400">Configure as posições, atributos iniciais e simule os ganhos com os treinos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Config & Attributes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Target className="text-strongs-gold"/> Posições e Tier do Jogador</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Posição 1', val: pos1, set: setPos1 },
                { label: 'Posição 2', val: pos2, set: setPos2 },
                { label: 'Posição 3', val: pos3, set: setPos3 }
              ].map((p, i) => (
                <div key={i}>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">{p.label}</label>
                  <select 
                    value={p.val} 
                    onChange={(e) => p.set(e.target.value as Position)}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-strongs-gold outline-none"
                  >
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos === 'NONE' ? 'Nenhuma' : pos}</option>)}
                  </select>
                </div>
              ))}
              
              {/* Player Tier Selection */}
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Tier do Jogador</label>
                <div className="relative">
                  {playerTier !== 'NONE' && (
                    <img 
                      src={TIER_ICONS[playerTier]} 
                      alt={TIER_LABELS[playerTier]} 
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <select 
                    value={playerTier} 
                    onChange={(e) => setPlayerTier(e.target.value as PlayerTier)}
                    className={`w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-strongs-gold outline-none ${playerTier !== 'NONE' ? 'pl-9' : ''}`}
                  >
                    {(Object.keys(TIER_LABELS) as PlayerTier[]).map(tier => (
                      <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-6 rounded-xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calculator className="text-strongs-gold"/> Atributos</h3>
              <div className="flex gap-4 text-xs font-bold uppercase text-gray-400">
                <span className="w-16 text-center">Atual</span>
                <span className="w-16 text-center">Simulado</span>
                <span className="w-16 text-center">Ganho</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isGK ? (
                <>
                  <div>
                    <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm border-b border-gray-700 pb-1">Goleiro</h4>
                    {ATTRIBUTES.gk.map(renderAttributeRow)}
                  </div>
                  <div>
                    <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm border-b border-gray-700 pb-1">Físico e Mental</h4>
                    {ATTRIBUTES.physical.map(renderAttributeRow)}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm border-b border-gray-700 pb-1">Defesa</h4>
                    {ATTRIBUTES.defense.map(renderAttributeRow)}
                    <h4 className="text-strongs-gold font-bold mt-4 mb-2 uppercase text-sm border-b border-gray-700 pb-1">Ataque</h4>
                    {ATTRIBUTES.attack.map(renderAttributeRow)}
                  </div>
                  <div>
                    <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm border-b border-gray-700 pb-1">Físico e Mental</h4>
                    {ATTRIBUTES.physical.map(renderAttributeRow)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Drills & Summary */}
        <div className="space-y-6">
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-6 rounded-xl shadow-xl sticky top-24">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity className="text-strongs-gold"/> Resumo (Médias)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-gray-800">
                <span className="text-gray-400 text-sm font-bold uppercase">Média Geral Atual</span>
                <span className="text-white font-bold text-lg">{stats.currentAvg.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-strongs-gold/10 rounded border border-strongs-gold/30">
                <span className="text-strongs-gold text-sm font-bold uppercase">Média Geral Simulada</span>
                <span className="text-strongs-gold font-bold text-xl">{stats.simulatedAvg.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-gray-800">
                <span className="text-gray-300 text-sm font-bold uppercase">Brancas (Atual / Sim)</span>
                <span className="text-white font-bold">{stats.whiteCurrentAvg.toFixed(1)} / <span className="text-strongs-gold">{stats.whiteSimulatedAvg.toFixed(1)}</span></span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-gray-800">
                <span className="text-gray-500 text-sm font-bold uppercase">Cinzas (Atual / Sim)</span>
                <span className="text-gray-400 font-bold">{stats.greyCurrentAvg.toFixed(1)} / <span className="text-strongs-gold">{stats.greySimulatedAvg.toFixed(1)}</span></span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="text-strongs-gold"/> Treinamentos</h3>
            
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm sticky top-0 bg-gray-900/90 py-1 z-10">Ataque</h4>
                {DRILLS.attack.map(renderDrillItem)}
              </div>
              <div>
                <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm sticky top-0 bg-gray-900/90 py-1 z-10">Defesa</h4>
                {DRILLS.defense.map(renderDrillItem)}
              </div>
              <div>
                <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm sticky top-0 bg-gray-900/90 py-1 z-10">Posse</h4>
                {DRILLS.possession.map(renderDrillItem)}
              </div>
              <div>
                <h4 className="text-strongs-gold font-bold mb-2 uppercase text-sm sticky top-0 bg-gray-900/90 py-1 z-10">Físico e Mental</h4>
                {DRILLS.physical.map(renderDrillItem)}
              </div>
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><List className="text-strongs-gold"/> Log de Treinos</h3>
            
            <div className="bg-black/50 border border-gray-800 rounded p-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-4">
              {drillSteps.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center">Nenhum treino adicionado ainda.</p>
              ) : (
                renderLog()
              )}
            </div>

            {currentUser && (
              <div className="border-t border-gray-800 pt-4">
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Salvar Sequência de Treino</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Ex: Mutante ST"
                    className="flex-1 bg-black/50 border border-gray-700 rounded p-2 text-white text-sm focus:border-strongs-gold outline-none"
                  />
                  <button 
                    onClick={handleSaveTraining}
                    disabled={isSaving || drillSteps.length === 0}
                    className="bg-strongs-gold text-strongs-darker px-4 py-2 rounded font-bold text-sm hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={16} /> Salvar
                  </button>
                </div>
              </div>
            )}
            {!currentUser && (
              <p className="text-xs text-gray-500 text-center mt-4">Faça login para salvar seus treinos.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
