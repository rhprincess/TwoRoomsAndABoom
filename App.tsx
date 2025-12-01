
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { Room, Player, GameStatus, Team, Role, CardSet } from './types';
import { BASE_ROLES, DEFAULT_ROUND_LENGTHS, COLORS } from './constants';
import { BombExplosion, MockeryEffect } from './components/VisualEffects';

// --- Icons ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>;
const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 111.772.954l-2.463 4.621 1.991.995a1 1 0 11-.894 1.79l-1.233-.616 1.733 5.426a1 1 0 01-1.429 1.285l-4.59.816-1.554-4.867 1.233.617a1 1 0 01.894-1.79l-1.991-.995-2.463-4.621a1 1 0 111.772-.954l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552a1 1 0 01-1.285.592l-1.636-.596a1 1 0 11.697-1.874l1.248.455.795-2.486a1 1 0 111.9.957zM15 10.274l.818 2.552a1 1 0 001.285.592l1.636-.596a1 1 0 00-.697-1.874l-1.248.455-.795-2.486a1 1 0 00-1.9.957z" clipRule="evenodd" /></svg>;
const BombIcon = () => <span className="text-2xl">💣</span>;
const StarIcon = () => <span className="text-2xl">★</span>;
const QuestionIcon = () => <span className="text-2xl">?</span>;

// --- Components ---

const FloatingIcons = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 15 }).map((_, i) => (
                <div 
                    key={i} 
                    className="floating-icon text-white"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${15 + Math.random() * 20}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        fontSize: `${20 + Math.random() * 40}px`
                    }}
                >
                    {['💣', '★', '?', '🃏'][Math.floor(Math.random() * 4)]}
                </div>
            ))}
        </div>
    );
};

const Keypad = ({ onInput, onConfirm, onCancel, onDelete, value, label, loading }: any) => {
    return (
        <div className="bg-[#4d4696] border border-white/20 p-6 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 backdrop-blur-sm">
            <div className="text-center mb-6">
                <h3 className="text-white/70 uppercase text-xs font-bold tracking-widest mb-2">{label}</h3>
                <div className="text-4xl font-mono font-black text-white tracking-[0.5em] h-14 flex items-center justify-center bg-black/20 rounded-xl border border-white/10">
                    {value.padEnd(4, '_')}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => onInput(num)} className="h-16 rounded-xl bg-white/10 text-2xl font-bold text-white hover:bg-white/20 transition shadow-sm active:scale-95">
                        {num}
                    </button>
                ))}
                <button onClick={onCancel} className="h-16 rounded-xl bg-red-500/20 text-red-300 font-bold hover:bg-red-500/30 transition active:scale-95 text-sm">取消</button>
                <button onClick={() => onInput(0)} className="h-16 rounded-xl bg-white/10 text-2xl font-bold text-white hover:bg-white/20 transition shadow-sm active:scale-95">0</button>
                <button onClick={onDelete} className="h-16 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition active:scale-95 flex items-center justify-center">
                    <DeleteIcon />
                </button>
            </div>
            <button 
                onClick={onConfirm}
                disabled={value.length !== 4 || loading}
                className="w-full mt-4 h-16 bg-[#5abb2d] text-white rounded-xl font-bold text-lg hover:bg-[#185021] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg active:scale-95 flex items-center justify-center">
                {loading ? <span className="animate-spin mr-2">↻</span> : '确认进入'}
            </button>
        </div>
    );
}

