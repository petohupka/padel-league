import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, X, Medal, Star, Calendar, Target, Home, Crown, ArrowLeft, Info, HelpCircle, Minus } from 'lucide-react';

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

    tournamentGames.forEach(game => {
      const { team1, team2, team1Score, team2Score, winner } = game;
      
      team1.forEach(playerName => {
        const stats = playerStats[playerName];
        stats.gamesPlayed += 1;
        stats.totalScored += team1Score;
        stats.totalPoints += team1Score;
        
        if (winner === 'team1') {
          stats.gamesWon += 1;
          stats.totalPoints += 2;
        }
      });

      team2.forEach(playerName => {
        const stats = playerStats[playerName];
        stats.gamesPlayed += 1;
        stats.totalScored += team2Score;
        stats.totalPoints += team2Score;
        
        if (winner === 'team2') {
          stats.gamesWon += 1;
          stats.totalPoints += 2;
        }
      });
    });

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
    if (index === 0) return <Trophy className="w-4 h-4 text-amber-600" />;
    if (index === 1) return <Medal className="w-4 h-4 text-slate-500" />;
    if (index === 2) return <Medal className="w-4 h-4 text-orange-500" />;
    return <div className="w-4 h-4" />;
  };

  // Clean Button Component
  const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '', size = 'md' }) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm",
      secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-blue-500 shadow-sm",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-blue-500",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-lg", 
      lg: "px-6 py-3 text-base rounded-xl"
    };

    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  // Clean Card Component
  const Card = ({ children, className = '', hover = false }) => {
    const hoverClass = hover ? "hover:shadow-md hover:-translate-y-0.5" : "";
    
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 ${hoverClass} ${className}`}>
        {children}
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => (
    <Card className="p-1 mb-8">
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentPage('tournaments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPage === 'tournaments' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Tournaments</span>
        </button>
        
        {currentTournament && (
          <button
            onClick={() => setCurrentPage('tournament')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentPage === 'tournament' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{currentTournament.name}</span>
            <span className="sm:hidden">Current</span>
          </button>
        )}
        
        <button
          onClick={() => setCurrentPage('rankings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPage === 'rankings' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>League</span>
        </button>

        <button
          onClick={() => setCurrentPage('how-it-works')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPage === 'how-it-works' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>How It Works</span>
        </button>
      </div>
    </Card>
  );

  // How It Works Page
  const HowItWorksPage = () => (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">How It Works</h2>
        <p className="text-lg text-gray-600">Simple, fair, and transparent scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">Scoring Formula</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3">Points = Games Scored + Win Bonus + Tournament Bonus</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Games Scored:</span>
                  <span className="font-medium">Your actual score</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Bonus:</span>
                  <span className="font-medium">+2 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Tournament Winner:</span>
                  <span className="font-medium">+5 points</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <h4 className="font-medium text-emerald-900 mb-2">Example: 6-2 Win</h4>
              <div className="space-y-1 text-sm text-emerald-800">
                <div>6 points (games scored)</div>
                <div>+2 points (win bonus)</div>
                <div className="font-medium border-t border-emerald-200 pt-2 mt-2">= 8 total points</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">Why This System?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Fair & Simple</h4>
              <p className="text-sm text-gray-700">Every point you score counts, even in losses. No complex calculations.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Encourages Competition</h4>
              <p className="text-sm text-gray-700">Fight for every point! Losing 6-4 gives more points than losing 6-1.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Clean Rankings</h4>
              <p className="text-sm text-gray-700">Rankings recalculate from actual game results. No stuck data.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-medium text-gray-900 mb-8 text-center">Tournament Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-medium">
              1
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Create Tournament</h4>
            <p className="text-sm text-gray-600">Start with a name like "Tuesday Clash #3"</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-medium">
              2
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Play Games</h4>
            <p className="text-sm text-gray-600">Add results as you play. Rankings update automatically.</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-medium">
              3
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Crown Winner</h4>
            <p className="text-sm text-gray-600">Mark the winner to get 5 bonus points.</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Tournament Selection Page
  const TournamentsPage = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-light text-gray-900">Tournaments</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddPlayer(true)}
            variant="secondary"
            size="md"
          >
            <Users className="w-4 h-4" />
            Add Player
          </Button>
          <Button
            onClick={() => {
              setNewTournamentName(generateTournamentName());
              setShowAddTournament(true);
            }}
            variant="primary"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            New Tournament
          </Button>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <Card className="p-16 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 mb-3">No tournaments yet</h3>
          <p className="text-gray-600 mb-8">Create your first tournament to get started</p>
          <Button
            onClick={() => {
              setNewTournamentName(generateTournamentName());
              setShowAddTournament(true);
            }}
            variant="primary"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Create First Tournament
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tournament => (
            <Card 
              key={tournament.id}
              hover={true}
              className="p-6 cursor-pointer"
              onClick={() => {
                setCurrentTournament(tournament);
                setCurrentPage('tournament');
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate pr-2">{tournament.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tournament.isActive 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tournament.isActive ? 'Active' : 'Complete'}
                </div>
              </div>
              
              {tournament.winner && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">
                      Winner: {tournament.winner}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                {tournament.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently created'}
              </p>
            </Card>
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
            <Button
              onClick={() => setCurrentPage('tournaments')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-light text-gray-900">{currentTournament?.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentTournament?.isActive 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {currentTournament?.isActive ? 'Active Tournament' : 'Completed'}
                </div>
                {currentTournament?.winner && (
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Trophy className="w-3 h-3" />
                    Winner: {currentTournament.winner}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {currentTournament?.isActive && (
            <Button
              onClick={() => setShowAddGame(true)}
              disabled={players.length < 4}
              variant="primary"
              size="lg"
            >
              <Plus className="w-4 h-4" />
              Add Game
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Rankings */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                Rankings
              </h3>
              <p className="text-sm text-gray-600">
                Points = Games Scored + Win Bonus (2) + Tournament Winner (5)
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rankings.map((player, index) => (
                <div key={player.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg font-medium text-gray-700 text-sm border">
                        {index + 1}
                      </div>
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{player.name}</h4>
                      <p className="text-sm text-gray-600">
                        {player.gamesWon}W / {player.gamesPlayed}G • {player.totalScored} scored
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-gray-900">{player.totalPoints}</div>
                    {currentTournament?.isActive && (
                      <Button
                        onClick={() => markTournamentWinner(player.name)}
                        variant="primary"
                        size="sm"
                        className="mt-1"
                      >
                        Mark Winner
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {rankings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No games played yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Games */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Games
              </h3>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tournamentGames.map(game => (
                <div key={game.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 font-medium">{game.date}</span>
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-3 py-1 rounded-lg border">
                        <span className="text-lg font-semibold text-gray-900">
                          {game.team1Score}—{game.team2Score}
                        </span>
                      </div>
                      {currentTournament?.isActive && (
                        <Button
                          onClick={() => deleteGame(game.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${
                      game.winner === 'team2' 
                        ? 'bg-emerald-100 border border-emerald-200' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {game.team2[0]} & {game.team2[1]}
                      </div>
                      {game.winner === 'team2' && (
                        <div className="text-xs text-emerald-700 font-medium bg-emerald-200 px-2 py-1 rounded inline-block">
                          WIN
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {tournamentGames.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No games in this tournament yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // League Rankings Page
  const LeagueRankingsPage = () => (
    <div className="text-center py-16">
      <Card className="max-w-2xl mx-auto p-12">
        <Crown className="w-16 h-16 mx-auto mb-6 text-gray-400" />
        <h3 className="text-xl font-medium text-gray-900 mb-3">League Rankings</h3>
        <p className="text-gray-600 mb-6">Overall player stats across all tournaments</p>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <p className="text-blue-800">Coming soon! This will show cumulative rankings across all tournaments.</p>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading Padel League...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Card className="inline-block p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-light text-gray-900">Padel League</h1>
                <p className="text-gray-600 text-sm">Tournament management & player rankings</p>
              </div>
            </div>
          </Card>
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
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Add New Player</h3>
              <input
                type="text"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <div className="flex gap-3">
                <Button
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  Add Player
                </Button>
                <Button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showAddTournament && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Create New Tournament</h3>
              <input
                type="text"
                placeholder="Tournament name"
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addTournament()}
              />
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Quick Tip</span>
                </div>
                <p className="text-xs text-blue-800">
                  Great names: "Tuesday Clash #3", "Rally Cup #1", "Court Kings #2"
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={addTournament}
                  disabled={!newTournamentName.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  Create Tournament
                </Button>
                <Button
                  onClick={() => {
                    setShowAddTournament(false);
                    setNewTournamentName('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showAddGame && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Add New Game</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={gameForm.date}
                    onChange={(e) => setGameForm({...gameForm, date: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <label className="block text-sm font-medium text-blue-900 mb-3">Team 1</label>
                    <select
                      value={gameForm.team1Player1}
                      onChange={(e) => setGameForm({...gameForm, team1Player1: e.target.value})}
                      className="w-full p-3 border border-blue-300 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={gameForm.team1Player2}
                      onChange={(e) => setGameForm({...gameForm, team1Player2: e.target.value})}
                      className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </Card>

                  <Card className="p-4 bg-emerald-50 border-emerald-200">
                    <label className="block text-sm font-medium text-emerald-900 mb-3">Team 2</label>
                    <select
                      value={gameForm.team2Player1}
                      onChange={(e) => setGameForm({...gameForm, team2Player1: e.target.value})}
                      className="w-full p-3 border border-emerald-300 rounded-xl mb-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      <option value="">Select Player 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                    <select
                      value={gameForm.team2Player2}
                      onChange={(e) => setGameForm({...gameForm, team2Player2: e.target.value})}
                      className="w-full p-3 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      <option value="">Select Player 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team 1 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={gameForm.team1Score}
                      onChange={(e) => setGameForm({...gameForm, team1Score: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-xl font-semibold"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team 2 Score</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={gameForm.team2Score}
                      onChange={(e) => setGameForm({...gameForm, team2Score: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-center text-xl font-semibold"
                      placeholder="2"
                    />
                  </div>
                </div>

                <Card className="p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Simple Scoring</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Points = Games Scored + Win Bonus (2pts)</strong><br/>
                    Tournament winner gets <strong className="text-emerald-700">+5 bonus points</strong>
                  </p>
                </Card>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={addGame}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  Add Game
                </Button>
                <Button
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
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PadelCompetitionApp; ${
                      game.winner === 'team1' 
                        ? 'bg-emerald-100 border border-emerald-200' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {game.team1[0]} & {game.team1[1]}
                      </div>
                      {game.winner === 'team1' && (
                        <div className="text-xs text-emerald-700 font-medium bg-emerald-200 px-2 py-1 rounded inline-block">
                          WIN
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg
