import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, X, Medal, Star, Calendar, Target, Home, Crown, ArrowLeft, Zap, Play, Info, HelpCircle } from 'lucide-react';

// Real Firebase imports
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';

const PadelCompetitionApp = () => {
  const [currentPage, setCurrentPage] = useState('tournaments');
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTournamentName, setNewTournamentName] = useState('');
  
  const [gameForm, setGameForm] = useState({
    team1Player1: '',
    team1Player2: '',
    team2Player1: '',
    team2Player2: '',
    team1Score: '',
    team2Score: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Simulate Firebase loading
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const generateTournamentName = () => {
    const themes = [
      'Tuesday Clash', 'Rally Cup', 'Court Kings', 'Padel Showdown', 
      'Smash Series', 'Net Masters', 'Volley Wars', 'Ace League'
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const number = tournaments.length + 1;
    return `${randomTheme} #${number}`;
  };

  const addPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const newPlayer = {
          id: Date.now().toString(),
          name: newPlayerName.trim(),
          createdAt: new Date()
        };
        setPlayers([...players, newPlayer]);
        setNewPlayerName('');
        setShowAddPlayer(false);
      } catch (error) {
        alert("Failed to add player. Please try again.");
      }
    }
  };

  const addTournament = async () => {
    if (newTournamentName.trim()) {
      try {
        const newTournament = {
          id: Date.now().toString(),
          name: newTournamentName.trim(),
          createdAt: new Date(),
          isActive: true,
          winner: null
        };
        setTournaments([newTournament, ...tournaments]);
        setNewTournamentName('');
        setShowAddTournament(false);
        setCurrentTournament(newTournament);
        setCurrentPage('tournament');
      } catch (error) {
        alert("Failed to add tournament. Please try again.");
      }
    }
  };

  const addGame = async () => {
    const { team1Player1, team1Player2, team2Player1, team2Player2, team1Score, team2Score, date } = gameForm;
    
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
      alert('Games cannot end in a tie!');
      return;
    }

    try {
      const newGame = {
        id: Date.now().toString(),
        tournamentId: currentTournament.id,
        team1: [team1Player1, team1Player2],
        team2: [team2Player1, team2Player2],
        team1Score: score1,
        team2Score: score2,
        winner: score1 > score2 ? 'team1' : 'team2',
        date,
        createdAt: new Date()
      };

      setGames([newGame, ...games]);
      setGameForm({
        team1Player1: '',
        team1Player2: '',
        team2Player1: '',
        team2Player2: '',
        team1Score: '',
        team2Score: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddGame(false);
    } catch (error) {
      alert("Failed to add game. Please try again.");
    }
  };

  const deleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return;
    }
    
    try {
      setGames(games.filter(game => game.id !== gameId));
    } catch (error) {
      alert("Failed to delete game. Please try again.");
    }
  };

  const markTournamentWinner = async (playerName) => {
    if (!confirm(`Mark ${playerName} as tournament winner?`)) {
      return;
    }

    try {
      const updatedTournament = {
        ...currentTournament,
        winner: playerName,
        isActive: false
      };
      
      setTournaments(tournaments.map(t => 
        t.id === currentTournament.id ? updatedTournament : t
      ));
      setCurrentTournament(updatedTournament);
    } catch (error) {
      alert("Failed to mark winner. Please try again.");
    }
  };

  // Calculate tournament rankings using the simple system
  const getTournamentRankings = () => {
    if (!currentTournament) return [];
    
    const tournamentGames = games.filter(g => g.tournamentId === currentTournament.id);
    if (!tournamentGames.length) return [];

    const playerStats = {};
    
    // Initialize all players who participated
    tournamentGames.forEach(game => {
      [...game.team1, ...game.team2].forEach(playerName => {
        if (!playerStats[playerName]) {
          playerStats[playerName] = {
            name: playerName,
            totalPoints: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            totalScored: 0
          };
        }
      });
    });

    // Calculate points for each game
    tournamentGames.forEach(game => {
      const { team1, team2, team1Score, team2Score, winner } = game;
      
      // Team 1 players
      team1.forEach(playerName => {
        const stats = playerStats[playerName];
        stats.gamesPlayed += 1;
        stats.totalScored += team1Score;
        stats.totalPoints += team1Score; // Points scored
        
        if (winner === 'team1') {
          stats.gamesWon += 1;
          stats.totalPoints += 2; // Win bonus
        }
      });

      // Team 2 players  
      team2.forEach(playerName => {
        const stats = playerStats[playerName];
        stats.gamesPlayed += 1;
        stats.totalScored += team2Score;
        stats.totalPoints += team2Score; // Points scored
        
        if (winner === 'team2') {
          stats.gamesWon += 1;
          stats.totalPoints += 2; // Win bonus
        }
      });
    });

    // Add tournament winner bonus
    if (currentTournament?.winner) {
      if (playerStats[currentTournament.winner]) {
        playerStats[currentTournament.winner].totalPoints += 5;
      }
    }

    return Object.values(playerStats)
      .filter(p => p.gamesPlayed > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const rankings = getTournamentRankings();

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Star className="w-5 h-5 text-blue-500" />;
  };

  // Neumorphism Button Component
  const NeumorphismButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 font-semibold flex items-center justify-center gap-2";
    
    const variants = {
      primary: `
        bg-gradient-to-br from-blue-400 to-blue-600 text-white
        shadow-[8px_8px_16px_#a1a1aa,_-8px_-8px_16px_#ffffff]
        hover:shadow-[4px_4px_8px_#a1a1aa,_-4px_-4px_8px_#ffffff]
        active:shadow-[inset_4px_4px_8px_#a1a1aa,_inset_-4px_-4px_8px_#ffffff]
      `,
      secondary: `
        bg-gradient-to-br from-emerald-400 to-emerald-600 text-white
        shadow-[8px_8px_16px_#a1a1aa,_-8px_-8px_16px_#ffffff]
        hover:shadow-[4px_4px_8px_#a1a1aa,_-4px_-4px_8px_#ffffff]
        active:shadow-[inset_4px_4px_8px_#a1a1aa,_inset_-4px_-4px_8px_#ffffff]
      `,
      neutral: `
        bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700
        shadow-[8px_8px_16px_#a1a1aa,_-8px_-8px_16px_#ffffff]
        hover:shadow-[4px_4px_8px_#a1a1aa,_-4px_-4px_8px_#ffffff]
        active:shadow-[inset_4px_4px_8px_#a1a1aa,_inset_-4px_-4px_8px_#ffffff]
      `,
      danger: `
        bg-gradient-to-br from-red-400 to-red-600 text-white
        shadow-[8px_8px_16px_#a1a1aa,_-8px_-8px_16px_#ffffff]
        hover:shadow-[4px_4px_8px_#a1a1aa,_-4px_-4px_8px_#ffffff]
        active:shadow-[inset_4px_4px_8px_#a1a1aa,_inset_-4px_-4px_8px_#ffffff]
      `
    };

    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  // Neumorphism Card Component
  const NeumorphismCard = ({ children, className = '', hover = false }) => {
    const hoverClasses = hover ? "hover:shadow-[16px_16px_32px_#a1a1aa,_-16px_-16px_32px_#ffffff] hover:-translate-y-1" : "";
    
    return (
      <div className={`
        bg-gradient-to-br from-slate-100 to-slate-200
        rounded-3xl p-6
        shadow-[12px_12px_24px_#a1a1aa,_-12px_-12px_24px_#ffffff]
        transition-all duration-300
        ${hoverClasses}
        ${className}
      `}>
        {children}
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => (
    <NeumorphismCard className="mb-8">
      <div className="flex gap-3 flex-wrap">
        <NeumorphismButton
          onClick={() => setCurrentPage('tournaments')}
          variant={currentPage === 'tournaments' ? 'primary' : 'neutral'}
          className="px-6 py-3 rounded-2xl"
        >
          <Home className="w-4 h-4" />
          <span>Tournaments</span>
        </NeumorphismButton>
        
        {currentTournament && (
          <NeumorphismButton
            onClick={() => setCurrentPage('tournament')}
            variant={currentPage === 'tournament' ? 'secondary' : 'neutral'}
            className="px-6 py-3 rounded-2xl"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{currentTournament.name}</span>
            <span className="sm:hidden">Current</span>
          </NeumorphismButton>
        )}
        
        <NeumorphismButton
          onClick={() => setCurrentPage('rankings')}
          variant={currentPage === 'rankings' ? 'primary' : 'neutral'}
          className="px-6 py-3 rounded-2xl"
        >
          <Crown className="w-4 h-4" />
          <span>League</span>
        </NeumorphismButton>

        <NeumorphismButton
          onClick={() => setCurrentPage('how-it-works')}
          variant={currentPage === 'how-it-works' ? 'primary' : 'neutral'}
          className="px-6 py-3 rounded-2xl"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How It Works</span>
        </NeumorphismButton>
      </div>
    </NeumorphismCard>
  );

  // How It Works Page
  const HowItWorksPage = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
        <p className="text-xl text-slate-600">Simple, fair, and transparent scoring system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeumorphismCard>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-inner">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Scoring Formula</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
              <h4 className="font-bold text-slate-800 mb-2">Points = Games Scored + Win Bonus + Tournament Bonus</h4>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Games Scored:</span>
                  <span className="font-semibold">Your actual score (e.g., 4 points if you scored 4)</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Bonus:</span>
                  <span className="font-semibold">+2 points for winning</span>
                </div>
                <div className="flex justify-between">
                  <span>Tournament Winner:</span>
                  <span className="font-semibold">+5 points bonus</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 shadow-inner">
              <h4 className="font-bold text-emerald-800 mb-2">Example Game: 6-2 Win</h4>
              <div className="space-y-1 text-sm text-emerald-700">
                <div>6 points (games scored)</div>
                <div>+2 points (win bonus)</div>
                <div className="font-bold border-t border-emerald-200 pt-1">= 8 total points</div>
              </div>
            </div>
          </div>
        </NeumorphismCard>

        <NeumorphismCard>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Why This System?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
              <h4 className="font-bold text-slate-800 mb-2">Fair & Simple</h4>
              <p className="text-sm text-slate-700">Every point you score counts, even in losses. No complex calculations or confusing rating changes.</p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
              <h4 className="font-bold text-slate-800 mb-2">Encourages Competition</h4>
              <p className="text-sm text-slate-700">Fight for every point! Losing 6-4 gives you more points than losing 6-1.</p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
              <h4 className="font-bold text-slate-800 mb-2">Clean Ranking</h4>
              <p className="text-sm text-slate-700">Rankings recalculate from actual game results. No stuck data or baseline issues.</p>
            </div>
          </div>
        </NeumorphismCard>
      </div>

      <NeumorphismCard>
        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Tournament Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-inner text-white font-bold">
              1
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Create Tournament</h4>
            <p className="text-sm text-slate-600">Start a new tournament with a catchy name like "Tuesday Clash #3"</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-inner text-white font-bold">
              2
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Play Games</h4>
            <p className="text-sm text-slate-600">Add game results as you play. Rankings update automatically.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-inner text-white font-bold">
              3
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Crown Winner</h4>
            <p className="text-sm text-slate-600">Mark the tournament winner to get 5 bonus points and complete the tournament.</p>
          </div>
        </div>
      </NeumorphismCard>

      <NeumorphismCard className="bg-gradient-to-r from-amber-50 to-amber-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-inner">
            <Info className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-amber-800 mb-3">Firebase Integration</h3>
          <p className="text-amber-700 max-w-2xl mx-auto">
            This app uses Firebase for real-time data storage. All players, tournaments, and games are saved to the cloud. 
            The demo version shows the interface - connect your Firebase project to enable full functionality.
          </p>
          <div className="mt-4 text-sm text-amber-600">
            <p>To connect Firebase: Replace the mock functions with actual Firebase imports in your code</p>
          </div>
        </div>
      </NeumorphismCard>
    </div>
  );

  // Tournament Selection Page
  const TournamentsPage = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-slate-800">Tournaments</h2>
        <div className="flex gap-4">
          <NeumorphismButton
            onClick={() => setShowAddPlayer(true)}
            variant="neutral"
            className="px-4 py-3 rounded-2xl"
          >
            <Users className="w-4 h-4" />
            Add Player
          </NeumorphismButton>
          <NeumorphismButton
            onClick={() => {
              setNewTournamentName(generateTournamentName());
              setShowAddTournament(true);
            }}
            variant="primary"
            className="px-6 py-4 rounded-2xl text-lg"
          >
            <Plus className="w-5 h-5" />
            New Tournament
          </NeumorphismButton>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <NeumorphismCard className="text-center py-16">
          <Trophy className="w-20 h-20 mx-auto mb-6 text-slate-400" />
          <h3 className="text-2xl font-semibold text-slate-600 mb-3">No tournaments yet</h3>
          <p className="text-slate-500 text-lg">Create your first tournament to get started!</p>
          <NeumorphismButton
            onClick={() => {
              setNewTournamentName(generateTournamentName());
              setShowAddTournament(true);
            }}
            variant="primary"
            className="px-8 py-4 rounded-2xl text-lg mt-6"
          >
            <Plus className="w-5 h-5" />
            Create First Tournament
          </NeumorphismButton>
        </NeumorphismCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tournament => (
            <NeumorphismCard 
              key={tournament.id}
              hover={true}
              className="cursor-pointer"
            >
              <div
                onClick={() => {
                  setCurrentTournament(tournament);
                  setCurrentPage('tournament');
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{tournament.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tournament.isActive 
                      ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                      : 'bg-slate-100 text-slate-600 shadow-inner'
                  }`}>
                    {tournament.isActive ? 'Active' : 'Completed'}
                  </div>
                </div>
                
                {tournament.winner && (
                  <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl p-4 mb-4 shadow-inner">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-amber-800">
                        Winner: {tournament.winner}
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-slate-600">
                  Created {tournament.createdAt?.toLocaleDateString?.() || 'Recently'}
                </p>
              </div>
            </NeumorphismCard>
          ))}
        </div>
      )}
    </div>
  );

  // Current Tournament Page
  const TournamentPage = () => {
    const tournamentGames = games.filter(g => g.tournamentId === currentTournament?.id);
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NeumorphismButton
              onClick={() => setCurrentPage('tournaments')}
              variant="neutral"
              className="p-3 rounded-2xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </NeumorphismButton>
            <div>
              <h2 className="text-4xl font-bold text-slate-800">{currentTournament?.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  currentTournament?.isActive 
                    ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                    : 'bg-slate-100 text-slate-600 shadow-inner'
                }`}>
                  {currentTournament?.isActive ? 'Active Tournament' : 'Completed'}
                </div>
                {currentTournament?.winner && (
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium shadow-inner">
                    <Trophy className="w-4 h-4" />
                    Winner: {currentTournament.winner}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {currentTournament?.isActive && (
            <NeumorphismButton
              onClick={() => setShowAddGame(true)}
              disabled={players.length < 4}
              variant="secondary"
              className="px-6 py-4 rounded-2xl text-lg"
            >
              <Plus className="w-5 h-5" />
              Add Game
            </NeumorphismButton>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Rankings */}
          <NeumorphismCard>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                <Trophy className="w-7 h-7 text-amber-500" />
                Tournament Rankings
              </h3>
              <p className="text-sm text-slate-600">
                Points = Games Scored + Win Bonus (2pts) + Tournament Winner (5pts)
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rankings.map((player, index) => (
                <div key={player.name} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full font-bold text-slate-700 shadow-inner">
                          {index + 1}
                        </div>
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{player.name}</h4>
                        <p className="text-sm text-slate-600">
                          {player.gamesWon}W / {player.gamesPlayed}G • {player.totalScored} scored
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-800">{player.totalPoints}</div>
                      {currentTournament?.isActive && (
                        <NeumorphismButton
                          onClick={() => markTournamentWinner(player.name)}
                          variant="primary"
                          className="text-xs px-3 py-1 rounded-xl mt-1"
                        >
                          Mark Winner
                        </NeumorphismButton>
                      )}
                    </div>
                  </div>