const CardDisplay = ({ role, team }: { role: Role | null, team: Team }) => {
    const isRed = team === Team.RED;
    const isBlue = team === Team.BLUE;
    // Grey fallback
    
    // Theme Colors based on Team
    const bgCol = isRed ? COLORS.RED_BG : isBlue ? COLORS.BLUE_BG : COLORS.GREY_BG;
    const textCol = isRed ? COLORS.RED_TEXT : isBlue ? COLORS.BLUE_TEXT : COLORS.GREY_TEXT;
    const teamName = isRed ? '紅隊' : isBlue ? '藍隊' : '灰隊';
    const Icon = isRed ? BombIcon : isBlue ? StarIcon : QuestionIcon;

    if (!role) return null;

    return (
        <div 
            className="w-full h-full rounded-2xl overflow-hidden shadow-2xl flex flex-col border-4"
            style={{ backgroundColor: bgCol, borderColor: textCol, color: textCol }}
        >
            {/* Top Section */}
            <div className="flex-grow flex flex-row h-3/4 relative">
                {/* Left: Description */}
                <div className="w-2/3 p-4 flex flex-col justify-center border-r-2 border-dashed" style={{ borderColor: textCol }}>
                    <div className="text-4xl mb-2 text-center opacity-80">
                         {isRed ? '🧨' : isBlue ? '🛡️' : '🎲'}
                    </div>
                    <p className="text-sm font-bold leading-relaxed">{role.description}</p>
                    {role.winCondition && (
                        <div className="mt-2 text-xs opacity-80 border-t pt-2" style={{ borderColor: textCol }}>
                            胜: {role.winCondition}
                        </div>
                    )}
                </div>
                {/* Right: Vertical Name */}
                <div className="w-1/3 flex items-center justify-center relative bg-black/5">
                    <div className="writing-vertical-rl text-3xl font-black font-traditional tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full whitespace-nowrap">
                        {role.name}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Footer */}
            <div className="h-1/4 flex items-center justify-between px-6 border-t-4" style={{ borderColor: textCol, backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <span className="text-2xl font-black font-traditional">{teamName}</span>
                <div className="scale-125 transform drop-shadow-md">
                    <Icon />
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<'HOME' | 'PLAYER_NAME' | 'CODE_ENTRY' | 'LOBBY' | 'GAME'>('HOME');
  const [roleMode, setRoleMode] = useState<'PLAYER' | 'GOD' | null>(null);
  
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false); // Specific for preventing double join
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false); // Controls if player sees their card
  
  // God Mode States
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customRoleWin, setCustomRoleWin] = useState('');
  const [customRoleTeam, setCustomRoleTeam] = useState<Team>(Team.GREY);
  const [saveSetName, setSaveSetName] = useState('');

  // Animation States
  const [shuffling, setShuffling] = useState(false);

  // --- Realtime ---
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${currentRoom.code}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
            // Room deleted
            alert('房间已关闭');
            window.location.reload();
            return;
        }
        setCurrentRoom(payload.new as Room);
        
        // Trigger Shuffle Animation if status changes to DISTRIBUTING
        if ((payload.new as Room).status === GameStatus.DISTRIBUTING) {
            setShuffling(true);
            setTimeout(() => setShuffling(false), 3000); // 3s shuffle
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${currentRoom.code}` }, () => {
        fetchPlayers(currentRoom.code);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentRoom?.code]);

  const fetchPlayers = async (code: string) => {
    const { data } = await supabase.from('players').select('*').eq('room_code', code).order('joined_at');
    if (data) {
        setPlayers(data);
        const me = data.find(p => p.id === currentPlayer?.id);
        if (me) setCurrentPlayer(me);
    }
  };

  const fetchCardSets = async () => {
      const { data } = await supabase.from('card_sets').select('*');
      if (data) setCardSets(data);
  }

  // --- Timer ---
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== GameStatus.PLAYING || !currentRoom.round_end_time) {
      setTimeLeft(0);
      return;
    }

    const calculateTime = () => {
        if (!currentRoom.round_end_time) return 0;
        const end = new Date(currentRoom.round_end_time).getTime();
        const now = new Date().getTime(); 
        return Math.max(0, Math.ceil((end - now) / 1000));
    };
    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      const diff = calculateTime();
      setTimeLeft(diff);
      if (diff <= 0 && currentPlayer?.is_god) pauseRound();
    }, 250);
    return () => clearInterval(interval);
  }, [currentRoom?.status, currentRoom?.round_end_time, currentPlayer?.is_god]);

  // --- Actions ---

  const handleKeypadInput = (num: number) => { if (roomCode.length < 4) setRoomCode(prev => prev + num); };
  const handleKeypadDelete = () => { setRoomCode(prev => prev.slice(0, -1)); };

  const joinRoom = async () => {
    if (!roomCode || (roleMode === 'PLAYER' && !playerName) || joinLoading) return;
    setJoinLoading(true);

    try {
      let { data: roomData } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
      const isGod = roleMode === 'GOD';
      
      if (!roomData) {
        if (isGod) {
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
          setJoinLoading(false);
          return;
        }
      }

      // Check if player already exists in this session? (Simplified: check local storage or just rely on new ID)
      // We generate a new ID every time here, assuming strict session.
      
      const newPlayer: Partial<Player> = {
        id: crypto.randomUUID(),
        room_code: roomCode,
        name: isGod ? '上帝' : playerName,
        is_god: isGod,
        team: Team.GREY,
        role: null,
        is_revealed: false,
        condition_met: false,
        joined_at: new Date().toISOString(),
        room_number: null,
        is_leader: false
      };

      const { error: joinError } = await supabase.from('players').insert(newPlayer);
      if (joinError) throw joinError;

      setCurrentRoom(roomData);
      setCurrentPlayer(newPlayer as Player);
      await fetchPlayers(roomCode);
      if (isGod) fetchCardSets();
      setView(isGod ? 'GAME' : 'LOBBY'); 

    } catch (e: any) {
      console.error(e);
      alert("加入失败: " + e.message);
    } finally {
      setJoinLoading(false);
    }
  };

  // God Logic
  const updateRoles = async (newRoles: Role[]) => {
      if(!currentRoom) return;
      await supabase.from('rooms').update({ custom_roles: newRoles }).eq('code', currentRoom.code);
  };

  const saveCardSet = async () => {
      if (!saveSetName || !currentRoom) return;
      await supabase.from('card_sets').insert({
          name: saveSetName,
          roles: currentRoom.custom_roles
      });
      setSaveSetName('');
      fetchCardSets();
      alert('卡组已保存');
  };

  const loadCardSet = async (setId: string) => {
      const set = cardSets.find(s => s.id === setId);
      if (set && currentRoom) {
          await updateRoles(set.roles);
      }
  };

  const distributeRoles = async () => {
      if (!currentRoom) return;
      
      const playingPlayers = players.filter(p => !p.is_god);
      const playerCount = playingPlayers.length;

      // Validation
      if (!currentRoom.settings.debug_mode) {
          if (playerCount < currentRoom.settings.min_players) {
              alert(`人数不足，至少 ${currentRoom.settings.min_players} 人`);
              return;
          }
          if (playerCount % 2 !== 0) {
              alert("人数必须为双数");
              return;
          }
      }

      // Logic
      const deck = [...currentRoom.custom_roles];
      if (deck.length > playerCount) {
          alert("卡牌数量多于玩家数量");
          return;
      }
      
      // Fill
      const remaining = playerCount - deck.length;
      const blueFill = BASE_ROLES.find(r => r.id === 'blue_team')!;
      const redFill = BASE_ROLES.find(r => r.id === 'red_team')!;
      for(let i=0; i<Math.ceil(remaining/2); i++) deck.push(blueFill);
      for(let i=0; i<Math.floor(remaining/2); i++) deck.push(redFill);
      
      const shuffledDeck = deck.sort(() => Math.random() - 0.5);
      const shuffledPlayers = [...playingPlayers].sort(() => Math.random() - 0.5);
      const half = Math.ceil(playerCount / 2);

      // Distribute
      for (let i = 0; i < playerCount; i++) {
        await supabase.from('players').update({ 
            role: shuffledDeck[i], 
            team: shuffledDeck[i].team, 
            condition_met: false,
            room_number: i < half ? 1 : 2,
            is_leader: false 
        }).eq('id', shuffledPlayers[i].id);
      }

      // Set Status to DISTRIBUTING (triggers animation)
      await supabase.from('rooms').update({
          status: GameStatus.DISTRIBUTING,
          current_round: 0
      }).eq('code', currentRoom.code);

      // Auto transition to READY after 3s handled by God client or manual?
      // Better to let God wait for animation, then button changes to "Start Timer"
      setTimeout(async () => {
          await supabase.from('rooms').update({ status: GameStatus.READY_TO_START }).eq('code', currentRoom.code);
      }, 3500);
  };

  const startGameTimer = async () => {
      if (!currentRoom) return;
      const endTime = new Date(Date.now() + currentRoom.settings.round_lengths[0] * 1000);
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
      if (nextR > 3) return;
      const length = currentRoom.settings.round_lengths[nextR - 1] || 60;
      const endTime = new Date(Date.now() + length * 1000);
      await supabase.from('rooms').update({
        status: GameStatus.PLAYING,
        current_round: nextR,
        round_end_time: endTime.toISOString()
      }).eq('code', currentRoom.code);
  };

  const closeGame = async () => {
      if (!currentRoom || !window.confirm("确定要结束游戏并删除数据吗？")) return;
      await supabase.from('rooms').delete().eq('code', currentRoom.code);
      // Players cascade delete
      window.location.reload();
  };

  const leaveGame = () => {
      window.location.reload();
  };

  // --- Render Helpers ---

  if (view === 'HOME') {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
        <FloatingIcons />
        <div className="z-10 w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <div className="text-center">
                 <h1 className="text-6xl font-black mb-2 tracking-tighter drop-shadow-lg text-white font-traditional">兩室<span className="text-[#de0029]">一彈</span></h1>
                 <p className="text-white/70 font-bold tracking-widest text-sm">TWO ROOMS AND A BOOM</p>
             </div>
             
             <div className="space-y-4">
                <button 
                    onClick={() => { setRoleMode('PLAYER'); setView('PLAYER_NAME'); }}
                    className="w-full bg-[#82a0d2] text-[#4c4595] p-6 rounded-3xl text-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-between group border-4 border-[#4c4595]"
                >
                    <span>我是玩家</span>
                    <span className="group-hover:translate-x-2 transition">➔</span>
                </button>
                <button 
                    onClick={() => { setRoleMode('GOD'); setView('CODE_ENTRY'); }}
                    className="w-full bg-[#de0029] text-[#4c1417] p-6 rounded-3xl text-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-between group border-4 border-[#4c1417]"
                >
                    <span>我是上帝</span>
                    <span className="group-hover:translate-x-2 transition">➔</span>
                </button>
             </div>
        </div>
      </div>
    );
  }

  if (view === 'PLAYER_NAME') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            <FloatingIcons />
            <div className="w-full max-w-sm z-10">
                <button onClick={() => setView('HOME')} className="mb-8 text-white/50 font-bold text-sm hover:text-white transition">← 返回</button>
                <h2 className="text-3xl font-black mb-6 text-white text-center font-traditional">你的名字?</h2>
                <input 
                    autoFocus
                    type="text" 
                    value={playerName} 
                    onChange={e => setPlayerName(e.target.value)} 
                    placeholder="输入昵称..." 
                    className="w-full p-6 text-2xl font-bold bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 text-white focus:border-[#5abb2d] outline-none transition text-center placeholder:text-white/30 mb-6 shadow-inner"
                />
                <button 
                    disabled={!playerName.trim()}
                    onClick={() => setView('CODE_ENTRY')}
                    className="w-full bg-[#5abb2d] text-white p-5 rounded-2xl font-bold text-xl hover:bg-[#185021] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xl"
                >
                    下一步
                </button>
            </div>
        </div>
      );
  }

  if (view === 'CODE_ENTRY') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
             <FloatingIcons />
             <button onClick={() => setView(roleMode === 'GOD' ? 'HOME' : 'PLAYER_NAME')} className="absolute top-8 left-8 text-white/50 font-bold text-sm z-20">← 取消</button>
             <Keypad 
                loading={joinLoading}
                label={roleMode === 'GOD' ? '创建/进入房间' : '输入房间号'}
                value={roomCode}
                onInput={handleKeypadInput}
                onDelete={handleKeypadDelete}
                onCancel={() => setRoomCode('')}
                onConfirm={joinRoom}
            />
        </div>
      );
  }

  // --- GAME ---

  // EXPLOSION / WIN SCREEN
  if (currentRoom?.status === GameStatus.FINISHED && currentRoom.winner) {
      if (currentPlayer?.is_god) {
           return (
               <div className="min-h-screen bg-[#4d4696] flex flex-col items-center justify-center p-6 text-center z-50 relative">
                   <h1 className={`text-6xl font-black mb-4 font-traditional ${currentRoom.winner === Team.RED ? 'text-[#de0029]' : 'text-[#82a0d2]'}`}>
                       {currentRoom.winner === Team.RED ? '紅隊勝利' : '藍隊勝利'}
                   </h1>
                   <div className="flex flex-col gap-4 mt-12 w-full max-w-xs">
                        <button onClick={closeGame} className="bg-white/10 text-white p-4 rounded-xl font-bold hover:bg-red-500/50">结束游戏 (删除数据)</button>
                   </div>
               </div>
           )
      }
      return (
        <div className="relative">
             {currentRoom.winner === Team.RED ? <BombExplosion /> : <MockeryEffect />}
             <button onClick={leaveGame} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-white text-[#4d4696] px-8 py-3 rounded-full font-bold shadow-2xl">返回主页</button>
        </div>
      );
  }

  // SHUFFLING ANIMATION
  if (shuffling && !currentPlayer?.is_god) {
      return (
          <div className="fixed inset-0 bg-[#4d4696] z-50 flex flex-col items-center justify-center">
               <div className="relative w-48 h-64">
                   {[...Array(5)].map((_, i) => (
                       <div key={i} className="absolute inset-0 bg-white rounded-xl shadow-xl border-4 border-white"
                            style={{ 
                                animation: `shuffle 1s infinite ${i * 0.1}s`,
                                transform: `rotate(${i * 2}deg)`
                            }}
                       >
                           <div className="w-full h-full bg-[#4d4696] opacity-10 flex items-center justify-center text-4xl">?</div>
                       </div>
                   ))}
               </div>
               <h2 className="mt-12 text-2xl font-bold text-white animate-pulse">正在分发身份...</h2>
               <style>{`
                @keyframes shuffle {
                    0% { transform: translateX(0) rotate(0); }
                    50% { transform: translateX(50px) rotate(10deg); }
                    100% { transform: translateX(0) rotate(0); }
                }
               `}</style>
          </div>
      );
  }

  // PLAYER LOBBY
  if (currentRoom?.status === GameStatus.LOBBY && !currentPlayer?.is_god) {
      return (
          <div className="min-h-screen flex flex-col items-center p-6 relative">
              <FloatingIcons />
              <div className="z-10 w-full max-w-md mt-12 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center shadow-xl">
                  <h2 className="text-xl font-bold text-white/60 uppercase tracking-widest mb-2">房间号</h2>
                  <div className="text-6xl font-mono font-black text-white mb-8 tracking-wider">{currentRoom.code}</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {players.map(p => (
                        <span key={p.id} className={`px-3 py-1 rounded-full text-xs font-bold border ${p.is_god ? 'bg-[#5abb2d] text-white border-[#5abb2d]' : 'bg-white/20 text-white border-white/30'}`}>
                            {p.name} {p.is_god ? '👑' : ''}
                        </span>
                    ))}
                  </div>
                  <div className="mt-8 text-sm text-white/50 animate-pulse">等待上帝发牌...</div>
              </div>
          </div>
      )
  }

  // GOD DASHBOARD
  if (currentPlayer?.is_god) {
      // Helper for Room Columns
      const renderRoomColumn = (roomNum: 1 | 2) => {
        const roomPlayers = players.filter(p => !p.is_god && p.room_number === roomNum);
        return (
            <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                <div className={`p-3 font-bold text-center text-sm uppercase tracking-wide border-b border-white/10 flex justify-between items-center ${roomNum === 1 ? 'bg-[#4c4595] text-white' : 'bg-[#de0029] text-white'}`}>
                    <span>房间 {roomNum}</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded text-xs">{roomPlayers.length}人</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {roomPlayers.map(p => (
                        <div key={p.id} className="relative p-2 rounded-lg border border-white/10 bg-white/5 group hover:bg-white/10 transition">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white text-sm truncate">{p.name}</span>
                                {p.role && (
                                    <span className={`text-[10px] px-1.5 rounded font-bold uppercase ${p.team === Team.RED ? 'bg-[#de0029] text-white' : p.team === Team.BLUE ? 'bg-[#82a0d2] text-[#4c4595]' : 'bg-[#9b9794] text-[#656362]'}`}>
                                        {p.role.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <button 
                                    onClick={() => supabase.from('players').update({ is_leader: !p.is_leader }).eq('id', p.id)}
                                    className={`p-1.5 rounded transition ${p.is_leader ? 'bg-yellow-400 text-yellow-900' : 'text-white/20 hover:text-yellow-400'}`}
                                >
                                    <CrownIcon />
                                </button>
                                {roomNum === 1 ? (
                                    <button onClick={() => supabase.from('players').update({ room_number: 2 }).eq('id', p.id)} className="bg-white/10 hover:bg-white/20 text-white/70 text-[10px] px-2 py-1 rounded">移至 2 →</button>
                                ) : (
                                    <button onClick={() => supabase.from('players').update({ room_number: 1 }).eq('id', p.id)} className="bg-white/10 hover:bg-white/20 text-white/70 text-[10px] px-2 py-1 rounded">← 移至 1</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      };

      return (
        <div className="h-screen bg-[#2d285e] text-white flex flex-col font-sans overflow-hidden">
            <header className="bg-[#4d4696] px-4 py-2 shadow-lg flex justify-between items-center border-b border-white/10 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xl">{currentRoom?.code}</span>
                    <span className="bg-[#5abb2d] text-xs px-2 py-1 rounded font-bold">GOD</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => supabase.from('rooms').update({ winner: Team.RED, status: GameStatus.FINISHED }).eq('code', currentRoom?.code)} className="bg-[#de0029] text-white px-3 py-1 rounded text-xs font-bold border border-white/20">红胜</button>
                    <button onClick={() => supabase.from('rooms').update({ winner: Team.BLUE, status: GameStatus.FINISHED }).eq('code', currentRoom?.code)} className="bg-[#82a0d2] text-[#4c4595] px-3 py-1 rounded text-xs font-bold border border-white/20">蓝胜</button>
                    <button onClick={closeGame} className="bg-red-900/50 text-red-300 px-3 py-1 rounded text-xs font-bold">关闭</button>
                </div>
                <div className="font-mono font-bold w-12 text-right">{timeLeft > 0 ? timeLeft : '--'}</div>
            </header>

            {/* Content */}
            {currentRoom?.status === GameStatus.LOBBY ? (
                <div className="flex-grow p-4 overflow-y-auto pb-24 space-y-6">
                    {/* Live Card Preview */}
                    <div className="w-full max-w-sm mx-auto aspect-[3.5/2.5]">
                         <CardDisplay 
                            role={{
                                id: 'preview',
                                name: customRoleName || '預覽',
                                description: customRoleDesc || '描述文本...',
                                team: customRoleTeam,
                                isKeyRole: false,
                                winCondition: customRoleWin
                            }} 
                            team={customRoleTeam} 
                         />
                    </div>
                    
                    {/* Role Builder */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                        <div className="flex gap-2">
                            <input value={customRoleName} onChange={e => setCustomRoleName(e.target.value)} placeholder="角色名称 (繁体)" className="flex-1 bg-black/20 p-2 rounded text-sm outline-none border border-white/10 focus:border-[#5abb2d]" />
                            <select value={customRoleTeam} onChange={e => setCustomRoleTeam(e.target.value as Team)} className="bg-black/20 p-2 rounded text-sm border border-white/10">
                                <option value={Team.BLUE}>蓝队</option>
                                <option value={Team.RED}>红队</option>
                                <option value={Team.GREY}>灰队</option>
                            </select>
                        </div>
                        <input value={customRoleDesc} onChange={e => setCustomRoleDesc(e.target.value)} placeholder="描述" className="w-full bg-black/20 p-2 rounded text-sm outline-none border border-white/10" />
                        <input value={customRoleWin} onChange={e => setCustomRoleWin(e.target.value)} placeholder="胜利条件" className="w-full bg-black/20 p-2 rounded text-sm outline-none border border-white/10" />
                        <button 
                            onClick={() => {
                                if(!customRoleName) return;
                                const newRole = { id: `custom_${Date.now()}`, name: customRoleName, description: customRoleDesc, team: customRoleTeam, isKeyRole: false, isCustom: true, winCondition: customRoleWin };
                                updateRoles([...currentRoom.custom_roles, newRole]);
                                setCustomRoleName(''); setCustomRoleDesc(''); setCustomRoleWin('');
                            }}
                            className="w-full bg-[#5abb2d] py-2 rounded font-bold text-sm"
                        >添加至卡组</button>
                    </div>

                    {/* Current Deck */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold opacity-50 mb-3">当前卡组 ({currentRoom.custom_roles.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {currentRoom.custom_roles.map((r, i) => (
                                <div key={i} className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${r.team === Team.RED ? 'bg-[#de0029]/20 border-[#de0029]' : r.team === Team.BLUE ? 'bg-[#82a0d2]/20 border-[#82a0d2]' : 'bg-white/10 border-white/20'}`}>
                                    {r.name}
                                    {!r.isKeyRole && <button onClick={() => updateRoles(currentRoom.custom_roles.filter((_, idx) => idx !== i))} className="text-red-400 ml-1">×</button>}
                                </div>
                            ))}
                        </div>
                    </div>

                     {/* Save/Load Sets */}
                     <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                         <div className="flex gap-2">
                             <input value={saveSetName} onChange={e => setSaveSetName(e.target.value)} placeholder="新卡组名称" className="flex-1 bg-black/20 p-2 rounded text-xs" />
                             <button onClick={saveCardSet} className="bg-[#4c4595] px-3 rounded text-xs font-bold">保存配置</button>
                         </div>
                         <div className="h-24 overflow-y-auto space-y-1">
                             {cardSets.map(set => (
                                 <div key={set.id} className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                                     <span>{set.name} ({set.roles.length}卡)</span>
                                     <button onClick={() => loadCardSet(set.id)} className="text-[#5abb2d] font-bold">加载</button>
                                 </div>
                             ))}
                         </div>
                     </div>
                     
                     {/* Standard Roles Adder */}
                     <div className="grid grid-cols-2 gap-2">
                        {BASE_ROLES.filter(r => !r.isKeyRole && !['blue_team', 'red_team'].includes(r.id)).map(r => (
                            <button key={r.id} onClick={() => updateRoles([...currentRoom.custom_roles, r])} className="bg-white/5 hover:bg-white/10 p-2 rounded text-xs text-left border border-white/10">
                                + {r.name}
                            </button>
                        ))}
                     </div>
                </div>
            ) : (
                // GAME VIEW
                <div className="flex-grow flex flex-col p-2 gap-2 min-h-0">
                    <div className="flex-grow flex gap-2 min-h-0">
                        {renderRoomColumn(1)}
                        {renderRoomColumn(2)}
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="p-4 bg-[#2d285e] border-t border-white/10 sticky bottom-0 z-30">
                {currentRoom?.status === GameStatus.LOBBY && (
                    <button onClick={distributeRoles} className="w-full bg-[#5abb2d] text-white py-3 rounded-xl font-bold shadow-lg text-lg">
                        发牌并进入准备 ({players.filter(p=>!p.is_god).length}人)
                    </button>
                )}
                {currentRoom?.status === GameStatus.READY_TO_START && (
                    <button onClick={startGameTimer} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold shadow-lg text-lg animate-pulse">
                        开始游戏 (启动倒计时)
                    </button>
                )}
                {currentRoom?.status === GameStatus.PLAYING && (
                    <button onClick={pauseRound} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold">暂停 / 结束回合</button>
                )}
                {currentRoom?.status === GameStatus.PAUSED && (
                    <button onClick={nextRound} className="w-full bg-[#82a0d2] text-[#4c4595] py-3 rounded-xl font-bold">下一回合</button>
                )}
            </div>
        </div>
      )
  }

  // PLAYER GAME VIEW
  if (!currentPlayer?.role) return null;

  return (
      <div className="min-h-screen flex flex-col bg-[#4d4696] relative overflow-hidden">
          {/* Top Info */}
          <div className="p-4 flex justify-between items-center z-10 bg-[#2d285e]/80 backdrop-blur border-b border-white/10">
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${currentPlayer.team === Team.RED ? 'bg-[#de0029]' : currentPlayer.team === Team.BLUE ? 'bg-[#82a0d2]' : 'bg-[#9b9794]'}`}>
                      <UserIcon />
                  </div>
                  <div>
                      <div className="font-bold text-white leading-none">{currentPlayer.name}</div>
                      <div className="text-xs text-white/60">房间 {currentPlayer.room_number || '?'}</div>
                  </div>
                  {currentPlayer.is_leader && <span className="bg-yellow-400 text-black text-[10px] px-1 rounded font-bold">领袖</span>}
              </div>
              <div className="flex items-center gap-2 font-mono text-xl font-black text-white">
                  <ClockIcon /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
          </div>

          <div className="flex-grow flex items-center justify-center p-6 perspective-1000">
               {/* Card Container */}
               <div 
                  onClick={() => setIsFlipped(!isFlipped)} 
                  className={`relative w-full max-w-[400px] aspect-[3.5/2.5] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
               >
                   {/* FRONT (Hidden initially, Back of card visually) */}
                   <div className="absolute inset-0 backface-hidden rounded-2xl border-4 border-white/20 bg-gradient-to-br from-[#4c4595] to-[#2d285e] flex items-center justify-center shadow-2xl">
                       <div className="text-6xl opacity-50">💣</div>
                       <div className="absolute bottom-4 text-white/50 text-sm font-bold tracking-widest uppercase">点击查看</div>
                   </div>

                   {/* BACK (Revealed, Actual Role) */}
                   <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl shadow-2xl bg-white">
                       <CardDisplay role={currentPlayer.role} team={currentPlayer.team} />
                   </div>
               </div>
          </div>

          {currentRoom.status === GameStatus.READY_TO_START && (
              <div className="absolute top-20 w-full text-center animate-bounce text-[#5abb2d] font-bold text-xl drop-shadow-md z-20">
                  等待上帝开始游戏...
              </div>
          )}
      </div>
  );
}
