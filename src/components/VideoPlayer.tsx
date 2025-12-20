import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!hasMounted) return null;

  const optimizedSrc = src.replace('/upload/', '/upload/q_auto,f_auto,w_auto/');

  return (
    <div className="relative mx-auto max-w-[340px] rounded-[2.5rem] shadow-2xl border-4 border-coffee-900/10 bg-coffee-950 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500 group">
      <div className="relative rounded-[2.3rem] overflow-hidden bg-black aspect-[9/16]">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          src={optimizedSrc}
          poster="/images/hero-mobile.webp"
          autoPlay 
          muted={isMuted}
          loop 
          playsInline
        />
        {/* Shine Effect on Screen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

        {/* Audio Toggle Button */}
        <button 
          onClick={toggleAudio}
          className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md p-3 rounded-full text-white border border-white/20 hover:bg-gold-500 hover:border-gold-500 transition-all z-20"
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;