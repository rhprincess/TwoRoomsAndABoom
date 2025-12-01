
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Room, Player, GameStatus, Team, Role } from './types';
import { BASE_ROLES, DEFAULT_ROUND_LENGTHS } from './constants';
import { BombExplosion, MockeryEffect } from './components/VisualEffects';

// --- Icons ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>;

// --- Components ---

const Keypad = ({ onInput, onConfirm, onCancel, onDelete, value, label }: { onInput: (n: number) => void, onConfirm: () => void, onCancel: () => void, onDelete: () => void, value: string, label: string }) => {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm">
            <div className="text-center mb-6">
                <h3 className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2">{label}</h3>
                <div className="text-4xl font-mono font-black text-slate-800 tracking-[0.5em] h-12 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200">
                    {value.padEnd(4, '_')}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => onInput(num)} className="h-16 rounded-xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm border border-slate-200 active:scale-95">
                        {num}
                    </button>
                ))}
                <button onClick={onCancel} className="h-16 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition border border-red-100 active:scale-95 text-sm">取消</button>
                <button onClick={() => onInput(0)} className="h-16 rounded-xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm border border-slate-200 active:scale-95">0</button>
                <button onClick={onDelete} className="h-16 rounded-xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-200 transition border border-slate-200 active:scale-95 flex items-center justify-center">
                    <DeleteIcon />
                </button>
            </div>
            <button 
                onClick={onConfirm}
                disabled={value.length !== 4}
                className="w-full mt-4 h-16 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg active:scale-95">
                确认进入
            </button>
        </div>
    );
}

