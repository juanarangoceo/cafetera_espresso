import React from 'react';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  return (
    <div className="relative mx-auto max-w-[340px] rounded-[2.5rem] shadow-2xl border-4 border-coffee-900/10 bg-coffee-950 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
      <div className="relative rounded-[2.3rem] overflow-hidden bg-black aspect-[9/16]">
        <video 
          className="w-full h-full object-cover"
          src={src}
          autoPlay 
          muted 
          loop 
          playsInline
        />
        {/* Shine Effect on Screen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default VideoPlayer;