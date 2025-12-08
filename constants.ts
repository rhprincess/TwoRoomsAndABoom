
import { Role, Team } from './types';

export const COLORS = {
  // BG 4d4696
  BG: '#F5F5F5',
  SUCCESS_BG: '#6AB647',
  SUCCESS_TEXT: '#224B2A',
  
  // Blue Team
  BLUE_LIGHT: '#6795C2',
  BLUE_DARK: '#364D8F',
  
  // Red Team
  RED_LIGHT: '#D7262F',
  RED_DARK: '#42191A', // Deeper red for text/bg contrast
  
  // Grey Team
  GREY_LIGHT: '#8B8C88',
  GREY_DARK: '#5C5E5B',

  // Purple Team
  PURPLE_LIGHT: '#6D5594',
  PURPLE_DARK: '#392C70'
};

export const DEFAULT_ROUND_LENGTHS = [300, 180, 60]; // 5m, 3m, 1m in seconds

export const BASE_ROLES: Role[] = [
  {
    id: 'president',
    name: '總統',
    description: '蓝队领袖。你必须避开炸弹人。如果游戏结束时你和炸弹客在同一个房间，你死亡，蓝队失败。',
    team: Team.BLUE,
    isKeyRole: true,
    winCondition: '躲避炸彈客',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/president.svg'
  },
  {
    id: 'bomber',
    name: '炸彈客',
    description: '红队领袖。你必须找到总统。如果游戏结束时你和总统在同一个房间，你引爆炸弹，红队胜利。',
    team: Team.RED,
    isKeyRole: true,
    winCondition: '跟著總統',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/bomber.svg'
  },
  {
    id: 'team_blue_member',
    name: '藍隊隊員',
    description: '保护总统。让炸弹人远离总统。如果总统存活，你获胜。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '想盡辦法讓總統遠離炸彈客',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/blue_member.svg'
  },
  {
    id: 'team_red_member',
    name: '紅隊隊員',
    description: '帮助炸弹人找到总统。如果炸弹人炸死总统，你获胜。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '想盡辦法讓炸彈客在總統身邊',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/red_member.svg'
  },
  {
    id: 'doctor',
    name: '醫生',
    description: '蓝队。你是总统的亲信。你需要找到总统来建立信任，游戏结束未建立信任将导致你们队伍失败。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '必須找到總統',
    capabilities: { canFind: ['president', 'daughter_of_president'] },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/doctor.svg'
  },
  {
    id: 'engineer',
    name: '工程師',
    description: '红队工程师。你是炸弹客的工程专家。你需要找到炸弹客来建立信任，游戏结束未建立信任将导致你们队伍失败。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '必須找到炸彈客',
    capabilities: { canFind: ['bomber', 'bomb_descendent'] },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/engineer.svg'
  },
  {
    id: 'red_spy',
    name: '紅隊間諜',
    description: '红队。你实际上是红队的人，但在卡牌上伪装成蓝队。试图渗透蓝队。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '滲透進藍隊！',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/red_spy.svg'
  },
    {
    id: 'blue_spy',
    name: '藍隊間諜',
    description: '蓝队。你实际上是蓝队的人，但在卡牌上伪装成红队。试图渗透红队。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '滲透進紅隊！',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/blue_spy.svg'
  },
  {
    id: 'shy_guy_a',
    name: '害羞小子',
    description: '找到另一位害羞小子。你们必须互相输入核对码确认身份才能获胜。',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_b',
    relatedRoleName: '害羞小子',
    winCondition: '兩個人一起害羞',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/shy_boy.svg'
  },
  {
    id: 'shy_guy_b',
    name: '害羞小子',
    description: '找到另一位害羞小子。你们必须互相输入核对码确认身份才能获胜。',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_a',
    relatedRoleName: '害羞小子',
    winCondition: '兩個人一起害羞',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/shy_boy.svg'
  },
  {
    id: 'negotiator_red',
    name: '談判專家',
    description: '红队。你需要分享你的卡牌，尽可能为队伍获取到更多信息。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '你只能分享卡牌',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/negotiator_red.svg'
  },
    {
    id: 'negotiator_blue',
    name: '談判專家',
    description: '蓝队。你需要分享你的卡牌，尽可能为队伍获取到更多信息。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '你只能分享卡牌',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/negotiator_blue.svg'
  },
  {
    id: 'shyshy_red',
    name: '靦腆少年',
    description: '红队。你只能分享你的卡牌颜色，迷惑对方。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '過於靦腆只能分享顏色',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/shyshyboy_red.svg'
  },
  {
    id: 'shyshy_blue',
    name: '靦腆少年',
    description: '蓝队。你只能分享你的卡牌颜色，迷惑对方。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '過於靦腆只能分享顏色',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/shyshyboy_blue.svg'
  },
  {
    id: 'bomb_descendent',
    name: '殉道者',
    description: '红队。你是炸弹客的继承者，如果你队伍没有炸弹客，你需要继承TA的身份。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '如果沒有炸彈客…你就是炸彈客',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/bomb_decendent.svg'
  },
  {
    id: 'daughter_of_president',
    name: '總統女兒',
    description: '蓝队。你是炸弹客总统的女儿，如果你的队伍没有总统，你需要继承TA的身份。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '如果沒有總統…你就是繼任',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/daughter_of_president.svg'
  },
  {
    id: 'tinker',
    name: '修補匠',
    description: '红队。你是工程师的替补，如果你的队伍没有工程师，你需要继承TA的身份。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '如果沒有工程師…你就是工程師',
    capabilities: { canFind: ['bomber', 'bomb_descendent'] },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/tinker.svg'
  },
  {
    id: 'nurse',
    name: '護士',
    description: '蓝队。你是医生的好搭手，如果你的队伍没有医生，你需要继承TA的身份救死扶伤。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '如果沒有醫生…你就是醫生',
    capabilities: { canFind: ['president', 'daughter_of_president'] },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/nurse.svg'
  },
  {
    id: 'pengpeng_doctor',
    name: '砰砰博士',
    description: '红队。当你与蓝队的总统互相分享卡牌时，炸弹客的炸弹立即爆炸，游戏结束。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '與總統分享吧',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/pengpeng_doctor.svg'
  },
  {
    id: 'knight_of_tuesday',
    name: '星期二騎士',
    description: '蓝队。当你与红队的炸弹客互相分享卡牌时，你成功刺杀炸弹客保护了总统，游戏结束。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '與炸彈客分享吧',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/knight_of_tuesday.svg'
  },
  {
    id: 'angel_red',
    name: '天使',
    description: '红队。你只能说真话。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '說真話',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/angel_red.svg'
  },
  {
    id: 'angel_blue',
    name: '天使',
    description: '蓝队。你只能说真话。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '說真話',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/angel_blue.svg'
  },
  {
    id: 'monster_red',
    name: '惡魔',
    description: '红队。你只能说假话',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '撒謊',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/monster_red.svg'
  },
  {
    id: 'monster_blue',
    name: '惡魔',
    description: '蓝队。你只能说假话',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '撒謊',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/monster_blue.svg'
  },
  {
    id: 'mute_clown_red',
    name: '啞劇小醜',
    description: '红队。你在游戏中永远不能说话。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '永遠不要說話',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mute_clown_red.svg'
  },
  {
    id: 'mute_clown_blue',
    name: '啞劇小醜',
    description: '蓝队。你在游戏中永远不能说话。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '永遠不要說話',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mute_clown_blue.svg'
  },
  {
    id: 'mummy_red',
    name: '木乃伊',
    description: '红队。一旦你的卡牌被分享，则你被传染禁言，永远不能说话。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '避免分享傳染！',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mummy_red.svg'
  },
  {
    id: 'mummy_blue',
    name: '木乃伊',
    description: '蓝队。一旦你的卡牌被分享，则你被传染禁言，永远不能说话。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '避免分享傳染！',
    capabilities: { canShare: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mummy_blue.svg'
  },
  {
    id: 'cupid',
    name: '愛神丘比特',
    description: '红队。可以指定当前游戏内任意两个人相爱，被指定相爱的人，游戏结束前必须在同一个房间',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '整局隻能用一次，指定兩名玩家相愛',
    capabilities: { designateCapability: 'LOVE' },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/cupid.svg'
  },
  {
    id: 'eris',
    name: '紛爭女神厄裡斯',
    description: '蓝队。可以指定当前游戏内任意两个人相恨，被指定相恨的人，游戏结束前必须不在同一个房间',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '整局隻能用一次，指定兩名玩家相恨',
    capabilities: { designateCapability: 'HATE' },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/eris.svg'
  },
  {
    id: 'ahah',
    name: '亞哈',
    description: '灰队。你和莫比为憎恨关系，你们不能在一个房间，同时你要与总统在一起，避免被炸弹客炸死。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '遠離莫比，靠近總統',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/ahah.svg'
  },
  {
    id: 'mobby',
    name: '莫比',
    description: '灰队。你和亚哈为憎恨关系，你们不能在一个房间，同时你要与总统在一起，避免被炸弹客炸死。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '遠離亞哈，靠近總統',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mobby.svg'
  },
  {
    id: 'housekeeper',
    name: '管家',
    description: '灰队。你需要与总统和女仆待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '與女僕和總統待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/housekeeper.svg'
  },
  {
    id: 'maid',
    name: '女僕',
    description: '灰队。你需要与总统和管家待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '與管家和總統待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/miad.svg'
  },
  {
    id: 'romeo',
    name: '羅密歐',
    description: '灰队。你需要与炸弹客和朱丽叶待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '與炸彈客和朱麗葉待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/romeo.svg'
  },
  {
    id: 'juliet',
    name: '朱麗葉',
    description: '灰队。你需要与炸弹客和罗密欧待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '與炸彈客和羅密歐待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/juliet.svg'
  },
  {
    id: 'wife',
    name: '妻子',
    description: '灰队。你需要与总统待在一起并远离情妇。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '和總統待在一起遠離情婦',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/wife.svg'
  },
  {
    id: 'mistress',
    name: '情婦',
    description: '灰队。你需要与总统待在一起并躲避妻子。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '和總統待在一起躲避妻子',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/mistress.svg'
  },
  {
    id: 'trainee',
    name: '實習生',
    description: '灰队。你是中性角色，需要与总统待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '和總統待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/intern.svg'
  },
  {
    id: 'victim',
    name: '受害者',
    description: '灰队。你是中性角色，需要与炸弹客待在一起。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '和炸彈客待在一起',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/victim.svg'
  },
  {
    id: 'competitor',
    name: '競爭者',
    description: '灰队。你是中性角色，你需要远离总统。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '遠離總統',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/rival.svg'
  },
  {
    id: 'survivor',
    name: '倖存者',
    description: '灰队。你是中性角色，你需要远离炸弹客。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '遠離炸彈客',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/survivor.svg'
  },
  {
    id: 'private_detective',
    name: '私家偵探',
    description: '灰队。你需要在游戏结束后猜出被埋葬的是哪一个身份，猜出获胜。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '誰是被埋葬的呢',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/private_dectective.svg'
  },
  {
    id: 'gambler',
    name: '賭徒',
    description: '在游戏结束时，你需要大声宣布你认为获胜的队伍。如果猜对，你获胜。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '猜對獲勝隊伍',
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/dice.svg'
  },
  {
    id: 'drunkard',
    name: '酒鬼',
    description: '紫队。你喝的太醉了，你是游戏的搅局者，你可以变换你的颜色来迷惑其他玩家。',
    team: Team.PURPLE,
    isKeyRole: false,
    winCondition: '攪局者出動',
    capabilities: { canChangeColor: true },
    bgImage: 'https://rkbutmsmzzxivziaqklg.supabase.co/storage/v1/object/public/cardimg/drunkard.svg'
  }
];
