
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { supabase } from './lib/supabaseClient';
import { Room, Player, GameStatus, Team, Role, CardSet } from './types';
import { BASE_ROLES, DEFAULT_ROUND_LENGTHS, COLORS } from './constants';
import { BombExplosion, MockeryEffect } from './components/VisualEffects';

// --- Icons ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>;
const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 111.772.954l-2.463 4.621 1.991.995a1 1 0 11-.894 1.79l-1.233-.616 1.733 5.426a1 1 0 01-1.429 1.285l-4.59.816-1.554-4.867 1.233.617a1 1 0 01.894-1.79l-1.991-.995-2.463-4.621a1 1 0 111.772-.954l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552a1 1 0 01-1.285.592l-1.636-.596a1 1 0 11.697-1.874l1.248.455.795-2.486a1 1 0 111.9.957zM15 10.274l.818 2.552a1 1 0 001.285.592l1.636-.596a1 1 0 00-.697-1.874l-1.248.455-.795-2.486a1 1 0 00-1.9.957z" clipRule="evenodd" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const MusicOnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const MusicOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const BombIcon = () => <span className="text-2xl">💣</span>;
const StarIcon = () => <span className="text-2xl">★</span>;
const QuestionIcon = () => <span className="text-2xl">?</span>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const ExchangeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;

// --- Components ---

// Memoize FloatingIcons to prevent re-rendering
const FloatingIcons = memo(() => {
    const icons = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        char: ['💣', '★', '?', '🃏'][Math.floor(Math.random() * 4)],
        left: Math.floor(Math.random() * 95), // avoid edge
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 10,
        size: 20 + Math.random() * 40
    })), []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {icons.map((icon) => (
                <div 
                    key={icon.id} 
                    className="floating-icon text-white drop-shadow-md"
                    style={{
                        left: `${icon.left}%`,
                        animationDuration: `${icon.duration}s`,
                        animationDelay: `${icon.delay}s`,
                        fontSize: `${icon.size}px`
                    }}
                >
                    {icon.char}
                </div>
            ))}
        </div>
    );
});

// Background Music Component
const BackgroundMusic = ({ isHome }: { isHome: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [userHasInteracted, setUserHasInteracted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const BG_MUSIC_URL = "https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/bgm/Two%20Rooms%20and%20a%20Boom.mp3"; // Sci-Fi / Suspense Ambient

    useEffect(() => {
        // Attempt auto-play on mount
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Lower volume for background
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                    setUserHasInteracted(true); // Auto-play success counts as interaction
                }).catch(error => {
                    console.log("Auto-play prevented. Waiting for user interaction.");
                });
            }
        }

        // Global click listener to start audio if not playing (Browser Policy)
        // Only run this if we haven't successfully started audio yet.
        const handleInteraction = () => {
            if (audioRef.current && !userHasInteracted) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setUserHasInteracted(true);
                }).catch(() => {});
            }
        };

        if (!userHasInteracted) {
            window.addEventListener('click', handleInteraction);
        }

        return () => window.removeEventListener('click', handleInteraction);
    }, [userHasInteracted]);

    const toggleMusic = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent bubbling so the global listener doesn't immediately re-play it
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
                setUserHasInteracted(true);
            }
        }
    };

    // Style Calculation:
    // Home: Bottom Left (as requested)
    // Other pages: Bottom Right, slightly raised (to clear bottom action bars/nav), small, unobtrusive.
    // Removed borders and background as requested.
    const positionClass = isHome 
        ? "bottom-8 left-8 scale-150" 
        : "bottom-32 right-4 scale-100 opacity-60 hover:opacity-100";

    return (
        <>
            <audio ref={audioRef} src={BG_MUSIC_URL} loop />
            <button 
                onClick={toggleMusic}
                className={`fixed z-[200] transition-all duration-300 drop-shadow-lg active:scale-90 ${positionClass} ${isPlaying ? 'text-[#5abb2d]' : 'text-white/40'}`}
                title={isPlaying ? "Mute Music" : "Play Music"}
            >
                {isPlaying ? <MusicOnIcon /> : <MusicOffIcon />}
            </button>
        </>
    );
};

