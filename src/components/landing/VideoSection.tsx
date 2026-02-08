import { useState } from "react";
import { Play, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const VideoSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Veja como é{" "}
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                fácil começar
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Assista ao vídeo e descubra como você pode lucrar com nossos robôs
            </p>
          </div>

          {/* Video Thumbnail */}
          <div
            onClick={() => setIsOpen(true)}
            className="relative group cursor-pointer rounded-3xl overflow-hidden border border-white/10 hover:border-teal-500/50 transition-all duration-300"
          >
            {/* Gradient Background as placeholder */}
            <div className="aspect-video bg-gradient-to-br from-[#111820] via-[#0a0f14] to-[#111820] flex items-center justify-center">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDlkOGMiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              
              {/* Play Button */}
              <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Bottom text */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-medium text-lg">Tutorial Completo</p>
                <p className="text-gray-400 text-sm">3 minutos • Passo a passo para iniciantes</p>
              </div>
            </div>
          </div>

          {/* Video Modal */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl p-0 bg-black border-white/10 overflow-hidden">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="aspect-video bg-[#111820] flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                  <p className="text-gray-400">Vídeo em breve</p>
                  <p className="text-gray-500 text-sm">Estamos preparando um conteúdo especial para você</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};
