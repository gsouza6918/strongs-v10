import React, { useState, useMemo } from 'react';
import { AppData, ConfTier } from '../types';
import { calculateMemberPoints, calculateTop100Points } from '../utils';
import { Trophy, Medal, Star, Crown } from 'lucide-react';

interface RankingsProps {
  data: AppData;
}

type RankingType = 'CONFEDERATIONS' | 'MEMBERS' | 'TOP100';

export const Rankings: React.FC<RankingsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<RankingType>('CONFEDERATIONS');

  // --- CONFEDERATION RANKING CALC ---
  const confRanking = useMemo(() => {
    return data.confederations
      .filter(conf => conf.active !== false) // Only show active confederations
      .map(conf => {
        const confMembers = data.members.filter(m => m.confId === conf.id);
        const totalPoints = confMembers.reduce((sum, member) => sum + calculateMemberPoints(member, conf.tier), 0);
        return { ...conf, totalPoints, memberCount: confMembers.length };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [data.confederations, data.members]);

  // --- MEMBER RANKING CALC ---
  const memberRanking = useMemo(() => {
    return data.members.map(member => {
      const conf = data.confederations.find(c => c.id === member.confId);
      if (!conf) return { ...member, points: 0, confName: 'Unknown', confImage: undefined };
      const points = calculateMemberPoints(member, conf.tier);
      return { ...member, points, confName: conf.name, confTier: conf.tier, confImage: conf.imageUrl };
    }).sort((a, b) => b.points - a.points);
  }, [data.members, data.confederations]);

  // --- TOP 100 HISTORY CALC ---
  const top100Ranking = useMemo(() => {
    const confPoints: Record<string, { points: number, entries: any[], confName: string, confImage?: string }> = {};

    // Initialize with all confs to show 0 if needed
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


  // Helper for Top 3 styling
  const getRankStyle = (index: number) => {
    if (index === 0) return {
      wrapper: "bg-gradient-to-r from-yellow-900/50 to-black border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-[1.02]",
      badge: "bg-yellow-400 text-black",
      icon: <Crown size={20} className="text-black" />,
      text: "text-yellow-400"
    };
    if (index === 1) return {
      wrapper: "bg-gradient-to-r from-slate-800 to-black border border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.2)]",
      badge: "bg-slate-300 text-black",
      icon: <Medal size={20} className="text-black" />,
      text: "text-slate-300"
    };
    if (index === 2) return {
      wrapper: "bg-gradient-to-r from-orange-900/40 to-black border border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.2)]",
      badge: "bg-orange-600 text-white",
      icon: <Medal size={20} className="text-white" />,
      text: "text-orange-500"
    };
    return {
      wrapper: "bg-gray-900/50 border border-gray-700 hover:border-gray-600",
      badge: "bg-gray-800 text-gray-400",
      icon: null,
      text: "text-gray-400"
    };
  };


  const RenderConfRanking = () => (
    <div className="space-y-4">
      {confRanking.map((conf, index) => {
        const style = getRankStyle(index);
        return (
          <div key={conf.id} className={`p-4 rounded-lg flex items-center justify-between transition-all relative overflow-hidden ${style.wrapper}`}>
             {/* Glow effect for top 1 */}
             {index === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>}

            <div className="flex items-center space-x-4 relative z-10">
              <div className={`w-12 h-12 flex items-center justify-center font-display text-2xl font-bold rounded shadow-lg ${style.badge}`}>
                {style.icon || `#${index + 1}`}
              </div>
              
              {conf.imageUrl ? (
                <img src={conf.imageUrl} alt={conf.name} className="w-12 h-12 object-contain rounded-full bg-black/50 border border-gray-700" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                  <Trophy size={20} />
                </div>
              )}

              <div>
                <h3 className={`text-xl font-display font-bold ${index === 0 ? 'text-white text-2xl' : 'text-white'}`}>{conf.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    conf.tier === ConfTier.SUPREME ? 'bg-purple-900 text-purple-200' :
                    conf.tier === ConfTier.DIAMOND ? 'bg-blue-900 text-blue-200' :
                    conf.tier === ConfTier.PLATINUM ? 'bg-slate-600 text-white' :
                    'bg-yellow-900 text-yellow-200'
                  }`}>{conf.tier}</span>
                  <span>{conf.memberCount} Membros</span>
                </div>
              </div>
            </div>
            <div className="text-right relative z-10">
              <span className={`block font-display font-bold ${style.text} ${index === 0 ? 'text-4xl' : 'text-2xl'}`}>{conf.totalPoints.toFixed(2)}</span>
              <span className="text-xs text-gray-500 uppercase">Pontos Totais</span>
            </div>
          </div>
        );
      })}
      {confRanking.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma confederação ativa cadastrada.</p>}
    </div>
  );

  const RenderMemberRanking = () => (
    <div className="space-y-4">
      {memberRanking.map((member, index) => {
        const style = getRankStyle(index);
        return (
          <div key={member.id} className={`p-3 rounded-lg flex items-center justify-between transition-all ${style.wrapper}`}>
            <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 flex items-center justify-center font-display text-lg font-bold rounded ${style.badge}`}>
                {style.icon || (index + 1)}
              </div>
              {member.confImage && <img src={member.confImage} alt="Conf" className="w-8 h-8 rounded-full object-contain bg-black/40" />}
              <div>
                <h3 className={`font-bold ${index === 0 ? 'text-white text-lg' : 'text-white'}`}>{member.name}</h3>
                <p className="text-xs text-gray-400">{member.teamName} • {member.confName}</p>
              </div>
            </div>
            <div className="text-right">
               <span className={`block font-display font-bold ${style.text} ${index === 0 ? 'text-3xl' : 'text-xl'}`}>{member.points.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
       {memberRanking.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum membro ativo.</p>}
    </div>
  );

  const RenderTop100Ranking = () => (
    <div className="space-y-8">
      {/* The Ranking */}
      <div className="space-y-4">
        {top100Ranking.map((item, index) => {
          const style = getRankStyle(index);
          // Custom override for Top 100 visual to be distinct but similar hierarchy
          return (
            <div key={index} className={`rounded-lg p-4 shadow-lg transition-all ${style.wrapper}`}>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                   <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-full ${style.badge}`}>
                      {style.icon || (index + 1)}
                   </div>
                   {item.confImage && <img src={item.confImage} alt={item.confName} className="w-12 h-12 rounded-full object-contain bg-black/40 border border-gray-600" />}
                   <h3 className={`text-2xl font-display font-bold ${index === 0 ? 'text-white' : 'text-gray-200'}`}>{item.confName}</h3>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-display font-bold ${style.text}`}>{item.points}</span>
                  <span className="block text-xs text-gray-500">PONTOS DE HISTÓRICO</span>
                </div>
              </div>
              
              {/* The Log */}
              <div className="bg-black/30 rounded p-2 text-sm border-t border-white/5">
                <h4 className="text-gray-400 uppercase text-xs font-bold mb-2 pb-1">Histórico de Conquistas</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {item.entries.sort((a, b) => parseInt(b.season) - parseInt(a.season)).map((entry: any, i: number) => (
                    <div key={i} className="flex justify-between text-gray-300 text-xs border-b border-gray-800/50 pb-1 last:border-0">
                      <span>Temp {entry.season} • <span className="text-white">Top {entry.rank}</span></span>
                      <span className="text-strongs-gold">+{entry.earnedPoints} pts</span>
                    </div>
                  ))}
                  {item.entries.length === 0 && <span className="text-gray-600 italic">Sem registros.</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
          Rankings <span className="text-strongs-gold">Strongs</span>
        </h2>
        <div className="w-24 h-1 bg-strongs-gold mx-auto rounded-full"></div>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="inline-flex bg-gray-900 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('CONFEDERATIONS')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase transition-all ${activeTab === 'CONFEDERATIONS' ? 'bg-strongs-gold text-strongs-darker shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Confederações
          </button>
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase transition-all ${activeTab === 'MEMBERS' ? 'bg-strongs-gold text-strongs-darker shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Membros
          </button>
          <button
            onClick={() => setActiveTab('TOP100')}
            className={`px-6 py-2 rounded-md text-sm font-bold uppercase transition-all ${activeTab === 'TOP100' ? 'bg-strongs-gold text-strongs-darker shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Histórico Top 100
          </button>
        </div>
      </div>

      <div className="bg-strongs-dark/80 backdrop-blur-md border border-gray-800 p-6 rounded-xl shadow-2xl">
        {activeTab === 'CONFEDERATIONS' && <RenderConfRanking />}
        {activeTab === 'MEMBERS' && <RenderMemberRanking />}
        {activeTab === 'TOP100' && <RenderTop100Ranking />}
      </div>
    </div>
  );
};