const Keypad = ({ onInput, onConfirm, onCancel, onDelete, value, label, loading }: any) => {
    return (
        <div className="bg-[#4d4696] border border-white/20 p-6 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 backdrop-blur-sm animate-in zoom-in-95 duration-300">
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

const TimerDisplay = ({ timeLeft }: { timeLeft: number }) => (
    <div className="flex items-center gap-2 font-mono text-xl font-black text-white bg-black/20 px-3 py-1 rounded-lg">
        <ClockIcon /> 
        <span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
    </div>
);

const CardDisplay = ({ role, team, verificationCode, onVerify, conditionMet, isLeader }: { role: Role | null, team: Team, verificationCode?: string, onVerify?: (code: string) => void, conditionMet?: boolean, isLeader?: boolean }) => {
    const [inputCode, setInputCode] = useState('');
    const isRed = team === Team.RED;
    const isBlue = team === Team.BLUE;
    
    // Theme Colors
    const lightBg = isRed ? COLORS.RED_LIGHT : isBlue ? COLORS.BLUE_LIGHT : COLORS.GREY_LIGHT;
    const darkBg = isRed ? COLORS.RED_DARK : isBlue ? COLORS.BLUE_DARK : COLORS.GREY_DARK;
    const teamName = isRed ? '紅隊' : isBlue ? '藍隊' : '灰隊';
    const Icon = isRed ? BombIcon : isBlue ? StarIcon : QuestionIcon;

    if (!role) return null;

    return (
        <div 
            className="w-full h-full rounded-2xl overflow-hidden shadow-2xl flex flex-col border-4 relative bg-white"
            style={{ borderColor: darkBg }}
        >
            {/* Top Section (3/4 height) */}
            <div className="flex flex-row h-[75%]">
                {/* Left Column: Light - Description (2/3 width) */}
                {/* LEADER UI: Pale Yellow Border */}
                <div className={`w-2/3 p-4 flex flex-col relative ${isLeader ? 'border-4 border-yellow-200' : ''}`} style={{ backgroundColor: lightBg, color: darkBg }}>
                     {/* Role Icon */}
                    <div className="text-4xl mb-2 opacity-90">
                         {isRed ? '🧨' : isBlue ? '🛡️' : '🎲'}
                    </div>
                    {/* Description */}
                    <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar z-10">
                        <p className="text-sm font-bold leading-relaxed">{role.description}</p>
                        {role.winCondition && (
                            <div className="mt-2 text-xs opacity-90 border-t border-current pt-1">
                                <b>胜:</b> {role.winCondition}
                            </div>
                        )}
                        {/* Verification Section */}
                        {role.relatedRoleId && onVerify && (
                            <div className="mt-4 pt-2 border-t border-black/10">
                                {conditionMet ? (
                                    <div className="flex flex-col items-center text-green-700 font-bold bg-green-100 p-2 rounded">
                                        <CheckCircleIcon />
                                        <span className="text-xs mt-1">已关联成功</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-xs font-black uppercase opacity-70">我的核对码</div>
                                        <div className="text-lg font-mono font-black bg-white/50 text-center rounded tracking-widest select-all">
                                            {verificationCode}
                                        </div>
                                        <div className="text-xs font-black uppercase opacity-70 mt-1">输入同伴码</div>
                                        <div className="flex gap-1">
                                            <input 
                                                value={inputCode}
                                                onChange={(e) => setInputCode(e.target.value)}
                                                maxLength={6}
                                                className="w-full p-1 text-center font-mono text-sm rounded bg-white border border-black/20"
                                                placeholder="000000"
                                            />
                                            <button 
                                                onClick={() => { onVerify(inputCode); setInputCode(''); }}
                                                className="bg-black/80 text-white px-2 rounded text-xs"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Leader Label */}
                    {isLeader && (
                         <div className="absolute bottom-1 right-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded shadow-sm z-20 font-traditional">
                             領袖
                         </div>
                    )}
                </div>

                {/* Right Column: Dark - Name (1/3 width) */}
                <div className="w-1/3 flex items-center justify-center relative border-l-2 border-black/10" style={{ backgroundColor: darkBg, color: 'white' }}>
                    <div className="writing-vertical-rl text-3xl font-black font-traditional tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full whitespace-nowrap">
                        {role.name}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Footer (1/4 height) - Dark */}
            <div className="h-[25%] flex items-center justify-between px-6 border-t-2 border-black/10" style={{ backgroundColor: darkBg, color: 'white' }}>
                <span className="text-3xl font-black font-traditional">{teamName}</span>
                <div className="scale-150 transform drop-shadow-md">
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
  const [joinLoading, setJoinLoading] = useState(false);
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // God Mode States
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customRoleWin, setCustomRoleWin] = useState('');
  const [customRoleTeam, setCustomRoleTeam] = useState<Team>(Team.GREY);
  const [saveSetName, setSaveSetName] = useState('');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);

  // Animation States
  const [shuffling, setShuffling] = useState(false);

  // --- Realtime ---
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${currentRoom.code}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
            alert('房间已关闭');
            window.location.reload();
            return;
        }
        const newRoom = payload.new as Room;
        setCurrentRoom(newRoom);
        
        if (newRoom.status === GameStatus.DISTRIBUTING) {
            setShuffling(true);
            setTimeout(() => setShuffling(false), 3000);
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
      const { data } = await supabase.from('card_sets').select('*').order('created_at');
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
      if (!testMode) {
          if (playerCount < currentRoom.settings.min_players) {
              alert(`人数不足，至少 ${currentRoom.settings.min_players} 人`);
              return;
          }
          if (playerCount % 2 !== 0) {
              alert("人数必须为双数");
              return;
          }
      } else {
          if (playerCount === 0) {
              alert("没有玩家");
              return;
          }
      }

      // Logic
      const deck = [...currentRoom.custom_roles];
      // Logic: Ensure we have enough cards
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

      // Distribute with Verification Codes
      for (let i = 0; i < playerCount; i++) {
        const role = shuffledDeck[i];
        let vCode = undefined;
        // Generate verification code if role has a relation
        if (role.relatedRoleId) {
            vCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        
        const roomNum = i < half ? 1 : 2;

        await supabase.from('players').update({ 
            role: role, 
            team: role.team, 
            condition_met: false,
            room_number: roomNum,
            is_leader: false, // Reset leader, set later
            verification_code: vCode
        }).eq('id', shuffledPlayers[i].id);
      }
      
      // Assign Initial Leaders
      // Try to find President for Room 1, Bomber for Room 2. If not, random.
      const room1Players = shuffledPlayers.slice(0, half);
      const room2Players = shuffledPlayers.slice(half);

      const r1Leader = room1Players.find((_, idx) => shuffledDeck[idx].id === 'president') || room1Players[0];
      const r2Leader = room2Players.find((_, idx) => shuffledDeck[half + idx].id === 'bomber') || room2Players[0];

      if(r1Leader) await supabase.from('players').update({ is_leader: true }).eq('id', r1Leader.id);
      if(r2Leader) await supabase.from('players').update({ is_leader: true }).eq('id', r2Leader.id);

      await supabase.from('rooms').update({
          status: GameStatus.DISTRIBUTING,
          current_round: 0,
          pending_exchanges: {} // Reset pending exchanges
      }).eq('code', currentRoom.code);

      setTimeout(async () => {
          await supabase.from('rooms').update({ status: GameStatus.READY_TO_START }).eq('code', currentRoom.code);
      }, 3500);
  };

  const handleVerifyRole = async (code: string) => {
      if (!currentPlayer || !currentPlayer.role?.relatedRoleId) return;
      const targetPlayer = players.find(p => p.verification_code === code && p.id !== currentPlayer.id);
      
      if (targetPlayer && targetPlayer.role && targetPlayer.role.id === currentPlayer.role.relatedRoleId) {
          await supabase.from('players').update({ condition_met: true }).eq('id', currentPlayer.id);
          setCurrentPlayer(prev => prev ? ({ ...prev, condition_met: true }) : null);
          alert("核对成功！关联已建立。");
      } else {
          alert("核对码错误或不是目标角色。");
      }
  };

  const startGameTimer = async () => {
      if (!currentRoom) return;
      const endTime = new Date(Date.now() + currentRoom.settings.round_lengths[0] * 1000);
      await supabase.from('rooms').update({
        status: GameStatus.PLAYING,
        current_round: 1,
        round_end_time: endTime.toISOString(),
        pending_exchanges: {}
      }).eq('code', currentRoom.code);
  };

  const pauseRound = async () => {
    // When pausing (round end), reset pending exchanges for the new selection phase
    await supabase.from('rooms').update({ status: GameStatus.PAUSED, round_end_time: null, pending_exchanges: {} }).eq('code', currentRoom?.code);
  };

  const nextRound = async () => {
      if(!currentRoom) return;
      const nextR = currentRoom.current_round + 1;
      if (nextR > 3) return; // Do not proceed past round 3
      
      const length = currentRoom.settings.round_lengths[nextR - 1] || 60;
      const endTime = new Date(Date.now() + length * 1000);
      await supabase.from('rooms').update({
        status: GameStatus.PLAYING,
        current_round: nextR,
        round_end_time: endTime.toISOString(),
        pending_exchanges: {} // Clear selection when next round starts
      }).eq('code', currentRoom.code);
  };

  const movePlayer = async (player: Player, targetRoom: 1 | 2) => {
      if (!currentRoom) return;

      const sourceRoom = player.room_number;
      let updates: any = { room_number: targetRoom };

      // Leader Reassignment Logic
      if (player.is_leader && sourceRoom) {
          updates.is_leader = false;
          // Find another player in source room to be leader
          const candidates = players.filter(p => p.room_number === sourceRoom && p.id !== player.id && !p.is_god);
          if (candidates.length > 0) {
              const nextLeader = candidates[Math.floor(Math.random() * candidates.length)];
              await supabase.from('players').update({ is_leader: true }).eq('id', nextLeader.id);
          }
      }

      await supabase.from('players').update(updates).eq('id', player.id);
  };

  const handleLeaderExchangeSelect = async (targetId: string) => {
      if (!currentPlayer || !currentPlayer.is_leader || !currentRoom) return;
      if (!currentPlayer.room_number) return;

      const currentExchanges = currentRoom.pending_exchanges || {};
      const newExchanges = {
          ...currentExchanges,
          [currentPlayer.room_number === 1 ? 'room1_target_id' : 'room2_target_id']: targetId
      };

      await supabase.from('rooms').update({ pending_exchanges: newExchanges }).eq('code', currentRoom.code);
  };

  const closeGame = async () => {
      if (!currentRoom || !window.confirm("确定要结束游戏并删除数据吗？")) return;
      await supabase.from('rooms').delete().eq('code', currentRoom.code);
      window.location.reload();
  };

  const leaveGame = () => {
      window.location.reload();
  };

  // --- View Rendering ---

  const renderContent = () => {
    // 1. HOME SCREEN
    if (view === 'HOME') {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen p-6 z-10">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
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

    // 2. PLAYER NAME
    if (view === 'PLAYER_NAME') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
                <div className="w-full max-w-sm">
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

    // 3. CODE ENTRY
    if (view === 'CODE_ENTRY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
                <button onClick={() => setView(roleMode === 'GOD' ? 'HOME' : 'PLAYER_NAME')} className="absolute top-8 left-8 text-white/50 font-bold text-sm">← 取消</button>
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

    // 4. SHUFFLING ANIMATION
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

    // 5. PLAYER LOBBY
    if (currentRoom?.status === GameStatus.LOBBY && !currentPlayer?.is_god) {
        return (
            <div className="min-h-screen flex flex-col items-center p-6 relative z-10">
                <div className="w-full max-w-md mt-12 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center shadow-xl">
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
        );
    }

    // 6. GAME FINISHED
    if (currentRoom?.status === GameStatus.FINISHED && currentRoom.winner) {
        return (
            <div className="relative z-50">
                {currentRoom.winner === Team.RED ? <BombExplosion /> : <MockeryEffect />}
                <button onClick={leaveGame} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-white text-[#4d4696] px-8 py-3 rounded-full font-bold shadow-2xl">返回主页</button>
            </div>
        );
    }

    // 7. GOD DASHBOARD
    if (currentPlayer?.is_god) {
        // Helper for Room Columns
        const renderRoomColumn = (roomNum: 1 | 2) => {
            const roomPlayers = players.filter(p => !p.is_god && p.room_number === roomNum);
            
            // Check for pending exchanges selected by Leader
            const selectedForExchangeId = roomNum === 1 ? currentRoom?.pending_exchanges?.room1_target_id : currentRoom?.pending_exchanges?.room2_target_id;

            return (
                <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                    <div className={`p-3 font-bold text-center text-sm uppercase tracking-wide border-b border-white/10 flex justify-between items-center ${roomNum === 1 ? 'bg-[#4c4595] text-white' : 'bg-[#de0029] text-white'}`}>
                        <span>房间 {roomNum}</span>
                        <span className="bg-black/20 px-2 py-0.5 rounded text-xs">{roomPlayers.length}人</span>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                        {roomPlayers.map(p => {
                            const isSelected = selectedForExchangeId === p.id;
                            return (
                                <div key={p.id} className={`relative p-2 rounded-lg border transition group ${isSelected ? 'bg-yellow-500/20 border-yellow-500' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white text-sm truncate flex items-center gap-1">
                                            {p.name}
                                            {p.role?.relatedRoleId && (
                                                <span title={p.condition_met ? "已关联" : "未关联"}>
                                                    <LinkIcon />
                                                    <span className={`w-2 h-2 rounded-full inline-block ml-0.5 ${p.condition_met ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                </span>
                                            )}
                                            {isSelected && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-black">选定</span>}
                                        </span>
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
                                            title="Toggle Leader"
                                        >
                                            <CrownIcon />
                                        </button>
                                        {roomNum === 1 ? (
                                            <button onClick={() => movePlayer(p, 2)} className={`text-[10px] px-2 py-1 rounded font-bold transition ${isSelected ? 'bg-yellow-500 text-black animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}>
                                                {isSelected ? '确认移至 2 →' : '移至 2 →'}
                                            </button>
                                        ) : (
                                            <button onClick={() => movePlayer(p, 1)} className={`text-[10px] px-2 py-1 rounded font-bold transition ${isSelected ? 'bg-yellow-500 text-black animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}>
                                                {isSelected ? '← 确认移至 1' : '← 移至 1'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        return (
            <div className="h-screen bg-[#2d285e] text-white flex flex-col font-sans overflow-hidden z-20 relative">
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
                    {/* Consistent Timer Style */}
                    <TimerDisplay timeLeft={timeLeft} />
                </header>

                {currentRoom?.status === GameStatus.LOBBY ? (
                    <div className="flex-grow p-4 overflow-y-auto pb-24 space-y-6">
                        {/* Live Card Preview */}
                        <div className="w-full max-w-[240px] mx-auto aspect-[3/4] font-traditional">
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
                                isLeader={true}
                            />
                        </div>
                        
                        {/* Role Builder */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <div className="flex gap-2">
                                <input value={customRoleName} onChange={e => setCustomRoleName(e.target.value)} placeholder="角色名称 (繁体)" className="flex-1 bg-black/20 p-2 rounded text-sm outline-none border border-white/10 focus:border-[#5abb2d] font-traditional" />
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
                        
                        {/* Standard Roles Accordion */}
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold opacity-50 mb-2">备选卡牌</h3>
                            {BASE_ROLES.filter(r => !r.isKeyRole && !['blue_team', 'red_team'].includes(r.id)).map(r => (
                                <div key={r.id} className="bg-white/5 rounded border border-white/10 overflow-hidden">
                                    <button 
                                        onClick={() => setExpandedRole(expandedRole === r.id ? null : r.id)}
                                        className="w-full p-2 text-left text-xs font-bold flex justify-between items-center hover:bg-white/5"
                                    >
                                        <span>{r.name} ({r.team === Team.BLUE ? '蓝' : r.team === Team.RED ? '红' : '灰'})</span>
                                        <span>{expandedRole === r.id ? '▲' : '▼'}</span>
                                    </button>
                                    {expandedRole === r.id && (
                                        <div className="p-2 bg-black/20 text-xs text-white/70 border-t border-white/10">
                                            <p className="mb-2">{r.description}</p>
                                            <button 
                                                onClick={() => updateRoles([...currentRoom.custom_roles, r])} 
                                                className="w-full bg-white/10 hover:bg-white/20 py-1 rounded text-white"
                                            >
                                                + 添加
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Save/Load Sets (Bottom) */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                <span className="text-sm font-bold">卡组管理</span>
                            </div>
                            <div className="h-24 overflow-y-auto space-y-1 custom-scrollbar">
                                {cardSets.map(set => (
                                    <div key={set.id} className="flex justify-between items-center bg-black/20 p-2 rounded text-xs">
                                        <span>{set.name} ({set.roles.length}卡)</span>
                                        <button onClick={() => loadCardSet(set.id)} className="text-[#5abb2d] font-bold">加载</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <input value={saveSetName} onChange={e => setSaveSetName(e.target.value)} placeholder="新卡组名称" className="flex-1 bg-black/20 p-2 rounded text-xs outline-none border border-white/10" />
                                <button onClick={saveCardSet} className="bg-[#4c4595] px-3 rounded text-xs font-bold">保存</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // GAME VIEW (God Dashboard)
                    <div className="flex-grow flex flex-col p-2 gap-2 min-h-0">
                        {currentRoom?.status === GameStatus.PAUSED && (
                             <div className="bg-orange-500/20 text-orange-200 text-xs text-center py-1 rounded border border-orange-500/50 animate-pulse">
                                 回合结束。等待领袖选定交换人选，然后手动执行移动。
                             </div>
                        )}
                        <div className="flex-grow flex gap-2 min-h-0">
                            {renderRoomColumn(1)}
                            {renderRoomColumn(2)}
                        </div>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="p-4 bg-[#2d285e] border-t border-white/10 sticky bottom-0 z-30">
                    {currentRoom?.status === GameStatus.LOBBY && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                <span className="text-xs font-bold text-white/70">测试模式 (不限人数)</span>
                                <button 
                                    onClick={() => setTestMode(!testMode)}
                                    className={`w-12 h-6 rounded-full relative transition ${testMode ? 'bg-[#5abb2d]' : 'bg-white/20'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${testMode ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <button onClick={distributeRoles} className="w-full bg-[#5abb2d] text-white py-3 rounded-xl font-bold shadow-lg text-lg">
                                发牌并进入准备 ({players.filter(p=>!p.is_god).length}人)
                            </button>
                        </div>
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
                        currentRoom.current_round < 3 ? (
                            <button onClick={nextRound} className="w-full bg-[#82a0d2] text-[#4c4595] py-3 rounded-xl font-bold">
                                进入第 {currentRoom.current_round + 1} 回合
                            </button>
                        ) : (
                            <div className="w-full bg-black/40 text-white text-center py-3 rounded-xl font-bold border border-white/20">
                                游戏结束 - 等待宣判结果
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    }

    // 8. PLAYER GAME (Card Flip & Leader UI)
    if (currentPlayer?.role) {
        // Exchange Selection Mode for Leader
        if (currentRoom?.status === GameStatus.PAUSED && currentPlayer.is_leader) {
             const myRoomPlayers = players.filter(p => p.room_number === currentPlayer.room_number && p.id !== currentPlayer.id && !p.is_god);
             const myPendingTarget = currentPlayer.room_number === 1 ? currentRoom.pending_exchanges?.room1_target_id : currentRoom.pending_exchanges?.room2_target_id;
             
             return (
                <div className="min-h-screen bg-[#2d285e] p-6 flex flex-col z-20 relative">
                    <h2 className="text-2xl font-black text-white text-center mb-6 font-traditional">选择一名人质交换</h2>
                    <div className="flex-grow space-y-3 overflow-y-auto">
                        {myRoomPlayers.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handleLeaderExchangeSelect(p.id)}
                                className={`w-full p-4 rounded-xl flex justify-between items-center transition ${myPendingTarget === p.id ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <span className="font-bold">{p.name}</span>
                                {myPendingTarget === p.id && <CheckCircleIcon />}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 text-center text-white/50 text-sm">
                        上帝将看到你的选择并执行交换
                    </div>
                </div>
             );
        }

        return (
            <div className="min-h-screen flex flex-col bg-[#4d4696] relative overflow-hidden z-10">
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
                    </div>
                    <TimerDisplay timeLeft={timeLeft} />
                </div>

                <div className="flex-grow flex items-center justify-center p-6 perspective-1000">
                    {/* Card Container - 3:4 Aspect Ratio */}
                    <div 
                        onClick={() => setIsFlipped(!isFlipped)} 
                        className={`relative w-full max-w-[320px] aspect-[3/4] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                    >
                        {/* FRONT (Hidden initially, Back of card visually) */}
                        <div className="absolute inset-0 backface-hidden rounded-2xl border-4 border-white/20 bg-gradient-to-br from-[#4c4595] to-[#2d285e] flex items-center justify-center shadow-2xl">
                             {/* UPDATED: Circle Question Mark */}
                            <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10">
                                <span className="text-6xl font-black text-white/50">?</span>
                            </div>
                            <div className="absolute bottom-4 text-white/50 text-sm font-bold tracking-widest uppercase">点击查看</div>
                        </div>

                        {/* BACK (Revealed, Actual Role) */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl shadow-2xl bg-white" onClick={e => e.stopPropagation()}>
                            <CardDisplay 
                                role={currentPlayer.role} 
                                team={currentPlayer.team} 
                                verificationCode={currentPlayer.verification_code}
                                onVerify={handleVerifyRole}
                                conditionMet={currentPlayer.condition_met}
                                isLeader={currentPlayer.is_leader}
                            />
                            <button onClick={() => setIsFlipped(false)} className="absolute top-2 right-2 text-black/20 hover:text-black text-xl font-bold p-2 z-20">×</button>
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
    
    return null;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
        {/* Persistent Background Layer */}
        <FloatingIcons />
        <BackgroundMusic isHome={view === 'HOME'} />
        
        {/* Main Application Logic */}
        {renderContent()}
    </div>
  );
}
