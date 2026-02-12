import { Link } from "react-router-dom";
import { TrendingUp, Twitter, Send } from "lucide-react";

export const LandingFooter = () => {
  return (
    <footer className="py-16 bg-[#070a0d] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">N3XPRIME</span>
            </Link>
            <p className="text-gray-500 max-w-md">
              Plataforma líder em investimentos automatizados com robôs de trading de alta performance 
              para o mercado de criptomoedas.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-500 hover:text-white transition-colors text-sm">Home</a>
              </li>
              <li>
                <a href="#robos" className="text-gray-500 hover:text-white transition-colors text-sm">Robôs</a>
              </li>
              <li>
                <a href="#parceiros" className="text-gray-500 hover:text-white transition-colors text-sm">Parceiros</a>
              </li>
              <li>
                <a href="#sobre" className="text-gray-500 hover:text-white transition-colors text-sm">Sobre Nós</a>
              </li>
            </ul>
          </div>

          {/* Support & Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 mb-6">
              <li>
                <a href="#faq" className="text-gray-500 hover:text-white transition-colors text-sm">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Contato</a>
              </li>
            </ul>

            <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5 text-gray-400" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} N3XPRIME. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
