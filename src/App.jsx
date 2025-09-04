import React, { useState } from 'react';
import { Trophy, Users, Plus, X, Medal, Star, Calendar, Target } from 'lucide-react';

const PadelCompetitionApp = () => {
  // Initial sample players
  const [players, setPlayers] = useState([
    { id: 1, name: 'Alex', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 2, name: 'Maria', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 3, name: 'Carlos', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 4, name: 'Sofia', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 5, name: 'Diego', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 6, name: 'Ana', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 7, name: 'Luis', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 8, name: 'Carmen', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 9, name: 'Pablo', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 10, name: 'Elena', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 11, name: 'Javier', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 },
    { id: 12, name: 'Isabel', matches: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 1000 }
  ]);

  const [matches, setMatches] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const [matchForm, setMatchForm] = useState({
    team1Player1: '',
    team1Player2: '',
    team2Player1: '',
    team2Player2: '',
    team1Score: '',
    team2Score: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate ELO rating change
  const calculateRatingChange = (winnerRating, loserRating) => {
    const K = 40; // K-factor for ELO rating
    const expectedWin = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    return Math.round(K * (1 - expectedWin));
  };

  // Add new player
  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now(),
        name: newPlayerName.trim(),
        matches: 0,
        wins: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 1000
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  // Remove player
  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  // Add match
  const addMatch = () => {
    const { team1Player1, team1Player2, team2Player1, team2Player2, team1Score, team2Score, date } = matchForm;
    
    // Validation
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2 || !team1Score || !team2Score) {
      alert('Please fill all fields!');
      return;
    }

    const allSelectedPlayers = [team1Player1, team1Player2, team2Player1, team2Player2];
    if (new Set(allSelectedPlayers).size !== 4) {
      alert('All players must be different!');
      return;
    }

    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (score1 === score2) {
      alert('Matches cannot end in a tie!');
      return;
    }

    if (Math.max(score1, score2) < 4) {
      alert('Winner must score at least 4 games!');
      return;
    }

    const team1Won = score1 > score2;
    const scoreDifference = Math.abs(score1 - score2);

    // Create match record
    const newMatch = {
      id: Date.now(),
      team1: [team1Player1, team1Player2],
      team2: [team2Player1, team2Player2],
      score: `${score1}-${score2}`,
      winner: team1Won ? 'team1' : 'team2',
      date
    };

    // Update player statistics
    const updatedPlayers = players.map(player => {
      const isInTeam1 = [team1Player1, team1Player2].includes(player.name);
      const isInTeam2 = [team2Player1, team2Player2].includes(player.name);

      if (isInTeam1 || isInTeam2) {
        const playerWon = (isInTeam1 && team1Won) || (isInTeam2 && !team1Won);
        
        // Calculate team averages for ELO (using current ratings)
        const team1Players = players.filter(p => [team1Player1, team1Player2].includes(p.name));
        const team2Players = players.filter(p => [team2Player1, team2Player2].includes(p.name));
        const team1Avg = team1Players.reduce((sum, p) => sum + p.points, 0) / team1Players.length;
        const team2Avg = team2Players.reduce((sum, p) => sum + p.points, 0) / team2Players.length;

        // Base ELO change
        const baseChange = calculateRatingChange(
          playerWon ? (isInTeam1 ? team1Avg : team2Avg) : (isInTeam1 ? team1Avg : team2Avg),
          playerWon ? (isInTeam1 ? team2Avg : team1Avg) : (isInTeam1 ? team2Avg : team1Avg)
        );

        // Apply score margin bonus/penalty (10% per game difference)
        const marginMultiplier = 1 + (scoreDifference * 0.10);
        const finalChange = Math.round(baseChange * marginMultiplier);

        return {
          ...player,
          matches: player.matches + 1,
          wins: player.wins + (playerWon ? 1 : 0),
          losses: player.losses + (playerWon ? 0 : 1),
          gamesWon: player.gamesWon + (isInTeam1 ? score1 : score2),
          gamesLost: player.gamesLost + (isInTeam1 ? score2 : score1),
          points: player.points + (playerWon ? finalChange : -finalChange)
        };
      }
      return player;
    });

    // Update state
    setPlayers(updatedPlayers);
    setMatches([newMatch, ...matches]);
    
    // Reset form
    setMatchForm({
      team1Player1: '',
      team1Player2: '',
      team2Player1: '',
      team2Player2: '',
      team1Score: '',
      team2Score: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddMatch(false);
  };

  // Delete match
  const deleteMatch = (matchId) => {
    const matchToDelete = matches.find(m => m.id === matchId);
    if (!matchToDelete) return;

    // Reverse the stats
    const [score1, score2] = matchToDelete.score.split('-').map(Number);
    const team1Won = score1 > score2;
    const scoreDifference = Math.abs(score1 - score2);

    const reversedPlayers = players.map(player => {
      const isInTeam1 = matchToDelete.team1.includes(player.name);
      const isInTeam2 = matchToDelete.team2.includes(player.name);

      if (isInTeam1 || isInTeam2) {
        const playerWon = (isInTeam1 && team1Won) || (isInTeam2 && !team1Won);
        
        // Calculate the same changes that were applied
        const team1Players = players.filter(p => matchToDelete.team1.includes(p.name));
        const team2Players = players.filter(p => matchToDelete.team2.includes(p.name));
        const team1Avg = team1Players.reduce((sum, p) => sum + p.points, 0) / team1Players.length;
        const team2Avg = team2Players.reduce((sum, p) => sum + p.points, 0) / team2Players.length;

        const baseChange = calculateRatingChange(
          playerWon ? (isInTeam1 ? team1Avg : team2Avg) : (isInTeam1 ? team1Avg : team2Avg),
          playerWon ? (isInTeam1 ? team2Avg : team1Avg) : (isInTeam1 ? team2Avg : team1Avg)
        );

        const marginMultiplier = 1 + (scoreDifference * 0.10);
        const finalChange = Math.round(baseChange * marginMultiplier);

        return {
          ...player,
          matches: player.matches - 1,
          wins: player.wins - (playerWon ? 1 : 0),
          losses: player.losses - (playerWon ? 0 : 1),
          gamesWon: player.gamesWon - (isInTeam1 ? score1 : score2),
          gamesLost: player.gamesLost - (isInTeam1 ? score2 : score1),
          points: player.points - (playerWon ? finalChange : -finalChange)
        };
      }
      return player;
    });

    setPlayers(reversedPlayers);
    setMatches(matches.filter(m => m.id !== matchId));
  };

  // Get ranking - Simple ELO points based ranking
  const getRanking = () => {
    return [...players]
      .filter(p => p.matches > 0)
      .sort((a, b) => {
        // Primary: ELO points (highest first)
        return b.points - a.points;
      });
  };

  const getWinRate = (player) => {
    return player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
  };

  const getGameWinRate = (player) => {
    const total = player.gamesWon + player.gamesLost;
    return total > 0 ? Math.round((player.gamesWon / total) * 100) : 0;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Star className="w-5 h-5 text-blue-500" />;
  };

  const ranking = getRanking();

  // Padel Court Background Component
const PadelCourtBG = () => (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      pointerEvents: 'none'
    }}
  >
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '48px',
      color: 'white',
      fontWeight: 'bold'
    }}>
      BACKGROUND TEST
    </div>
  </div>
);

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 text-slate-800" style={{backgroundColor: 'red', border: '10px solid blue'}}>
    <PadelCourtBG />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-700 bg-clip-text text-transparent">
              Padel League
            </h1>
          </div>
          <p className="text-slate-600 text-lg">Elite player rankings & match tracking</p>
        </div>

        {/* Stats Cards - Modern Glass Morphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">{players.length}</h3>
                <p className="text-slate-600 font-medium">Active Players</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">{matches.length}</h3>
                <p className="text-slate-600 font-medium">Matches Played</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">
                  {ranking[0]?.name || 'TBD'}
                </h3>
                <p className="text-slate-600 font-medium">League Champion</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Rankings - Modern Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-8 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <Trophy className="w-7 h-7 text-amber-500" />
                  Player Rankings
                </h2>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Player
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {ranking.map((player, index) => (
                <div key={player.id} className="group flex items-center justify-between p-5 bg-gradient-to-r from-white to-slate-50 rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full font-bold text-slate-700">
                        {index + 1}
                      </div>
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{player.name}</h3>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">{player.wins}W-{player.losses}L</span>
                        <span className="mx-2 text-slate-400">•</span>
                        <span>{getWinRate(player)}% wins</span>
                        <span className="mx-2 text-slate-400">•</span>
                        <span>{getGameWinRate(player)}% games</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">{player.points}</div>
                    <div className="text-sm text-slate-500">{player.matches} matches</div>
                  </div>
                </div>
              ))}
              
              {players.filter(p => p.matches === 0).map(player => (
                <div key={player.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200/30 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full text-sm text-slate-500">
                      —
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-700">{player.name}</h3>
                      <p className="text-sm text-slate-500">No matches played</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Match History - Modern Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-8 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <Calendar className="w-7 h-7 text-emerald-500" />
                  Match History
                </h2>
                <button
                  onClick={() => setShowAddMatch(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Match
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {matches.map(match => (
                <div key={match.id} className="bg-gradient-to-r from-white to-slate-50 rounded-2xl border border-slate-200/50 p-5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 font-medium">{match.date}</span>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 px-4 py-2 rounded-xl">
                        <span className="text-xl font-bold text-slate-800">{match.score}</span>
                      </div>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all duration-200"
                        title="Delete match"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      match.winner === 'team1' 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">
                        {match.team1[0]} & {match.team1[1]}
                      </div>
                      {match.winner === 'team1' && (
                        <div className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-lg inline-block">
                          WINNERS
                        </div>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      match.winner === 'team2' 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">
                        {match.team2[0]} & {match.team2[1]}
                      </div>
                      {match.winner === 'team2' && (
                        <div className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-lg inline-block">
                          WINNERS
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {matches.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No matches played yet</p>
                  <p className="text-sm">Add your first match to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Add New Player</h3>
              <input
                type="text"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-2xl mb-6 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <div className="flex gap-3">
                <button
                  onClick={addPlayer}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-2xl transition-all duration-200 font-semibold"
                >
                  Add Player
                </button>
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-2xl transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Match Modal */}
        {showAddMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Add New Match</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={matchForm.date}
                    onChange={(e) => setMatchForm({...matchForm, date: e.target.value})}
                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-2xl">
                    <label className="block text-sm font-bold text-blue-800 mb-3">Team 1</label>
                    <select
                      value={matchForm.team1Player1}
                      onChange={(e) => setMatchForm({...matchForm, team1Player1: e.target.value})}
                      className="w-full p-3 border border-blue-200 rounded-xl mb-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={matchForm.team1Player2}
                      onChange={(e) => setMatchForm({...matchForm, team1Player2: e.target.value})}
                      className="w-full p-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-2xl">
                    <label className="block text-sm font-bold text-emerald-800 mb-3">Team 2</label>
                    <select
                      value={matchForm.team2Player1}
                      onChange={(e) => setMatchForm({...matchForm, team2Player1: e.target.value})}
                      className="w-full p-3 border border-emerald-200 rounded-xl mb-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all duration-200 bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={matchForm.team2Player2}
                      onChange={(e) => setMatchForm({...matchForm, team2Player2: e.target.value})}
                      className="w-full p-3 border border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all duration-200 bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Team 1 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={matchForm.team1Score}
                      onChange={(e) => setMatchForm({...matchForm, team1Score: e.target.value})}
                      className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 text-center text-2xl font-bold"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Team 2 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={matchForm.team2Score}
                      onChange={(e) => setMatchForm({...matchForm, team2Score: e.target.value})}
                      className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all duration-200 text-center text-2xl font-bold"
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 rounded-2xl border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-slate-600" />
                    <span className="font-bold text-slate-800">Score Impact</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong>Dominant wins</strong> (4-0, 5-1) earn <strong className="text-emerald-700">30-50% more points</strong> than close wins (4-3, 5-4). 
                    Show your skills on the court! 🎾
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={addMatch}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 px-8 rounded-2xl transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl"
                >
                  Add Match
                </button>
                <button
                  onClick={() => setShowAddMatch(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-8 rounded-2xl transition-all duration-200 font-bold text-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PadelCompetitionApp;
