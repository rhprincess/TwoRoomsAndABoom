import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Room, Player, GameStatus, Team, Role } from './types';
import { BASE_ROLES, DEFAULT_ROUND_LENGTHS } from './constants';
import { BombExplosion, MockeryEffect } from './components/VisualEffects';

// --- Icons ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function App() {
  const [view, setView] = useState<'LANDING' | 'LOBBY' | 'GAME'>('LANDING');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${currentRoom.code}` }, (payload) => {
        setCurrentRoom(payload.new as Room);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${currentRoom.code}` }, (payload) => {
        fetchPlayers(currentRoom.code);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentRoom?.code]);

  const fetchPlayers = async (code: string) => {
    const { data } = await supabase.from('players').select('*').eq('room_code', code);
    if (data) {
        setPlayers(data);
        const me = data.find(p => p.id === currentPlayer?.id);
        if (me) setCurrentPlayer(me);
    }
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== GameStatus.PLAYING || !currentRoom.round_end_time) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const end = new Date(currentRoom.round_end_time!).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0 && currentPlayer?.is_god) {
        pauseRound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom, currentPlayer?.is_god]);

  // --- Actions ---

  const joinRoom = async (asGod: boolean = false) => {
    if (!playerName || !roomCode) {
      setErrorMsg("Name and Room Code are required");
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      let { data: roomData, error: roomError } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
      
      if (!roomData) {
        if (asGod) {
          // Initialize Room with President and Bomber as mandatory specials
          const initialRoles = [
            BASE_ROLES.find(r => r.id === 'president')!,
            BASE_ROLES.find(r => r.id === 'bomber')!
          ];

          const newRoom: Room = {
            code: roomCode,
            status: GameStatus.LOBBY,
            current_round: 0,
            round_end_time: null,
            winner: null,
            settings: { rounds: 3, round_lengths: DEFAULT_ROUND_LENGTHS, min_players: 6, debug_mode: false },
            custom_roles: initialRoles
          };
          const { error: createError } = await supabase.from('rooms').insert(newRoom);
          if (createError) throw createError;
          roomData = newRoom;
        } else {
          throw new Error("Room does not exist.");
        }
      }

      const playerId = crypto.randomUUID();
      const newPlayer: Partial<Player> = {
        id: playerId,
        room_code: roomCode,
        name: playerName,
        is_god: asGod,
        team: Team.GREY,
        role: null,
        is_revealed: false,
        condition_met: false,
        joined_at: new Date().toISOString()
      };

      const { error: joinError } = await supabase.from('players').insert(newPlayer);
      if (joinError) throw joinError;

      setCurrentRoom(roomData);
      setCurrentPlayer(newPlayer as Player);
      await fetchPlayers(roomCode);
      setView(asGod ? 'GAME' : 'LOBBY'); 

    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('fetch')) {
         setErrorMsg("Connection Failed. Did you set up the database?");
      } else {
         setErrorMsg(e.message || "Failed to join.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- God Functions ---

  const updateRoles = async (newRoles: Role[]) => {
      if(!currentRoom) return;
      await supabase.from('rooms').update({ custom_roles: newRoles }).eq('code', currentRoom.code);
  };

  const startGame = async () => {
    if (!currentRoom) return;
    
    // Validation
    const playerCount = players.filter(p => !p.is_god).length;
    if (!currentRoom.settings.debug_mode) {
        if (playerCount < currentRoom.settings.min_players) {
            alert(`Need at least ${currentRoom.settings.min_players} players.`);
            return;
        }
        if (playerCount % 2 !== 0) {
            alert("Player count must be even (or enable Debug Mode).");
            return;
        }
    }

    // --- Deck Construction ---
    // 1. Start with the Active Specials (custom_roles in DB)
    const deck = [...currentRoom.custom_roles];

    // 2. Validate Deck fits in player count
    if (deck.length > playerCount) {
        alert(`Too many special roles (${deck.length}) for the player count (${playerCount}). Remove some.`);
        return;
    }

    // 3. Fill remaining slots with Blue/Red Team
    const remainingSlots = playerCount - deck.length;
    const blueTeamCard = BASE_ROLES.find(r => r.id === 'blue_team')!;
    const redTeamCard = BASE_ROLES.find(r => r.id === 'red_team')!;
    
    // Generally split evenly, if odd, usually President's team has advantage or disadvantage. 
    // We assume even players for now per requirements.
    const blueFills = Math.ceil(remainingSlots / 2);
    const redFills = Math.floor(remainingSlots / 2);

    for (let i = 0; i < blueFills; i++) deck.push(blueTeamCard);
    for (let i = 0; i < redFills; i++) deck.push(redTeamCard);

    // 4. Shuffle
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    // 5. Assign
    const playingPlayers = players.filter(p => !p.is_god);
    const updates = playingPlayers.map((p, index) => ({
      ...p,
      role: shuffledDeck[index],
      team: shuffledDeck[index].team
    }));

    // Update DB
    for (const p of updates) {
       await supabase.from('players').update({ role: p.role, team: p.team, condition_met: false }).eq('id', p.id);
    }

    // Start Round 1
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + currentRoom.settings.round_lengths[0]);

    await supabase.from('rooms').update({
      status: GameStatus.PLAYING,
      current_round: 1,
      round_end_time: endTime.toISOString()
    }).eq('code', currentRoom.code);
  };

  const pauseRound = async () => {
    await supabase.from('rooms').update({ status: GameStatus.PAUSED, round_end_time: null }).eq('code', currentRoom?.code);
  };

  const nextRound = async () => {
      if(!currentRoom) return;
      const nextR = currentRoom.current_round + 1;
      if (nextR > currentRoom.settings.rounds) {
          await supabase.from('rooms').update({ status: GameStatus.FINISHED, round_end_time: null }).eq('code', currentRoom.code);
      } else {
          const length = currentRoom.settings.round_lengths[nextR - 1] || 60;
          const endTime = new Date();
          endTime.setSeconds(endTime.getSeconds() + length);
          await supabase.from('rooms').update({
            status: GameStatus.PLAYING,
            current_round: nextR,
            round_end_time: endTime.toISOString()
          }).eq('code', currentRoom.code);
      }
  };

  const setWinner = async (team: Team) => {
    await supabase.from('rooms').update({ winner: team, status: GameStatus.FINISHED }).eq('code', currentRoom?.code);
  };

  const toggleDebug = async () => {
      if(!currentRoom) return;
      await supabase.from('rooms').update({ settings: { ...currentRoom.settings, debug_mode: !currentRoom.settings.debug_mode } }).eq('code', currentRoom.code);
  }

  // --- Player Actions ---
  const revealToPlayer = async (targetId: string) => {
      if (!currentPlayer?.role) return;
      const target = players.find(p => p.id === targetId);
      if (!target || !target.role) return;

      // Logic: If I am "related" to Target, condition met.
      const myRole = currentPlayer.role;
      const targetRole = target.role;

      let myConditionMet = currentPlayer.condition_met;
      let targetConditionMet = target.condition_met;
      let updateNeeded = false;

      // Check Forward Link (Me -> Target)
      if (myRole.relatedRoleId && myRole.relatedRoleId === targetRole.id) {
          myConditionMet = true;
          updateNeeded = true;
          alert(`Success! You found ${target.name} (${targetRole.name}).`);
      } else {
          alert(`You revealed to ${target.name}. They are: ${targetRole.name}`);
      }

      // Check Reverse Link (Target -> Me) - if mutual reveal implies mutual success
      if (targetRole.relatedRoleId && targetRole.relatedRoleId === myRole.id) {
          targetConditionMet = true;
          updateNeeded = true;
      }

      if (updateNeeded) {
          // Ideally use RPC, but client-side update for prototype:
          if (myConditionMet !== currentPlayer.condition_met) {
              await supabase.from('players').update({ condition_met: true }).eq('id', currentPlayer.id);
          }
          if (targetConditionMet !== target.condition_met) {
              await supabase.from('players').update({ condition_met: true }).eq('id', target.id);
          }
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Views ---

  if (view === 'LANDING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-blue-500 mb-2 tracking-tighter z-10">TWO ROOMS</h1>
        <h2 className="text-4xl font-black text-white mb-10 tracking-widest z-10">BOOM</h2>
        
        <div className="w-full max-w-sm space-y-4 z-10 backdrop-blur-sm bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <input 
            type="text" 
            placeholder="Enter Your Name" 
            className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-rose-500 outline-none transition text-center font-bold"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="ROOM CODE" 
            className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-blue-500 outline-none transition uppercase text-center font-mono tracking-widest"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
          />
          
          <button 
            disabled={loading}
            onClick={() => joinRoom(false)} 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-4 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 active:scale-95">
            {loading ? 'Connecting...' : 'Join Game'}
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-mono">HOST OPTIONS</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button 
            disabled={loading}
            onClick={() => joinRoom(true)} 
            className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 p-3 rounded-xl font-bold transition text-slate-300 text-sm active:scale-95">
            Create Room as God
          </button>
          
          {errorMsg && (
            <div className="bg-red-900/50 border border-red-500/50 p-3 rounded text-red-200 text-sm text-center">
                {errorMsg}
                {errorMsg.includes("Database") && <div className="mt-2 text-xs text-red-300 underline cursor-pointer" onClick={() => alert("Run the SQL in SUPABASE_SETUP.md")}>View Setup Instructions</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Main Game Rendering ---
  
  if (currentRoom?.status === GameStatus.LOBBY && !currentPlayer?.is_god) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-900">
        <h2 className="text-3xl font-bold mb-4 text-white">Waiting for God...</h2>
        <div className="animate-bounce text-6xl mb-8">⏳</div>
        <p className="text-slate-400 font-mono mb-8">Room Code: <span className="text-white font-bold">{currentRoom.code}</span></p>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {players.map(p => (
                <span key={p.id} className={`px-4 py-2 rounded-full text-sm font-bold border ${p.is_god ? 'bg-yellow-900/30 border-yellow-600 text-yellow-500' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                    {p.name} {p.is_god ? '👑' : ''}
                </span>
            ))}
        </div>
      </div>
    );
  }

  if (currentRoom?.status === GameStatus.FINISHED && currentRoom.winner) {
      if (currentRoom.winner === Team.RED) return <BombExplosion />;
      if (currentRoom.winner === Team.BLUE) return <MockeryEffect />;
  }

  // --- God View ---
  if (currentPlayer?.is_god) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
        {/* God Header */}
        <header className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
            <div>
                <h1 className="text-lg font-black text-yellow-500 flex items-center gap-2">
                    <span>👑</span> GOD MODE
                </h1>
                <div className="text-xs text-slate-400 font-mono">CODE: {currentRoom?.code}</div>
            </div>
            <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${currentRoom?.status === GameStatus.PLAYING ? 'text-green-400' : 'text-slate-500'}`}>
                    {currentRoom?.status === GameStatus.PLAYING ? formatTime(timeLeft) : 'PAUSED'}
                </div>
                <div className="text-xs text-slate-400">Round {currentRoom?.current_round} / {currentRoom?.settings.rounds}</div>
            </div>
        </header>

        <div className="flex-grow p-4 space-y-6 overflow-y-auto">
            
            {/* LOBBY: Role Configuration */}
            {currentRoom?.status === GameStatus.LOBBY && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-white">Deck Configuration</h3>
                        <span className="text-xs bg-indigo-900 text-indigo-200 px-2 py-1 rounded">
                            {currentRoom.custom_roles.length} Special Roles Selected
                        </span>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        {/* Selected Roles List */}
                        <div className="flex flex-wrap gap-2">
                            {currentRoom.custom_roles.map((role, idx) => (
                                <div key={idx} className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border text-sm ${role.team === Team.BLUE ? 'bg-blue-900/30 border-blue-700 text-blue-200' : role.team === Team.RED ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                                    <span>{role.name}</span>
                                    {!role.isKeyRole && (
                                        <button 
                                            onClick={() => {
                                                const newRoles = currentRoom.custom_roles.filter((_, i) => i !== idx);
                                                updateRoles(newRoles);
                                            }}
                                            className="hover:bg-black/20 rounded p-0.5"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Role Section */}
                        <div className="pt-4 border-t border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Add Special Roles</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {BASE_ROLES.filter(r => !r.isKeyRole && r.id !== 'blue_team' && r.id !== 'red_team').map(role => (
                                    <button 
                                        key={role.id}
                                        onClick={() => updateRoles([...currentRoom.custom_roles, role])}
                                        className="text-left p-2 rounded bg-slate-700/50 hover:bg-slate-700 border border-slate-600 flex items-center justify-between group transition"
                                    >
                                        <span className="text-sm font-medium">{role.name}</span>
                                        <PlusIcon />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Role Creator */}
                        <details className="pt-2">
                            <summary className="text-xs font-bold text-indigo-400 cursor-pointer uppercase mb-2">Create Custom Role +</summary>
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const name = (form.elements.namedItem('cName') as HTMLInputElement).value;
                                    const desc = (form.elements.namedItem('cDesc') as HTMLInputElement).value;
                                    const team = (form.elements.namedItem('cTeam') as HTMLSelectElement).value as Team;
                                    
                                    const newRole: Role = {
                                        id: `custom_${Date.now()}`,
                                        name,
                                        description: desc,
                                        team,
                                        isKeyRole: false,
                                        isCustom: true
                                    };
                                    updateRoles([...currentRoom.custom_roles, newRole]);
                                    form.reset();
                                }}
                                className="bg-slate-900/50 p-3 rounded space-y-2 border border-slate-700"
                            >
                                <div className="flex gap-2">
                                    <input name="cName" placeholder="Role Name" required className="bg-slate-800 p-2 rounded text-sm w-2/3 border border-slate-600" />
                                    <select name="cTeam" className="bg-slate-800 p-2 rounded text-sm w-1/3 border border-slate-600">
                                        <option value={Team.BLUE}>Blue</option>
                                        <option value={Team.RED}>Red</option>
                                        <option value={Team.GREY}>Grey</option>
                                    </select>
                                </div>
                                <textarea name="cDesc" placeholder="Description/Win Condition" required className="bg-slate-800 p-2 rounded text-sm w-full border border-slate-600" rows={2}></textarea>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm font-bold">Add Custom Role</button>
                            </form>
                        </details>
                    </div>
                </div>
            )}

            {/* Game Controls */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-slate-400 text-xs mb-3 font-bold uppercase tracking-widest">Flow Control</h3>
                    <div className="flex flex-col gap-3">
                        {currentRoom?.status === GameStatus.LOBBY && (
                            <button onClick={startGame} className="bg-emerald-600 text-white p-4 rounded-lg font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-95 transition">
                                START GAME ({players.filter(p=>!p.is_god).length} Players)
                            </button>
                        )}
                        {currentRoom?.status === GameStatus.PLAYING && (
                            <button onClick={pauseRound} className="bg-amber-600 text-white p-4 rounded-lg font-bold hover:bg-amber-500 shadow-lg shadow-amber-900/20 active:scale-95 transition flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                PAUSE / END ROUND
                            </button>
                        )}
                        {currentRoom?.status === GameStatus.PAUSED && (
                            <button onClick={nextRound} className="bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-95 transition">
                                START ROUND {currentRoom.current_round + 1} ({Math.floor((currentRoom.settings.round_lengths[currentRoom.current_round] || 60)/60)}m)
                            </button>
                        )}
                        <button onClick={toggleDebug} className={`p-2 rounded text-xs border transition ${currentRoom?.settings.debug_mode ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'border-slate-600 text-slate-500'}`}>
                            {currentRoom?.settings.debug_mode ? 'Debug Mode: ENABLED (Allows odd/single players)' : 'Debug Mode: DISABLED'}
                        </button>
                    </div>
                </div>

                {/* Force End / Testing */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-xs mb-3 font-bold uppercase tracking-widest">Force Result</h3>
                    <div className="flex gap-3">
                        <button onClick={() => setWinner(Team.RED)} className="flex-1 bg-red-900/50 border border-red-600 p-3 rounded text-red-200 hover:bg-red-900 font-bold transition">
                            Red Wins (Boom)
                        </button>
                        <button onClick={() => setWinner(Team.BLUE)} className="flex-1 bg-blue-900/50 border border-blue-600 p-3 rounded text-blue-200 hover:bg-blue-900 font-bold transition">
                            Blue Wins (Safe)
                        </button>
                    </div>
                </div>
            </div>

            {/* Players List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-12">
                <div className="bg-slate-700/50 p-3 font-bold text-sm text-slate-300">Player Status</div>
                <div className="divide-y divide-slate-700">
                    {players.filter(p => !p.is_god).map(p => (
                        <div key={p.id} className="p-3 flex justify-between items-center">
                            <span className="font-medium text-white">{p.name}</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${p.team === Team.RED ? 'bg-red-900 text-red-200' : p.team === Team.BLUE ? 'bg-blue-900 text-blue-200' : 'bg-slate-600 text-slate-300'}`}>
                                    {p.role?.name || 'Waiting'}
                                </span>
                                {p.condition_met && <span className="text-emerald-400 bg-emerald-900/30 rounded-full px-2 py-0.5 text-xs border border-emerald-600">Matched</span>}
                            </div>
                        </div>
                    ))}
                    {players.length === 0 && <div className="p-4 text-center text-slate-500 italic">No players joined yet</div>}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- Regular Player View ---
  if (!currentPlayer || !currentPlayer.role) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
          <div className="animate-spin text-4xl mb-4">🎲</div>
          <h2 className="text-xl font-bold">Game Starting...</h2>
          <p className="text-slate-400">Receiving Role Card</p>
      </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${currentPlayer.team === Team.RED ? 'bg-red-950' : currentPlayer.team === Team.BLUE ? 'bg-blue-950' : 'bg-slate-900'}`}>
      
      {/* Top Bar */}
      <div className="bg-black/20 p-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentPlayer.team === Team.RED ? 'bg-red-600' : currentPlayer.team === Team.BLUE ? 'bg-blue-600' : 'bg-slate-600'}`}>
                 <UserIcon />
            </div>
            <span className="font-bold text-lg truncate max-w-[120px] shadow-sm">{currentPlayer.name}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft < 10 && timeLeft > 0 ? 'text-red-500 animate-pulse scale-110' : 'text-white'}`}>
            <ClockIcon />
            {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-grow flex items-center justify-center p-6 perspective-1000 overflow-hidden relative">
        {/* Ambient background glow based on team */}
        <div className={`absolute inset-0 opacity-20 blur-3xl ${currentPlayer.team === Team.RED ? 'bg-red-600' : currentPlayer.team === Team.BLUE ? 'bg-blue-600' : 'bg-slate-600'}`}></div>

        <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full max-w-sm aspect-[2/3] cursor-pointer group card-flip transition-transform duration-300 hover:scale-105 active:scale-95`}
        >
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`} style={{transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}}>
                
                {/* Back of Card (Hidden) */}
                <div className="absolute inset-0 bg-slate-800 rounded-3xl border-8 border-slate-700 shadow-2xl flex flex-col items-center justify-center backface-hidden" style={{backfaceVisibility: 'hidden'}}>
                     <div className="w-full h-full absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                     <div className="text-8xl mb-6 filter drop-shadow-lg">🕵️</div>
                     <div className="text-slate-400 font-black uppercase tracking-widest text-lg border-2 border-slate-400 px-4 py-2 rounded-lg">Tap to Reveal</div>
                     <div className="mt-8 text-slate-500 text-xs uppercase tracking-widest">Secret Identity</div>
                </div>

                {/* Front of Card (Role) */}
                <div className="absolute inset-0 bg-white text-slate-900 rounded-3xl border-8 border-white shadow-2xl overflow-hidden backface-hidden flex flex-col" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                    {/* Header */}
                    <div className={`h-6 w-full ${currentPlayer.team === Team.RED ? 'bg-red-600' : currentPlayer.team === Team.BLUE ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
                    
                    <div className="p-6 flex flex-col h-full relative z-10">
                        <div className={`absolute top-0 right-0 p-6 opacity-10 text-9xl font-black pointer-events-none ${currentPlayer.team === Team.RED ? 'text-red-500' : currentPlayer.team === Team.BLUE ? 'text-blue-500' : 'text-slate-500'}`}>?</div>

                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{currentPlayer.team} TEAM</div>
                             {currentPlayer.role.isKeyRole && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Leader</span>}
                        </div>
                        
                        <h2 className={`text-4xl font-black mb-6 leading-tight ${currentPlayer.team === Team.RED ? 'text-red-600' : currentPlayer.team === Team.BLUE ? 'text-blue-600' : 'text-slate-700'}`}>
                            {currentPlayer.role.name}
                        </h2>
                        
                        <div className="flex-grow">
                            <p className="text-lg leading-relaxed font-medium text-slate-600">{currentPlayer.role.description}</p>
                            
                            {currentPlayer.condition_met && (
                                <div className="mt-6 p-4 bg-emerald-100 border-2 border-emerald-400 rounded-xl text-emerald-800 flex items-center gap-3 shadow-sm animate-pulse">
                                    <div className="bg-emerald-500 text-white rounded-full p-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-black text-sm uppercase">Condition Met</div>
                                        <div className="text-xs font-medium">Link Established</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto text-center">
                            <div className="inline-block bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                Keep hidden
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Interaction Panel */}
      <div className="bg-slate-900/60 p-5 pb-8 backdrop-blur-xl rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 text-center tracking-widest">Player Actions</h3>
          <div className="grid grid-cols-5 gap-3">
              <button 
                onClick={() => setIsFlipped(true)}
                className="col-span-2 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition border border-slate-700 active:bg-slate-600"
              >
                  <EyeIcon /> 
                  <span className="text-xs">Show Card</span>
              </button>
              
              <div className="col-span-3 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <select 
                    onChange={(e) => {
                        if(e.target.value) {
                            if(confirm(`REVEAL your identity to ${e.target.options[e.target.selectedIndex].text}? This cannot be undone.`)) {
                                revealToPlayer(e.target.value);
                                e.target.value = "";
                            } else {
                                e.target.value = "";
                            }
                        }
                    }}
                    className="w-full h-full bg-indigo-600 hover:bg-indigo-500 pl-10 pr-4 rounded-xl font-bold text-sm text-white appearance-none outline-none transition border border-indigo-400 active:bg-indigo-700"
                    defaultValue=""
                  >
                      <option value="" disabled>Reveal to Player...</option>
                      {players.filter(p => p.id !== currentPlayer.id && !p.is_god).map(p => (
                          <option key={p.id} value={p.id} className="text-black bg-white">{p.name}</option>
                      ))}
                  </select>
              </div>
          </div>
      </div>

    </div>
  );
}