export default function App() {
  const [view, setView] = useState<'ROLE_SELECT' | 'PLAYER_NAME' | 'CODE_ENTRY' | 'LOBBY' | 'GAME'>('ROLE_SELECT');
  const [roleMode, setRoleMode] = useState<'PLAYER' | 'GOD' | null>(null);
  
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Custom Role Form State ---
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customRoleWin, setCustomRoleWin] = useState('');
  const [customRoleTeam, setCustomRoleTeam] = useState<Team>(Team.GREY);

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

  const handleKeypadInput = (num: number) => {
      if (roomCode.length < 4) setRoomCode(prev => prev + num);
  };

  const handleKeypadDelete = () => {
      setRoomCode(prev => prev.slice(0, -1));
  };

  const joinRoom = async () => {
    if (!roomCode || (roleMode === 'PLAYER' && !playerName)) return;
    setLoading(true);

    try {
      let { data: roomData } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
      const isGod = roleMode === 'GOD';
      
      if (!roomData) {
        if (isGod) {
          // Initialize Room
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
          alert("房间不存在");
          setLoading(false);
          return;
        }
      }

      const playerId = crypto.randomUUID();
      const newPlayer: Partial<Player> = {
        id: playerId,
        room_code: roomCode,
        name: isGod ? '上帝' : playerName,
        is_god: isGod,
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
      setView(isGod ? 'GAME' : 'LOBBY'); 

    } catch (e: any) {
      console.error(e);
      alert(e.message || "加入失败");
    } finally {
      setLoading(false);
    }
  };

  const updateRoles = async (newRoles: Role[]) => {
      if(!currentRoom) return;
      await supabase.from('rooms').update({ custom_roles: newRoles }).eq('code', currentRoom.code);
  };

  const startGame = async () => {
    if (!currentRoom) return;
    
    // Validation
    const playingPlayers = players.filter(p => !p.is_god);
    const playerCount = playingPlayers.length;
    
    if (!currentRoom.settings.debug_mode) {
        if (playerCount < currentRoom.settings.min_players) {
            alert(`至少需要 ${currentRoom.settings.min_players} 名玩家。`);
            return;
        }
        if (playerCount % 2 !== 0) {
            alert("玩家人数必须为双数 (或开启测试模式)。");
            return;
        }
    }

    // Deck Construction
    const deck = [...currentRoom.custom_roles];
    if (deck.length > playerCount) {
        alert(`角色卡牌过多 (${deck.length}) 超过玩家人数 (${playerCount})。请移除一些特殊角色。`);
        return;
    }

    const remainingSlots = playerCount - deck.length;
    const blueTeamCard = BASE_ROLES.find(r => r.id === 'blue_team')!;
    const redTeamCard = BASE_ROLES.find(r => r.id === 'red_team')!;
    
    const blueFills = Math.ceil(remainingSlots / 2);
    const redFills = Math.floor(remainingSlots / 2);

    for (let i = 0; i < blueFills; i++) deck.push(blueTeamCard);
    for (let i = 0; i < redFills; i++) deck.push(redTeamCard);

    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    const updates = playingPlayers.map((p, index) => ({
      ...p,
      role: shuffledDeck[index],
      team: shuffledDeck[index].team
    }));

    for (const p of updates) {
       await supabase.from('players').update({ role: p.role, team: p.team, condition_met: false }).eq('id', p.id);
    }

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

  const resetGame = async () => {
      if(!currentRoom) return;
      // Reset Room
      await supabase.from('rooms').update({
          status: GameStatus.LOBBY,
          current_round: 0,
          round_end_time: null,
          winner: null
      }).eq('code', currentRoom.code);
      
      // Reset Players
      const { error } = await supabase.from('players')
          .update({ role: null, team: Team.GREY, is_revealed: false, condition_met: false })
          .eq('room_code', currentRoom.code)
          .eq('is_god', false);

      if(error) console.error(error);
  };

  const toggleDebug = async () => {
      if(!currentRoom) return;
      await supabase.from('rooms').update({ settings: { ...currentRoom.settings, debug_mode: !currentRoom.settings.debug_mode } }).eq('code', currentRoom.code);
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Views ---

  // 1. Role Selection
  if (view === 'ROLE_SELECT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-slate-800">
        <h1 className="text-4xl font-black mb-12 tracking-tight">两室<span className="text-red-500">一弹</span></h1>
        
        <div className="w-full max-w-sm space-y-4">
            <button 
                onClick={() => { setRoleMode('PLAYER'); setView('PLAYER_NAME'); }}
                className="w-full bg-white border-2 border-slate-200 p-8 rounded-3xl text-xl font-bold shadow-sm hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-between group"
            >
                <span>我是玩家</span>
                <span className="group-hover:translate-x-1 transition">→</span>
            </button>
            <button 
                onClick={() => { setRoleMode('GOD'); setView('CODE_ENTRY'); }}
                className="w-full bg-slate-900 text-white p-8 rounded-3xl text-xl font-bold shadow-lg hover:bg-slate-800 transition flex items-center justify-between group"
            >
                <span>我是上帝</span>
                <span className="group-hover:translate-x-1 transition">→</span>
            </button>
        </div>
      </div>
    );
  }

  // 2. Player Name Input
  if (view === 'PLAYER_NAME') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
            <div className="w-full max-w-sm">
                <button onClick={() => setView('ROLE_SELECT')} className="mb-8 text-slate-400 font-bold text-sm">← 返回</button>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">你的名字?</h2>
                <input 
                    autoFocus
                    type="text" 
                    value={playerName} 
                    onChange={e => setPlayerName(e.target.value)} 
                    placeholder="输入昵称..." 
                    className="w-full p-6 text-2xl font-bold bg-white rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none transition text-center"
                />
                <button 
                    disabled={!playerName.trim()}
                    onClick={() => setView('CODE_ENTRY')}
                    className="w-full mt-6 bg-blue-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-200"
                >
                    下一步
                </button>
            </div>
        </div>
      );
  }

  // 3. Code Entry
  if (view === 'CODE_ENTRY') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
            <button onClick={() => setView(roleMode === 'GOD' ? 'ROLE_SELECT' : 'PLAYER_NAME')} className="absolute top-8 left-8 text-slate-400 font-bold text-sm">← 取消</button>
            <Keypad 
                label={roleMode === 'GOD' ? '创建/进入房间' : '输入房间号'}
                value={roomCode}
                onInput={handleKeypadInput}
                onDelete={handleKeypadDelete}
                onCancel={() => setRoomCode('')}
                onConfirm={joinRoom}
            />
            {loading && <div className="mt-4 text-slate-500 font-medium animate-pulse">连接中...</div>}
        </div>
      );
  }

  // --- Main Game Logic Rendering ---

  // Game End Effects
  if (currentRoom?.status === GameStatus.FINISHED && currentRoom.winner) {
      if (currentPlayer?.is_god) {
          // God sees the result and a reset button
          return (
              <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50 relative">
                   <h1 className={`text-6xl font-black mb-4 ${currentRoom.winner === Team.RED ? 'text-red-500' : 'text-blue-500'}`}>
                       {currentRoom.winner === Team.RED ? '红队胜利' : '蓝队胜利'}
                   </h1>
                   <p className="text-slate-400 mb-12">本局游戏已结束</p>
                   <button 
                    onClick={resetGame}
                    className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition shadow-2xl"
                   >
                       再来一局 ↺
                   </button>
              </div>
          );
      }
      if (currentRoom.winner === Team.RED) return <BombExplosion />;
      if (currentRoom.winner === Team.BLUE) return <MockeryEffect />;
  }

  // Lobby (Player View)
  if (currentRoom?.status === GameStatus.LOBBY && !currentPlayer?.is_god) {
    return (
      <div className="flex flex-col items-center min-h-screen p-6 bg-slate-50">
        <div className="w-full max-w-md mt-12 bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
            <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-2">等待开始</h2>
            <div className="text-5xl font-mono font-black text-slate-900 mb-8">{currentRoom.code}</div>
            
            <div className="flex flex-wrap justify-center gap-2">
                {players.map(p => (
                    <span key={p.id} className={`px-3 py-1 rounded-full text-xs font-bold border ${p.is_god ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {p.name} {p.is_god ? '👑' : ''}
                    </span>
                ))}
            </div>
            <div className="mt-8 text-sm text-slate-400 animate-pulse">上帝正在配置游戏...</div>
        </div>
      </div>
    );
  }

  // --- God View ---
  if (currentPlayer?.is_god) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">GOD</div>
                <div className="font-mono font-bold text-xl text-slate-900">{currentRoom?.code}</div>
            </div>
            <div className="text-right">
                 <div className={`text-xl font-mono font-bold ${currentRoom?.status === GameStatus.PLAYING ? 'text-blue-600' : 'text-slate-400'}`}>
                    {currentRoom?.status === GameStatus.PLAYING ? formatTime(timeLeft) : currentRoom?.status}
                 </div>
            </div>
        </header>

        <div className="flex-grow p-4 space-y-4 overflow-y-auto pb-20">
            
            {/* LOBBY: Deck Builder */}
            {currentRoom?.status === GameStatus.LOBBY && (
                <div className="space-y-4">
                    {/* Active Deck */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">当前卡牌池</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{currentRoom.custom_roles.length} 张</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {currentRoom.custom_roles.map((role, idx) => (
                                <div key={idx} className={`relative group pl-3 pr-8 py-2 rounded-lg text-sm font-bold border ${role.team === Team.BLUE ? 'bg-blue-50 border-blue-200 text-blue-700' : role.team === Team.RED ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                    {role.name}
                                    {!role.isKeyRole && (
                                        <button 
                                            onClick={() => updateRoles(currentRoom.custom_roles.filter((_, i) => i !== idx))}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Standard Roles */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">添加标准角色</h3>
                        <div className="grid grid-cols-2 gap-2">
                             {BASE_ROLES.filter(r => !r.isKeyRole && r.id !== 'blue_team' && r.id !== 'red_team').map(role => (
                                <button 
                                    key={role.id}
                                    onClick={() => updateRoles([...currentRoom.custom_roles, role])}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                                >
                                    <span className="text-sm font-medium text-slate-700">{role.name}</span>
                                    <span className="text-slate-400">+</span>
                                </button>
                             ))}
                        </div>
                    </div>

                    {/* Create Custom Role */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">创建自定义卡牌</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                             {/* Card Preview */}
                             <div className={`p-4 rounded-xl border-l-4 mb-4 bg-white shadow-sm ${customRoleTeam === Team.RED ? 'border-red-500' : customRoleTeam === Team.BLUE ? 'border-blue-500' : 'border-slate-400'}`}>
                                 <div className="text-xs font-bold uppercase text-slate-400 mb-1">{customRoleTeam === Team.RED ? '红队' : customRoleTeam === Team.BLUE ? '蓝队' : '灰队'}</div>
                                 <div className="font-black text-xl text-slate-800 mb-1">{customRoleName || '角色名称'}</div>
                                 <div className="text-xs text-slate-500">{customRoleDesc || '描述...'}</div>
                                 {customRoleWin && <div className="mt-2 text-xs font-bold text-slate-700">胜利条件: {customRoleWin}</div>}
                             </div>

                             <div className="flex gap-2">
                                <input 
                                    value={customRoleName}
                                    onChange={e => setCustomRoleName(e.target.value)}
                                    placeholder="名称" 
                                    className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"
                                />
                                <select 
                                    value={customRoleTeam}
                                    onChange={e => setCustomRoleTeam(e.target.value as Team)}
                                    className="p-2 rounded-lg border border-slate-300 text-sm"
                                >
                                    <option value={Team.BLUE}>蓝队</option>
                                    <option value={Team.RED}>红队</option>
                                    <option value={Team.GREY}>灰队</option>
                                </select>
                             </div>
                             <input 
                                value={customRoleDesc}
                                onChange={e => setCustomRoleDesc(e.target.value)}
                                placeholder="角色能力/描述" 
                                className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                             />
                             <input 
                                value={customRoleWin}
                                onChange={e => setCustomRoleWin(e.target.value)}
                                placeholder="胜利条件 (可选)" 
                                className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                             />
                             <button 
                                onClick={() => {
                                    if(!customRoleName) return;
                                    const newRole: Role = {
                                        id: `custom_${Date.now()}`,
                                        name: customRoleName,
                                        description: customRoleDesc,
                                        team: customRoleTeam,
                                        isKeyRole: false,
                                        isCustom: true,
                                        winCondition: customRoleWin
                                    };
                                    updateRoles([...currentRoom.custom_roles, newRole]);
                                    setCustomRoleName('');
                                    setCustomRoleDesc('');
                                    setCustomRoleWin('');
                                }}
                                className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800"
                             >
                                 添加至卡组
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Controls */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50">
                <div className="flex gap-2 max-w-md mx-auto">
                    {currentRoom?.status === GameStatus.LOBBY && (
                        <button onClick={startGame} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition">
                            开始游戏 ({players.filter(p=>!p.is_god).length} 人)
                        </button>
                    )}
                    {currentRoom?.status === GameStatus.PLAYING && (
                        <button onClick={pauseRound} className="flex-1 bg-amber-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition">
                            暂停 / 结束回合
                        </button>
                    )}
                    {currentRoom?.status === GameStatus.PAUSED && (
                        <button onClick={nextRound} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">
                            开始第 {currentRoom.current_round + 1} 回合
                        </button>
                    )}
                    
                    {/* Debug Toggle */}
                     <button onClick={toggleDebug} className={`px-3 rounded-xl border font-bold text-xs ${currentRoom?.settings.debug_mode ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {currentRoom?.settings.debug_mode ? '测试' : '正式'}
                    </button>
                </div>
            </div>

            {/* Winner Override (Hidden in Details) */}
            <details className="text-center pb-24">
                <summary className="text-xs text-slate-400 font-bold uppercase tracking-widest cursor-pointer mb-4">强制结束游戏</summary>
                <div className="flex gap-2 max-w-md mx-auto">
                    <button onClick={() => setWinner(Team.RED)} className="flex-1 border-2 border-red-500 text-red-500 p-2 rounded-lg font-bold text-sm hover:bg-red-50">红队胜</button>
                    <button onClick={() => setWinner(Team.BLUE)} className="flex-1 border-2 border-blue-500 text-blue-500 p-2 rounded-lg font-bold text-sm hover:bg-blue-50">蓝队胜</button>
                </div>
            </details>
        </div>
      </div>
    );
  }

  // --- Regular Player View (Game) ---
  if (!currentPlayer || !currentPlayer.role) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
          <div className="animate-spin text-4xl mb-4 text-slate-300">↻</div>
          <h2 className="text-xl font-bold text-slate-800">游戏开始中...</h2>
          <p className="text-slate-500">正在分发身份卡牌</p>
      </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${currentPlayer.team === Team.RED ? 'bg-red-50' : currentPlayer.team === Team.BLUE ? 'bg-blue-50' : 'bg-slate-50'}`}>
      
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-200">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full text-white ${currentPlayer.team === Team.RED ? 'bg-red-500' : currentPlayer.team === Team.BLUE ? 'bg-blue-500' : 'bg-slate-500'}`}>
                 <UserIcon />
            </div>
            <span className="font-bold text-slate-800 text-lg truncate max-w-[120px]">{currentPlayer.name}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft < 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
            <ClockIcon />
            {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-grow flex items-center justify-center p-6 perspective-1000 overflow-hidden relative">
        <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full max-w-sm aspect-[2/3] cursor-pointer group card-flip transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]`}
        >
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`} style={{transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}}>
                
                {/* Back of Card (Hidden State) */}
                <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center justify-center backface-hidden" style={{backfaceVisibility: 'hidden'}}>
                     {/* Pattern */}
                     <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')]"></div>
                     
                     <div className="z-10 bg-slate-900 text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl shadow-lg mb-6">?</div>
                     <div className="z-10 text-slate-900 font-black uppercase tracking-widest text-lg border-2 border-slate-900 px-6 py-2 rounded-lg">点击查看身份</div>
                </div>

                {/* Front of Card (Role) */}
                <div className="absolute inset-0 bg-white text-slate-900 rounded-3xl border-8 border-white shadow-2xl overflow-hidden backface-hidden flex flex-col" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                    {/* Color Header */}
                    <div className={`h-4 w-full ${currentPlayer.team === Team.RED ? 'bg-red-500' : currentPlayer.team === Team.BLUE ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                    
                    <div className="p-8 flex flex-col h-full relative z-10">
                        {/* Watermark */}
                        <div className={`absolute bottom-0 right-0 p-6 opacity-5 text-9xl font-black pointer-events-none`}>
                            {currentPlayer.team === Team.RED ? 'RED' : currentPlayer.team === Team.BLUE ? 'BLUE' : 'GREY'}
                        </div>

                        <div className="flex justify-between items-start mb-4">
                             <div className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${currentPlayer.team === Team.RED ? 'bg-red-100 text-red-700' : currentPlayer.team === Team.BLUE ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                 {currentPlayer.team === Team.RED ? '红队' : currentPlayer.team === Team.BLUE ? '蓝队' : '灰队'}
                             </div>
                             {currentPlayer.role.isKeyRole && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">★ 领袖</span>}
                        </div>
                        
                        <h2 className={`text-4xl font-black mb-6 leading-tight ${currentPlayer.team === Team.RED ? 'text-red-600' : currentPlayer.team === Team.BLUE ? 'text-blue-600' : 'text-slate-800'}`}>
                            {currentPlayer.role.name}
                        </h2>
                        
                        <div className="space-y-6 flex-grow">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">角色能力</h4>
                                <p className="text-lg font-medium text-slate-700 leading-relaxed">{currentPlayer.role.description}</p>
                            </div>

                            {currentPlayer.role.winCondition && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">胜利条件</h4>
                                    <p className="text-sm font-bold text-slate-800">{currentPlayer.role.winCondition}</p>
                                </div>
                            )}
                            
                            {currentPlayer.condition_met && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3 animate-pulse">
                                    <div className="bg-green-500 text-white rounded-full p-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div className="font-bold text-sm">链接已达成</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto text-center pt-6 border-t border-slate-100">
                            <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                                请勿向他人展示手机屏幕
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
    </div>
  );
}
