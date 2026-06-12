import React, { useState, useMemo } from 'react';
import { AppData, ConfTier } from '../types';
import { calculateMemberPoints, calculateTop100Points } from '../utils';
import { Trophy, Medal, Star, Crown, History, Sparkles } from 'lucide-react';

import { User, UserRole } from '../types';

interface RankingsProps {
  data: AppData;
  currentUser?: User | null;
}

type RankingType = 'TOP100' | 'COPA_STRONGS';

export const Rankings: React.FC<RankingsProps> = ({ data, currentUser }) => {
  const [activeTab, setActiveTab] = useState<RankingType>('TOP100');

  // --- TOP 100 HISTORY CALC (Always uses live history data) ---
  const top100Ranking = useMemo(() => {
    const confPoints: Record<string, { points: number, entries: any[], confName: string, confImage?: string }> = {};

    // Initialize with all confs to show 0 if needed (Using LIVE confs for names/images in Top 100)
    data.confederations.forEach(c => {
      confPoints[c.id] = { points: 0, entries: [], confName: c.name, confImage: c.imageUrl };
    });

    data.top100History.forEach(entry => {
      const { points, bonus } = calculateTop100Points(entry.rank);
      const totalEntryPoints = points + bonus;
      
      if (confPoints[entry.confId]) {
        confPoints[entry.confId].points += totalEntryPoints;
        confPoints[entry.confId].entries.push({
          ...entry,
          earnedPoints: totalEntryPoints
        });
      }
    });

    return Object.values(confPoints).sort((a, b) => b.points - a.points);
  }, [data.confederations, data.top100History]);


  // --- COPA STRONGS RANKING CALC ---
  const copaStrongsRanking = useMemo(() => {
    if (!data.copaStrongs) return [];
    
    return data.copaStrongs.map(participant => {
      let points = 0;
      let campeao = 0;
      let vice = 0;
      let terceiro = 0;
      
      (participant.results || []).forEach(result => {
        if (result.position === 'Campeão') { points += 20; campeao++; }
        else if (result.position === 'Vice-Campeão') { points += 10; vice++; }
        else if (result.position === 'Terceiro Lugar') { points += 5; terceiro++; }
      });
      
      return { ...participant, points, campeao, vice, terceiro };
    }).sort((a, b) => b.points - a.points);
  }, [data.copaStrongs]);


  // Helper for Top 3 styling
  const getRankStyle = (index: number) => {
    if (index === 0) return {
      wrapper: "bg-gradient-to-r from-yellow-900/50 to-black border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-[1.01] md:scale-[1.02]",
      badge: "bg-yellow-400 text-black",
      icon: <Crown className="w-4 h-4 md:w-5 md:h-5 text-black" />,
      text: "text-yellow-400"
    };
    if (index === 1) return {
      wrapper: "bg-gradient-to-r from-slate-800 to-black border border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.2)]",
      badge: "bg-slate-300 text-black",
      icon: <Medal className="w-4 h-4 md:w-5 md:h-5 text-black" />,
      text: "text-slate-300"
    };
    if (index === 2) return {
      wrapper: "bg-gradient-to-r from-orange-900/40 to-black border border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.2)]",
      badge: "bg-orange-600 text-white",
      icon: <Medal className="w-4 h-4 md:w-5 md:h-5 text-white" />,
      text: "text-orange-500"
    };
    return {
      wrapper: "bg-gray-900/50 border border-gray-700 hover:border-gray-600",
      badge: "bg-gray-800 text-gray-400",
      icon: null,
      text: "text-gray-400"
    };
  };

  // Helper for Historical Log Entry styling
  const getEntryEffect = (rank: number) => {
    if (rank === 1) return "rank-effect-1 text-yellow-200 animate-pulse-gold";
    if (rank === 2) return "rank-effect-2 text-gray-200";
    if (rank === 3) return "rank-effect-3 text-orange-200";
    if (rank <= 10) return "rank-effect-10 text-blue-100";
    return "border-b border-gray-800/50 text-gray-400";
  };


  const RenderTop100Ranking = () => (
    <div className="space-y-6 md:space-y-8">
      {/* The Ranking */}
      <div className="space-y-4">
        {top100Ranking.map((item, index) => {
          const style = getRankStyle(index);
          return (
            <div key={index} className={`rounded-lg p-4 shadow-lg transition-all ${style.wrapper}`}>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 relative z-10 gap-2">
                <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto">
                   <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold rounded-full ${style.badge}`}>
                      {style.icon || (index + 1)}
                   </div>
                   {item.confImage && <img src={item.confImage} alt={item.confName} className="w-12 h-12 rounded-full object-contain bg-black/40 border border-gray-600" />}
                   <h3 className={`text-xl md:text-2xl font-display font-bold truncate ${index === 0 ? 'text-white' : 'text-gray-200'}`}>
                     {item.confName}
                   </h3>
                </div>
                <div className="self-end md:self-auto text-right">
                  <span className={`text-2xl md:text-3xl font-display font-bold ${style.text}`}>{item.points}</span>
                  <span className="block text-[10px] md:text-xs text-gray-500">PONTOS HISTÓRICO</span>
                </div>
              </div>
              
              {/* The Log */}
              <div className="bg-black/30 rounded p-2 text-sm border-t border-white/5">
                <h4 className="text-gray-400 uppercase text-[10px] md:text-xs font-bold mb-2 pb-1">Histórico de Conquistas</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {item.entries.sort((a, b) => {
                      // Primary: Rank (Low number = Higher Rank) -> Ascending
                      if (a.rank !== b.rank) return a.rank - b.rank;
                      // Secondary: Season (High number = Recent) -> Descending
                      return parseInt(b.season) - parseInt(a.season);
                  }).map((entry: any, i: number) => {
                    const rowEffect = getEntryEffect(entry.rank);
                    return (
                      <div key={i} className={`flex justify-between text-xs p-1.5 rounded transition-all hover:bg-white/5 ${rowEffect}`}>
                        <span className="flex items-center gap-2">
                          {entry.rank === 1 && <Trophy size={12} className="text-yellow-400" />}
                          {entry.rank === 2 && <Medal size={12} className="text-gray-300" />}
                          {entry.rank === 3 && <Medal size={12} className="text-orange-400" />}
                          {entry.rank > 3 && entry.rank <= 10 && <Star size={12} className="text-blue-400" />}
                          Temp {entry.season} • <span className={`font-bold ${entry.rank <= 3 ? 'text-white' : ''}`}>Top {entry.rank}</span>
                        </span>
                        <span className={`${entry.rank === 1 ? 'text-white font-bold' : 'text-strongs-gold'}`}>+{entry.earnedPoints} pts</span>
                      </div>
                    );
                  })}
                  {item.entries.length === 0 && <span className="text-gray-600 italic">Sem registros.</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const RenderCopaStrongsRanking = () => {
    const currentChampionId = data.settings?.copaStrongsCurrentChampionId;
    const currentChampion = copaStrongsRanking.find(p => p.id === currentChampionId);

    return (
    <div className="space-y-4 md:space-y-8">
      {/* Current Champion Highlight */}
      {currentChampion && (
        <div className="mb-8 md:mb-12">
          <div className="text-center mb-6">
            <h3 className="inline-block text-xl md:text-2xl font-display font-bold text-yellow-400 uppercase tracking-widest border-b-2 border-yellow-400/50 pb-1 flex items-center justify-center gap-3">
              <Crown className="text-yellow-400" size={24} />
              Atual Campeão
              <Crown className="text-yellow-400" size={24} />
            </h3>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-transparent border border-yellow-500/30 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 relative overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.15)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                {currentChampion.avatarUrl ? (
                  <img src={currentChampion.avatarUrl} alt={currentChampion.name} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)]" />
                ) : (
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-900 border-4 border-yellow-400 flex items-center justify-center text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                    <Star size={64} />
                  </div>
                )}
                <div className="absolute -bottom-4 -right-4 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-yellow-400 rounded-full border-4 border-black text-black">
                  <Trophy size={28} />
                </div>
              </div>
            </div>

            <div className="relative z-10 text-center md:text-left flex flex-col items-center md:items-start">
              <h4 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 leading-tight flex items-center gap-3">
                {currentChampion.name}
              </h4>
              {currentChampion.confederationId && (
                 <span className="bg-black/50 border border-gray-700 text-gray-300 px-3 py-1 rounded text-sm md:text-base font-bold mb-4 inline-block uppercase tracking-wider">
                   {data.confederations.find(c => c.id === currentChampion.confederationId)?.name || 'Confederação Removida'}
                 </span>
              )}
              <div className="flex gap-4 md:gap-6 bg-black/40 p-3 md:p-4 rounded-xl border border-yellow-500/20 backdrop-blur-sm mt-2 md:mt-4">
                  <div className="flex flex-col items-center">
                    <Trophy size={24} className="text-yellow-400 mb-1" fill="currentColor" />
                    <span className="text-xl md:text-2xl font-bold text-white">{currentChampion.campeao}</span>
                    <span className="text-[10px] md:text-xs text-yellow-400/80 uppercase font-bold tracking-wider">Ouros</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Trophy size={24} className="text-slate-300 mb-1" fill="currentColor" />
                    <span className="text-xl md:text-2xl font-bold text-white">{currentChampion.vice}</span>
                    <span className="text-[10px] md:text-xs text-slate-300/80 uppercase font-bold tracking-wider">Pratas</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Medal size={24} className="text-orange-600 mb-1" fill="currentColor" />
                    <span className="text-xl md:text-2xl font-bold text-white">{currentChampion.terceiro}</span>
                    <span className="text-[10px] md:text-xs text-orange-600/80 uppercase font-bold tracking-wider">Bronzes</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Ranking List */}
      <div className="text-center mb-6 mt-12">
        <h3 className="inline-block text-xl md:text-2xl font-display font-bold text-white uppercase tracking-widest pb-1 flex items-center justify-center gap-3">
          <Trophy className="text-strongs-gold" size={24} />
          Maiores Campeões
          <Trophy className="text-strongs-gold" size={24} />
        </h3>
      </div>
      <div className="space-y-4">
      {copaStrongsRanking.map((participant, index) => {
        const style = getRankStyle(index);
        const confName = participant.confederationId ? data.confederations.find(c => c.id === participant.confederationId)?.name : null;

        return (
          <div key={participant.id} className={`p-4 md:p-6 rounded-lg flex flex-col md:flex-row items-center justify-between transition-all relative overflow-hidden gap-4 md:gap-6 ${style.wrapper}`}>
            {index === 0 && <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-yellow-500/10 blur-3xl rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20 pointer-events-none"></div>}

            <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6 relative z-10 w-full md:w-auto flex-1 min-w-0">
              <div className="relative">
                {participant.avatarUrl ? (
                  <img src={participant.avatarUrl} alt={participant.name} className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 object-cover rounded-full bg-black/50 border-[3px] border-gray-600 shadow-xl" />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 border-[3px] border-gray-600 shadow-xl">
                    <Star size={32} />
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-display text-lg md:text-2xl font-bold rounded-full shadow-lg border-2 border-gray-900 ${style.badge}`}>
                  {style.icon || `#${index + 1}`}
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left mt-3 md:mt-0">
                <h3 className={`font-display font-bold truncate leading-tight ${index === 0 ? 'text-2xl md:text-3xl text-white' : 'text-xl md:text-2xl text-white'}`}>
                  {participant.name}
                </h3>
                {confName && (
                  <p className="text-gray-400 text-sm md:text-base font-bold uppercase tracking-wider mt-1 truncate">
                    {confName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between w-full md:w-auto relative z-10 gap-3 md:gap-8 bg-black/20 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none">
              <div className="flex gap-4 md:gap-6 bg-black/30 p-2 md:p-3 rounded-lg border border-white/5 shadow-inner">
                <div className="flex flex-col items-center justify-center min-w-[3rem]" title="Campeão">
                  <Trophy size={20} className="text-yellow-400 mb-1" fill="currentColor" />
                  <span className="text-sm md:text-base font-bold text-gray-200">{participant.campeao}</span>
                </div>
                <div className="flex flex-col items-center justify-center min-w-[3rem]" title="Vice-Campeão">
                  <Trophy size={20} className="text-slate-300 mb-1" fill="currentColor" />
                  <span className="text-sm md:text-base font-bold text-gray-200">{participant.vice}</span>
                </div>
                <div className="flex flex-col items-center justify-center min-w-[3rem]" title="Terceiro Lugar">
                  <Medal size={20} className="text-orange-600 mb-1" fill="currentColor" />
                  <span className="text-sm md:text-base font-bold text-gray-200">{participant.terceiro}</span>
                </div>
              </div>

              <div className="text-center md:text-right flex-shrink-0 flex flex-col md:block items-center md:items-end w-full md:w-auto mt-2 md:mt-0">
                <span className={`block font-display font-bold leading-none ${style.text} ${index === 0 ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
                  {participant.points}
                </span>
                <span className="text-[10px] md:text-sm text-gray-500 uppercase font-bold tracking-wider mt-1 md:mt-0 md:ml-1">Pontos</span>
              </div>
            </div>
          </div>
        );
      })}
      {copaStrongsRanking.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum participante encontrado.</p>}
      </div>
    </div>
  );
};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
          Rankings <span className="text-strongs-gold">Strongs</span>
        </h2>
        <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full"></div>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="flex flex-wrap justify-center bg-gray-900 p-1 rounded-lg border border-gray-700 gap-1">
          <button
            onClick={() => setActiveTab('TOP100')}
            className={`px-3 md:px-6 py-2 rounded-md text-xs md:text-sm font-bold uppercase transition-all flex-grow md:flex-grow-0 ${activeTab === 'TOP100' ? 'bg-strongs-gold text-strongs-darker shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Ranking Global
          </button>
          <button
            onClick={() => setActiveTab('COPA_STRONGS')}
            className={`px-3 md:px-6 py-2 rounded-md text-xs md:text-sm font-bold uppercase transition-all flex-grow md:flex-grow-0 ${activeTab === 'COPA_STRONGS' ? 'bg-strongs-gold text-strongs-darker shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Copa Strongs
          </button>
        </div>
      </div>

      <div className="bg-strongs-dark/80 backdrop-blur-md border border-gray-800 p-4 md:p-6 rounded-xl shadow-2xl">
        {activeTab === 'TOP100' && <RenderTop100Ranking />}
        {activeTab === 'COPA_STRONGS' && <RenderCopaStrongsRanking />}
      </div>
    </div>
  );
};