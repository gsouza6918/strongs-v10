import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Plus, Trash, AlertTriangle, Info, CheckCircle2, ChevronDown, Maximize, X } from 'lucide-react';

type Position = 'GK' | 'DC' | 'DL' | 'DR' | 'DMC' | 'MC' | 'ML' | 'MR' | 'AMC' | 'ST' | 'AML' | 'AMR';

interface TeamPlayer {
  id: string;
  position: Position;
  value: number;
}


const POSITIONS: { pos: Position; max: number }[] = [
  { pos: 'GK', max: 1 },
  { pos: 'DL', max: 1 },
  { pos: 'DC', max: 3 },
  { pos: 'DR', max: 1 },
  { pos: 'DMC', max: 2 },
  { pos: 'ML', max: 1 },
  { pos: 'MC', max: 3 },
  { pos: 'MR', max: 1 },
  { pos: 'AML', max: 1 },
  { pos: 'AMC', max: 2 },
  { pos: 'AMR', max: 1 },
  { pos: 'ST', max: 2 },
];

export const TeamSimulator: React.FC = () => {
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [isAvgExpanded, setIsAvgExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to add a player
  const handleAddPlayer = (pos: Position) => {
    if (players.length >= 11) {
      alert('Você já atingiu o limite máximo de 11 jogadores.');
      return;
    }
    
    const count = players.filter(p => p.position === pos).length;
    const rule = POSITIONS.find(r => r.pos === pos);
    
    if (rule && count >= rule.max) {
      alert(`Você já atingiu o limite máximo para a posição ${pos}.`);
      return;
    }

    setPlayers([...players, { id: Date.now().toString() + Math.random(), position: pos, value: 0 }]);
  };

  const handleUpdateValue = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setPlayers(players.map(p => p.id === id ? { ...p, value: num } : p));
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleClear = () => {
    if (confirm('Deseja limpar todos os jogadores?')) {
      setPlayers([]);
    }
  };

  // Validation
  const validation = useMemo(() => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    const count = (p: Position) => players.filter(pl => pl.position === p).length;
    
    // Obligatório 1 GK
    if (count('GK') !== 1) errors.push('É obrigatório ter exatamente 1 GK.');
    
    // Defense: at least 4 (GK, DL, DC, DR)
    const defenseCount = count('GK') + count('DL') + count('DC') + count('DR');
    if (defenseCount < 4) errors.push('As regras exigem pelo menos 4 jogadores na defesa (somando GK, DL, DC, DR).');
    
    // Obligatório pelo menos 1 MC
    if (count('MC') < 1) errors.push('É obrigatório ter pelo menos 1 MC.');
    
    // Left side: DL || ML || AML
    if (count('DL') + count('ML') + count('AML') === 0) errors.push('É obrigatório jogador na lateral esquerda (DL, ML ou AML).');
    
    // Right side: DR || MR || AMR
    if (count('DR') + count('MR') + count('AMR') === 0) errors.push('É obrigatório jogador na lateral direita (DR, MR ou AMR).');

    // Attack side: AMC || ST
    if (count('AMC') + count('ST') === 0) errors.push('É obrigatório ter pelo menos 1 jogador central de ataque (AMC ou ST).');

    if (players.length < 11) {
       warnings.push(`Faltam ${11 - players.length} jogadores para completar o time de 11.`);
    }

    return { errors, warnings, isValid: errors.length === 0 && players.length === 11 };
  }, [players]);

  const averageValue = useMemo(() => {
    if (players.length === 0) return 0;
    const sum = players.reduce((acc, p) => acc + p.value, 0);
    return sum / players.length;
  }, [players]);

  const sectorAverages = useMemo(() => {
    const defensePositions = ['GK', 'DC', 'DL', 'DR', 'DMC'];
    const midfieldPositions = ['DMC', 'ML', 'MC', 'MR', 'AMC', 'AML', 'AMR'];
    const attackPositions = ['AML', 'AMC', 'AMR', 'ST'];

    const defensePlayers = players.filter(p => defensePositions.includes(p.position));
    const midfieldPlayers = players.filter(p => midfieldPositions.includes(p.position));
    const attackPlayers = players.filter(p => attackPositions.includes(p.position));

    const calcAvg = (plrs: TeamPlayer[]) => {
      const validPlrs = plrs.filter(p => p.value > 0);
      return validPlrs.length > 0 ? (validPlrs.reduce((a, b) => a + b.value, 0) / validPlrs.length) : 0;
    };

    return {
      defense: calcAvg(defensePlayers),
      midfield: calcAvg(midfieldPlayers),
      attack: calcAvg(attackPlayers)
    };
  }, [players]);

  const equilibriumScore = useMemo(() => {
    const validPlayers = players.filter(p => p.value > 0);
    if (validPlayers.length === 0) return { score: "10.0", details: [], sumOfDiffs: "0.0", diffSec: "0.0" };

    let score = 10.0;
    const details: string[] = [];

    const { defense, midfield, attack } = sectorAverages;
    const averages = [defense, midfield, attack].sort((a, b) => b - a);
    const dominant = averages[0];
    const weakest = averages[2];

    const gap = dominant - weakest;
    const toleranciaA = dominant * 0.35;

    // Regra A: Desnível Estrutural
    let penaltyA = 0;
    if (gap > toleranciaA) {
      penaltyA = (gap - toleranciaA) / 40;
      penaltyA = Math.floor(penaltyA * 10) / 10;
      if (penaltyA < 0.1) penaltyA = 0.1;
      
      score -= penaltyA;
      details.push(`Regra A (Desnível > ${toleranciaA.toFixed(1)}): -${penaltyA.toFixed(1)}`);
    }

    // Regra C: Raio-X Individual
    let totalPenaltyC = 0;
    if (validPlayers.length > 0) {
      const craqueDefesa = Math.max(...validPlayers.filter(p => ['GK', 'DC', 'DL', 'DR'].includes(p.position)).map(p => p.value), 0);
      const craqueMeio = Math.max(...validPlayers.filter(p => ['DMC', 'MC', 'ML', 'MR'].includes(p.position)).map(p => p.value), 0);
      const craqueAtaque = Math.max(...validPlayers.filter(p => ['AMC', 'AML', 'AMR', 'ST'].includes(p.position)).map(p => p.value), 0);

      const individualDetails: string[] = [];

      validPlayers.forEach(p => {
        let craque = 0;
        if (['GK', 'DC', 'DL', 'DR'].includes(p.position)) craque = craqueDefesa;
        else if (['DMC', 'MC', 'ML', 'MR'].includes(p.position)) craque = craqueMeio;
        else if (['AMC', 'AML', 'AMR', 'ST'].includes(p.position)) craque = craqueAtaque;

        if (craque > 0) {
          const diff_pct = (craque - p.value) / craque;
          if (diff_pct > 0.333) {
            let pC = 0;
            if (diff_pct > 0.90) pC = 0.6;
            else if (diff_pct >= 0.74) pC = 0.5;
            else if (diff_pct >= 0.64) pC = 0.4;
            else if (diff_pct >= 0.54) pC = 0.3;
            else if (diff_pct >= 0.44) pC = 0.2;
            else pC = 0.1;

            if (['DL', 'DR', 'ML', 'MR', 'AML', 'AMR'].includes(p.position)) {
              pC = pC * 0.5;
            }

            if (pC > 0) {
              totalPenaltyC += pC;
              individualDetails.push(`${p.position} (-${pC.toFixed(2)})`);
            }
          }
        }
      });

      if (totalPenaltyC > 0) {
        let appliedPenaltyC = totalPenaltyC;
        if (penaltyA === 0 && totalPenaltyC > 1.0) {
          appliedPenaltyC = 1.0;
          details.push(`Regra C (Mutantes) [COM TRAVA]: -1.0`);
          details.push(`  -> Original: -${totalPenaltyC.toFixed(2)} (${individualDetails.join(', ')})`);
        } else {
          details.push(`Regra C (Mutantes): -${appliedPenaltyC.toFixed(2)}`);
          if (individualDetails.length > 0) {
              details.push(`  -> ${individualDetails.join(', ')}`);
          }
        }
        score -= appliedPenaltyC;
      }
    }

    score = Math.max(0, Math.min(10, score));

    return {
      score: score.toFixed(1),
      details,
      gap: gap.toFixed(1),
      tolerancia: toleranciaA.toFixed(1)
    };
  }, [sectorAverages, players]);

  // Coordinates helper based on position and count
  const renderPlayers = () => {
     // Generate nodes per position to align them properly
     const elements = [];
     for (const rule of POSITIONS) {
        const posPlayers = players.filter(p => p.position === rule.pos);
        const canAdd = posPlayers.length < rule.max && players.length < 11;

        let x = 0;
        // Base X
        if (rule.pos === 'GK') x = 5;
        if (rule.pos === 'DC') x = 20;
        if (['DL', 'DR'].includes(rule.pos)) x = 28;
        if (rule.pos === 'DMC') x = 35;
        if (rule.pos === 'MC') x = 50;
        if (['ML', 'MR'].includes(rule.pos)) x = 58;
        if (rule.pos === 'AMC') x = 65;
        if (['AML', 'AMR'].includes(rule.pos)) x = 73;
        if (rule.pos === 'ST') x = 85;

        // Base Y
        const totalItems = posPlayers.length + (canAdd ? 1 : 0);
        let ys: string[] = [];
        
        if (['DL', 'DR', 'ML', 'MR', 'AML', 'AMR'].includes(rule.pos)) {
           if (['DL', 'ML', 'AML'].includes(rule.pos)) ys = ['12%'];
           if (['DR', 'MR', 'AMR'].includes(rule.pos)) ys = ['88%'];
        } else if (['GK'].includes(rule.pos)) {
           ys = ['50%'];
        } else if (['DC', 'MC'].includes(rule.pos)) {
           if (totalItems === 1) ys = ['50%'];
           else if (totalItems === 2) ys = ['33%', '67%'];
           else ys = ['24%', '50%', '76%'];
        } else if (['DMC', 'AMC', 'ST'].includes(rule.pos)) {
           if (totalItems === 1) ys = ['50%'];
           else ys = ['35%', '65%'];
        }

        posPlayers.forEach((player, idx) => {
            elements.push(
               <div key={player.id} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 group z-20" style={{ left: `${x}%`, top: ys[idx] || '50%'}}>
                  <button 
                     onClick={() => handleRemovePlayer(player.id)}
                     className="absolute -top-6 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:-translate-y-1 z-30"
                     title="Remover"
                  >
                     <Trash size={12} className="text-white"/>
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-strongs-gold to-yellow-600 border-2 border-white text-black font-extrabold flex items-center justify-center text-sm shadow-xl">
                     {player.position}
                  </div>
                  <input
                     type="number"
                     placeholder="Val"
                     value={player.value || ''}
                     onChange={(e) => handleUpdateValue(player.id, e.target.value)}
                     className="w-12 h-6 text-xs text-center mt-1 bg-black/80 font-bold border border-white/30 rounded text-strongs-gold outline-none focus:border-strongs-gold shadow-md"
                  />
               </div>
            );
        });

        if (canAdd) {
            elements.push(
               <button 
                  key={`add-${rule.pos}`} 
                  onClick={() => handleAddPlayer(rule.pos)}
                  className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity z-10" 
                  style={{ left: `${x}%`, top: ys[posPlayers.length] || '50%'}}
                  title={`Adicionar ${rule.pos}`}
               >
                  <div className="w-10 h-10 border-2 border-dashed border-white/50 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/60 text-white/70 hover:text-white shadow-xl">
                     <Plus size={16} />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-white/50 bg-black/40 px-1 rounded">{rule.pos}</span>
               </button>
            );
        }
     }
     
     return elements;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Metrics & Warning Bar */}
      <div className="flex flex-col gap-4 items-center justify-center bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-xl">
         {/* Mobile Metrics (hidden on md) */}
         <div className="flex flex-row gap-4 w-full justify-center md:hidden">
            <div className="relative">
              <button 
                 onClick={() => setIsAvgExpanded(!isAvgExpanded)}
                 className="bg-black/80 border border-gray-600 rounded-lg p-2 shadow-sm flex items-center gap-2 hover:bg-black transition-colors"
              >
                 <div className="flex flex-col items-start px-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Média Geral</span>
                    <span className="text-xl font-display font-bold text-strongs-gold">{averageValue.toFixed(1)}</span>
                 </div>
                 <ChevronDown size={16} className={`text-gray-400 transition-transform ${isAvgExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isAvgExpanded && (
                 <div className="absolute top-full left-0 mt-2 bg-black/90 border border-gray-700 rounded-lg p-3 z-50 shadow-2xl flex flex-col gap-2 min-w-[140px] animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                       <span className="text-xs text-gray-400 font-bold">Defesa</span>
                       <span className="text-sm text-green-400 font-bold">{sectorAverages.defense.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                       <span className="text-xs text-gray-400 font-bold">Meio-Campo</span>
                       <span className="text-sm text-blue-400 font-bold">{sectorAverages.midfield.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-gray-400 font-bold">Ataque</span>
                       <span className="text-sm text-red-400 font-bold">{sectorAverages.attack.toFixed(1)}</span>
                    </div>
                 </div>
              )}
            </div>

            <div className="bg-black/80 border border-gray-600 rounded-lg p-2 shadow-sm flex items-center gap-2">
               <div className="flex flex-col items-start px-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Equilíbrio</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-xl font-display font-bold text-blue-400">{equilibriumScore.score}</span>
                     <span className="text-[10px] text-gray-500 font-medium">±0.2</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-full text-center flex justify-center">
            <div className="animate-pulse bg-red-900/80 border border-red-500 rounded inline-flex items-center justify-center py-2 px-4 shadow-md">
               <span className="text-[10px] md:text-xs text-white font-bold uppercase tracking-wider text-center">
                  Atenção: A calculadora de equilíbrio está em fase de testes e não é 100% precisa
               </span>
            </div>
         </div>
      </div>

      {/* Field Area */}
      {(() => {
        const fieldContent = (
          <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] bg-black/95 p-0 sm:p-2 flex items-center justify-center' : 'bg-green-800/20 p-4 rounded-xl border border-gray-700 shadow-xl overflow-hidden relative'}`}>
             <div className={`relative bg-[#4c8435] rounded-sm overflow-hidden shadow-inner border-zinc-500/50 ${isFullscreen ? 'w-full h-full sm:w-[98vw] sm:h-[98vh] border-2 aspect-[auto] sm:aspect-[16/10] max-h-screen' : 'w-full aspect-[4/3] md:aspect-[3/2] min-[1300px]:aspect-[16/10] border-2 border-white/40'}`}>
                
                {/* Fullscreen Toggle */}
                <button 
                   onClick={() => setIsFullscreen(!isFullscreen)}
                   className="absolute top-2 right-2 md:top-4 md:right-4 z-50 bg-black/60 hover:bg-black/90 border border-white/20 rounded p-2 text-white shadow-xl transition-colors"
                   title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                   {isFullscreen ? <X size={24} className="text-red-400 hover:text-red-300" /> : <Maximize size={20} />}
                </button>

                {/* Desktop Metrics (Inside Field) */}
                <div className="hidden md:flex absolute top-4 left-4 z-40 flex-row gap-2">
                   <div className="relative">
                     <button 
                        onClick={() => setIsAvgExpanded(!isAvgExpanded)}
                        className="bg-black/80 border border-gray-600 rounded-lg p-2 shadow-xl flex items-center gap-2 hover:bg-black transition-colors"
                     >
                        <div className="flex flex-col items-start px-2">
                           <span className="text-[10px] text-gray-400 font-bold uppercase">Média Geral</span>
                           <span className="text-xl font-display font-bold text-strongs-gold">{averageValue.toFixed(1)}</span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isAvgExpanded ? 'rotate-180' : ''}`} />
                     </button>
                     {isAvgExpanded && (
                        <div className="absolute top-full left-0 mt-2 bg-black/90 border border-gray-700 rounded-lg p-3 shadow-2xl flex flex-col gap-2 min-w-[140px] animate-fadeIn">
                           <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                              <span className="text-xs text-gray-400 font-bold">Defesa</span>
                              <span className="text-sm text-green-400 font-bold">{sectorAverages.defense.toFixed(1)}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                              <span className="text-xs text-gray-400 font-bold">Meio-Campo</span>
                              <span className="text-sm text-blue-400 font-bold">{sectorAverages.midfield.toFixed(1)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-bold">Ataque</span>
                              <span className="text-sm text-red-400 font-bold">{sectorAverages.attack.toFixed(1)}</span>
                           </div>
                        </div>
                     )}
                   </div>

                   <div className="bg-black/80 border border-gray-600 rounded-lg p-2 shadow-xl flex items-center gap-2">
                      <div className="flex flex-col items-start px-2">
                         <span className="text-[10px] text-gray-400 font-bold uppercase">Equilíbrio</span>
                         <div className="flex items-baseline gap-1">
                            <span className="text-xl font-display font-bold text-blue-400">{equilibriumScore.score}</span>
                            <span className="text-[10px] text-gray-500 font-medium">±0.2</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Background Logo */}
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none overflow-hidden">
                   <img src="https://i.imgur.com/nArNLdF.png" alt="Strongs Brazil" className="absolute inset-0 w-full h-full object-cover" />
                </div>

                {/* Pitch Markings */}
                <div className="absolute inset-x-0 inset-y-[2%] border-y-2 border-x-2 border-white/30 rounded-sm pointer-events-none"></div>
                {/* Center Line & Circle */}
                <div className="absolute top-[2%] bottom-[2%] left-1/2 w-[2px] bg-white/30 -translate-x-1/2 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 w-[20%] pt-[20%] border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-[4px] h-[4px] bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                {/* Penalty Areas */}
                <div className="absolute top-[20%] bottom-[20%] left-[2%] w-[15%] border-2 border-l-0 border-white/30 pointer-events-none"></div>
                <div className="absolute top-[20%] bottom-[20%] right-[2%] w-[15%] border-2 border-r-0 border-white/30 pointer-events-none"></div>
                
                {/* Goal Areas */}
                <div className="absolute top-[35%] bottom-[35%] left-[2%] w-[6%] border-2 border-l-0 border-white/30 pointer-events-none"></div>
                <div className="absolute top-[35%] bottom-[35%] right-[2%] w-[6%] border-2 border-r-0 border-white/30 pointer-events-none"></div>

                {/* Arcs */}
                <div className="absolute top-1/2 left-[17%] w-[7%] pt-[7%] border-2 border-l-0 border-t-white/30 border-r-white/30 border-b-white/30 rounded-r-full -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute top-1/2 right-[17%] w-[7%] pt-[7%] border-2 border-r-0 border-t-white/30 border-l-white/30 border-b-white/30 rounded-l-full -translate-y-1/2 pointer-events-none"></div>

                {/* Grid overlay based on image logic (optional but looks cool) */}
                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
                   <div className="flex-1 flex border-b border-black">
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25]" />
                   </div>
                   <div className="flex-1 flex border-b border-black">
                       <div className="flex-[0.18]" />
                       <div className="flex-[0.14] border-l border-r border-black" />
                       <div className="flex-[0.18] border-r border-black" />
                       <div className="flex-[0.20] border-r border-black" />
                       <div className="flex-[0.18] border-r border-black" />
                       <div className="flex-[0.12]" />
                   </div>
                   <div className="flex-1 flex">
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25] border-r border-black" />
                       <div className="flex-[0.25]" />
                   </div>
                </div>

                {/* Players */}
                {renderPlayers()}
             </div>
          </div>
        );
        return isFullscreen ? createPortal(fieldContent, document.body) : fieldContent;
      })()}

      <div className="flex flex-col gap-6">
         <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 font-bold">Jogadores em Campo: <span className={players.length === 11 ? 'text-green-500' : 'text-white'}>{players.length}/11</span></span>
            <button onClick={handleClear} disabled={players.length === 0} className="text-sm text-red-500 hover:text-red-400 font-bold disabled:opacity-50 flex items-center gap-1">
               <Trash size={16}/> Limpar Campo
            </button>
         </div>

         <div className="grid grid-cols-1 min-[1300px]:grid-cols-2 gap-6 w-full">
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-xl">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2 md:mb-0">
                     Resumo do <span className="text-strongs-gold">Time</span>
                  </h3>
                  <div className="bg-black/50 border border-gray-700 px-4 py-2 rounded-lg flex items-center justify-between min-w-[200px]">
                      <span className="text-xs font-bold text-gray-400 mr-4">MÉDIA GERAL (OVERALL)</span>
                      <span className="text-xl font-display font-bold text-strongs-gold">{averageValue.toFixed(1)}%</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-900/40 border border-green-800/50 p-2 rounded-lg text-center">
                     <div className="text-[10px] sm:text-xs text-green-300 font-bold mb-1 uppercase tracking-wider">Defesa</div>
                     <div className="text-lg font-bold text-white">{sectorAverages.defense.toFixed(1)}%</div>
                  </div>
                  <div className="bg-blue-900/40 border border-blue-800/50 p-2 rounded-lg text-center">
                     <div className="text-[10px] sm:text-xs text-blue-300 font-bold mb-1 uppercase tracking-wider">Meio-Campo</div>
                     <div className="text-lg font-bold text-white">{sectorAverages.midfield.toFixed(1)}%</div>
                  </div>
                  <div className="bg-red-900/40 border border-red-800/50 p-2 rounded-lg text-center">
                     <div className="text-[10px] sm:text-xs text-red-300 font-bold mb-1 uppercase tracking-wider">Ataque</div>
                     <div className="text-lg font-bold text-white">{sectorAverages.attack.toFixed(1)}%</div>
                  </div>
               </div>
               
               <div className="space-y-3">
                  {validation.errors.length > 0 && (
                     <div className="bg-red-900/30 border border-red-900/50 p-3 rounded-lg flex flex-col gap-1">
                        <div className="flex items-center text-red-400 font-bold text-sm mb-1">
                           <AlertTriangle size={16} className="mr-2"/> Erros de Formação
                        </div>
                        {validation.errors.map((err, i) => (
                           <p key={i} className="text-xs text-red-200/80">• {err}</p>
                        ))}
                     </div>
                  )}
                  
                  {validation.warnings.length > 0 && (
                     <div className="bg-yellow-900/20 border border-yellow-900/30 p-3 rounded-lg flex flex-col gap-1">
                        <div className="flex items-center text-yellow-500 font-bold text-sm mb-1">
                           <Info size={16} className="mr-2"/> Avisos
                        </div>
                        {validation.warnings.map((warn, i) => (
                           <p key={i} className="text-xs text-yellow-200/70">• {warn}</p>
                        ))}
                     </div>
                  )}

                  {validation.isValid && (
                     <div className="bg-green-900/20 border border-green-900/30 p-4 rounded-lg flex items-center text-green-400">
                        <CheckCircle2 size={24} className="mr-3"/>
                        <div>
                           <p className="font-bold">Formação Válida</p>
                           <p className="text-xs text-green-200/70 opacity-80">Esta formação atende a todas as regras da confederação.</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-xl">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2 md:mb-0">
                     Calculadora de <span className="text-strongs-gold">Equilíbrio</span>
                  </h3>
               </div>
               
               <div className="flex flex-col items-center justify-center gap-4">
                  <div className="bg-black/50 border border-gray-700 px-8 py-6 rounded-lg flex flex-col items-center justify-center w-full max-w-sm">
                      <span className="text-xs font-bold text-gray-400 mb-2 tracking-widest">NOTA FINAL</span>
                      <span className={`text-6xl font-display font-bold ${Number(equilibriumScore.score) >= 9 ? 'text-green-500' : Number(equilibriumScore.score) >= 7 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {equilibriumScore.score}
                      </span>
                  </div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};
