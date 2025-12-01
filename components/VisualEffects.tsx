
import React from 'react';

export const BombExplosion: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 bg-red-900/50 animate-pulse"></div>
      <div className="relative w-full h-full flex flex-col items-center justify-center animate-shake">
        <div className="text-[150px] leading-none z-10 filter drop-shadow-[0_0_20px_rgba(255,100,0,0.8)]">💣</div>
        <div className="text-7xl font-black text-red-500 z-10 mt-8 uppercase tracking-widest scale-150 animate-bounce">BOOM!</div>
        <div className="text-3xl font-bold text-white z-10 mt-12 bg-black/50 px-8 py-3 rounded-full backdrop-blur-sm border border-red-500/50 shadow-xl">
          蓝队任务失败
        </div>
      </div>
    </div>
  );
};

export const MockeryEffect: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-blue-500/95 backdrop-blur-md">
        <div className="text-[120px] leading-none animate-bounce drop-shadow-2xl">🤡</div>
        <h1 className="text-5xl font-black text-white mt-8 tracking-tighter drop-shadow-lg">红队失败!</h1>
        <p className="text-blue-100 mt-4 text-xl font-medium bg-blue-600 px-8 py-3 rounded-full border border-blue-400 shadow-lg">
          总统安然无恙
        </p>
        <div className="mt-12 flex gap-6 text-7xl opacity-90">
           <span className="animate-[spin_3s_linear_infinite]">🤪</span>
           <span className="animate-pulse">🤣</span>
           <span className="animate-[bounce_1s_infinite]" style={{animationDelay: '0.1s'}}>🤭</span>
        </div>
    </div>
  );
};
