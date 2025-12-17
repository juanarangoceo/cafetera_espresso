import React, { useState } from 'react';
import { Play } from 'lucide-react';

const VideoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // ID del video de YouTube (Usando uno genérico de arte latte/espresso cinematográfico)
  const videoId = "Mv2qY7T1C8c"; 

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl group border-4 border-white/50 bg-black">
      {!isPlaying ? (
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={() => setIsPlaying(true)}
        >
          {/* Cover Image Placeholder */}
          <img 
            src="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800&auto=format&fit=crop"
            alt="Coffee Ritual" 
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out bg-gray-900"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-gold-500 rounded-full animate-ping opacity-75"></div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <div className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center shadow-lg pl-1">
                        <Play fill="white" className="text-white" size={24} />
                    </div>
                </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 text-white z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-1">Experiencia Visual</p>
            <h3 className="text-2xl font-serif font-bold">Descubre el arte del espresso</h3>
          </div>
        </div>
      ) : (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Coffee Maker Pro Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0"
        ></iframe>
      )}
    </div>
  );
};

export default VideoPlayer;