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

  // Load players and tournaments
  useEffect(() => {
    const unsubscribePlayers = onSnapshot(
      collection(db, 'players'), 
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersData);
        setLoading(false);
      }
    );

    const unsubscribeTournaments = onSnapshot(
      query(collection(db, 'tournaments'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        const tournamentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTournaments(tournamentsData);
      }
    );

    return () => {
      unsubscribePlayers();
      unsubscribeTournaments();
    };
  }, []);

  // Load games for current tournament
  useEffect(() => {
    if (!currentTournament) {
      setGames([]);
      return;
    }

    const unsubscribeGames = onSnapshot(
      query(
        collection(db, 'games'), 
        where('tournamentId', '==', currentTournament.id),
        orderBy('createdAt', 'desc')
      ), 
      (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGames(gamesData);
      }
    );

    return () => unsubscribeGames();
  }, [currentTournament]);

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
        await addDoc(collection(db, 'players'), {
          name: newPlayerName.trim(),
          createdAt: new Date()
        });
        setNewPlayerName('');
        setShowAddPlayer(false);
      } catch (error) {
        console.error("Error adding player:", error);
        alert("Failed to add player. Please try again.");
      }
    }
  };

  const addTournament = async () => {
    if (newTournamentName.trim()) {
      try {
        const docRef = await addDoc(collection(db, 'tournaments'), {
          name: newTournamentName.trim(),
          createdAt: new Date(),
          isActive: true
        });
        setNewTournamentName('');
        setShowAddTournament(false);
        
        // Auto-select the new tournament
        const newTournament = {
          id: docRef.id,
          name: newTournamentName.trim(),
          createdAt: new Date(),
          isActive: true
        };
        setCurrentTournament(newTournament);
        setCurrentPage('tournament');
      } catch (error) {
        console.error("Error adding tournament:", error);
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
      await addDoc(collection(db, 'games'), {
        tournamentId: currentTournament.id,
        team1: [team1Player1, team1Player2],
        team2: [team2Player1, team2Player2],
        team1Score: score1,
        team2Score: score2,
        winner: score1 > score2 ? 'team1' : 'team2',
        date,
        createdAt: new Date()
      });

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
      console.error("Error adding game:", error);
      alert("Failed to add game. Please try again.");
    }
  };

  const deleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (error) {
      console.error("Error deleting game:", error);
      alert("Failed to delete game. Please try again.");
    }
  };

  const markTournamentWinner = async (playerName) => {
    if (!confirm(`Mark ${playerName} as tournament winner?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'tournaments', currentTournament.id), {
        winner: playerName,
        isActive: false,
        completedAt: new Date()
      });
      
      // Refresh current tournament
      setCurrentTournament({...currentTournament, winner: playerName, isActive: false});
    } catch (error) {
      console.error("Error marking winner:", error);
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
            Rankings are calculated fresh from actual game data - no more stuck ratings or unfair baselines!
          </p>
          <div className="mt-4 text-sm text-amber-600">
            <p>Your old ELO rating issues are completely solved with this simple scoring system.</p>
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
                  Created {tournament.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
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
                </div>
              ))}
              
              {rankings.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No games played yet</p>
                </div>
              )}
            </div>
          </NeumorphismCard>

          {/* Games */}
          <NeumorphismCard>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-emerald-500" />
                Game History
              </h3>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tournamentGames.map(game => (
                <div key={game.id} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 font-medium">{game.date}</span>
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-slate-200 to-slate-300 px-4 py-2 rounded-xl shadow-inner">
                        <span className="text-xl font-bold text-slate-800">
                          {game.team1Score}-{game.team2Score}
                        </span>
                      </div>
                      {currentTournament?.isActive && (
                        <NeumorphismButton
                          onClick={() => deleteGame(game.id)}
                          variant="danger"
                          className="p-2 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </NeumorphismButton>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${
                      game.winner === 'team1' 
                        ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-inner' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner'
                    }`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">
                        {game.team1[0]} & {game.team1[1]}
                      </div>
                      {game.winner === 'team1' && (
                        <div className="text-xs text-emerald-700 font-bold bg-emerald-200 px-2 py-1 rounded-lg inline-block shadow-inner">
                          WINNERS
                        </div>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl ${
                      game.winner === 'team2' 
                        ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-inner' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner'
                    }`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">
                        {game.team2[0]} & {game.team2[1]}
                      </div>
                      {game.winner === 'team2' && (
                        <div className="text-xs text-emerald-700 font-bold bg-emerald-200 px-2 py-1 rounded-lg inline-block shadow-inner">
                          WINNERS
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {tournamentGames.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No games in this tournament yet</p>
                </div>
              )}
            </div>
          </NeumorphismCard>
        </div>
      </div>
    );
  };

  // League Rankings Page (placeholder)
  const LeagueRankingsPage = () => (
    <div className="text-center py-16">
      <NeumorphismCard className="max-w-2xl mx-auto">
        <Crown className="w-20 h-20 mx-auto mb-6 text-slate-400" />
        <h3 className="text-2xl font-semibold text-slate-600 mb-3">League Rankings</h3>
        <p className="text-slate-500 text-lg mb-6">Overall player stats across all tournaments</p>
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-6 shadow-inner">
          <p className="text-slate-700">Coming soon! This will show cumulative rankings across all your tournaments.</p>
        </div>
      </NeumorphismCard>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center">
        <NeumorphismCard className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-full flex items-center justify-center animate-pulse shadow-inner">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 text-lg font-medium">Loading Padel League...</p>
        </NeumorphismCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <NeumorphismCard className="inline-block p-8">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-slate-800" style={{ fontFamily: 'Bebas Neue, cursive' }}>
                PADEL LEAGUE
              </h1>
            </div>
            <p className="text-slate-600 text-lg mt-4">Tournament management & player rankings</p>
          </NeumorphismCard>
        </div>

        <Navigation />

        {/* Page Content */}
        {currentPage === 'tournaments' && <TournamentsPage />}
        {currentPage === 'tournament' && currentTournament && <TournamentPage />}
        {currentPage === 'rankings' && <LeagueRankingsPage />}
        {currentPage === 'how-it-works' && <HowItWorksPage />}

        {/* Modals */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <NeumorphismCard className="w-full max-w-md">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Add New Player</h3>
              <input
                type="text"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full p-4 border-2 border-slate-300 rounded-2xl mb-6 focus:border-blue-400 outline-none shadow-inner bg-gradient-to-r from-slate-50 to-slate-100"
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <div className="flex gap-4">
                <NeumorphismButton
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim()}
                  variant="primary"
                  className="flex-1 py-3 rounded-2xl"
                >
                  Add Player
                </NeumorphismButton>
                <NeumorphismButton
                  onClick={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                  }}
                  variant="neutral"
                  className="flex-1 py-3 rounded-2xl"
                >
                  Cancel
                </NeumorphismButton>
              </div>
            </NeumorphismCard>
          </div>
        )}

        {showAddTournament && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <NeumorphismCard className="w-full max-w-md">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Create New Tournament</h3>
              <input
                type="text"
                placeholder="Tournament name"
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
                className="w-full p-4 border-2 border-slate-300 rounded-2xl mb-6 focus:border-emerald-400 outline-none shadow-inner bg-gradient-to-r from-slate-50 to-slate-100"
                onKeyPress={(e) => e.key === 'Enter' && addTournament()}
              />
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-4 mb-6 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Quick Tip</span>
                </div>
                <p className="text-xs text-blue-700">
                  Great tournament names: "Tuesday Clash #3", "Rally Cup #1", "Court Kings #2"
                </p>
              </div>
              <div className="flex gap-4">
                <NeumorphismButton
                  onClick={addTournament}
                  disabled={!newTournamentName.trim()}
                  variant="secondary"
                  className="flex-1 py-3 rounded-2xl"
                >
                  Create Tournament
                </NeumorphismButton>
                <NeumorphismButton
                  onClick={() => {
                    setShowAddTournament(false);
                    setNewTournamentName('');
                  }}
                  variant="neutral"
                  className="flex-1 py-3 rounded-2xl"
                >
                  Cancel
                </NeumorphismButton>
              </div>
            </NeumorphismCard>
          </div>
        )}

        {showAddGame && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <NeumorphismCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Add New Game</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={gameForm.date}
                    onChange={(e) => setGameForm({...gameForm, date: e.target.value})}
                    className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:border-emerald-400 outline-none shadow-inner bg-gradient-to-r from-slate-50 to-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NeumorphismCard className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <label className="block text-sm font-bold text-blue-800 mb-3">Team 1</label>
                    <select
                      value={gameForm.team1Player1}
                      onChange={(e) => setGameForm({...gameForm, team1Player1: e.target.value})}
                      className="w-full p-3 border-2 border-blue-300 rounded-xl mb-3 focus:border-blue-500 outline-none shadow-inner bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={gameForm.team1Player2}
                      onChange={(e) => setGameForm({...gameForm, team1Player2: e.target.value})}
                      className="w-full p-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 outline-none shadow-inner bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </NeumorphismCard>

                  <NeumorphismCard className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <label className="block text-sm font-bold text-emerald-800 mb-3">Team 2</label>
                    <select
                      value={gameForm.team2Player1}
                      onChange={(e) => setGameForm({...gameForm, team2Player1: e.target.value})}
                      className="w-full p-3 border-2 border-emerald-300 rounded-xl mb-3 focus:border-emerald-500 outline-none shadow-inner bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={gameForm.team2Player2}
                      onChange={(e) => setGameForm({...gameForm, team2Player2: e.target.value})}
                      className="w-full p-3 border-2 border-emerald-300 rounded-xl focus:border-emerald-500 outline-none shadow-inner bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </NeumorphismCard>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Team 1 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={gameForm.team1Score}
                      onChange={(e) => setGameForm({...gameForm, team1Score: e.target.value})}
                      className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:border-blue-400 outline-none text-center text-2xl font-bold shadow-inner bg-gradient-to-r from-slate-50 to-slate-100"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Team 2 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={gameForm.team2Score}
                      onChange={(e) => setGameForm({...gameForm, team2Score: e.target.value})}
                      className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:border-emerald-400 outline-none text-center text-2xl font-bold shadow-inner bg-gradient-to-r from-slate-50 to-slate-100"
                      placeholder="2"
                    />
                  </div>
                </div>

                <NeumorphismCard className="bg-gradient-to-r from-blue-50 to-emerald-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-slate-600" />
                    <span className="font-bold text-slate-800">Simple Scoring</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <strong>Points = Games Scored + Win Bonus (2pts)</strong><br/>
                    Tournament winner gets <strong className="text-emerald-700">+5 bonus points</strong>
                  </p>
                </NeumorphismCard>
              </div>

              <div className="flex gap-4 mt-8">
                <NeumorphismButton
                  onClick={addGame}
                  variant="secondary"
                  className="flex-1 py-4 rounded-2xl text-lg"
                >
                  Add Game
                </NeumorphismButton>
                <NeumorphismButton
                  onClick={() => {
                    setShowAddGame(false);
                    setGameForm({
                      team1Player1: '',
                      team1Player2: '',
                      team2Player1: '',
                      team2Player2: '',
                      team1Score: '',
                      team2Score: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  variant="neutral"
                  className="flex-1 py-4 rounded-2xl text-lg"
                >
                  Cancel
                </NeumorphismButton>
              </div>
            </NeumorphismCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default PadelCompetitionApp;
