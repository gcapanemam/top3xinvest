import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Como funciona o trading automatizado?",
    answer:
      "Nossos robôs operam 24 horas por dia nas principais exchanges do mundo, utilizando algoritmos avançados para identificar as melhores oportunidades de compra e venda de criptomoedas. Você não precisa fazer nada além de ativar seu robô - todo o trabalho é feito automaticamente.",
  },
  {
    question: "Qual o valor mínimo para começar a investir?",
    answer:
      "Você pode começar a investir a partir de apenas $1.00. Não há limite máximo de investimento, permitindo que você escale seus ganhos conforme sua confiança e disponibilidade financeira aumentam.",
  },
  {
    question: "Como recebo meus lucros?",
    answer:
      "Os lucros são creditados diretamente no seu saldo da plataforma todos os dias. Você pode acompanhar seus rendimentos em tempo real através do painel de controle e solicitar saques a qualquer momento.",
  },
  {
    question: "Posso sacar meu dinheiro a qualquer momento?",
    answer:
      "Sim! Seus lucros podem ser sacados a qualquer momento. O capital investido fica bloqueado durante o período de lock-in do robô escolhido, garantindo a estabilidade das operações. Após esse período, você pode sacar o valor integral.",
  },
  {
    question: "O que acontece se o robô tiver prejuízo?",
    answer:
      "Nossos robôs utilizam estratégias de gerenciamento de risco avançadas para minimizar perdas. Mesmo em cenários adversos, o sistema prioriza a proteção do seu capital. Historicamente, nossos robôs mantêm uma taxa de acerto superior a 85%.",
  },
  {
    question: "Como faço para começar?",
    answer:
      "É muito simples! Basta criar sua conta gratuita, fazer um depósito mínimo de $1.00, escolher um dos nossos robôs e ativar. Em poucos minutos você já estará gerando lucros automaticamente.",
  },
  {
    question: "Preciso de conhecimento técnico?",
    answer:
      "Absolutamente não! Nossa plataforma foi desenvolvida para ser intuitiva e fácil de usar. Qualquer pessoa, mesmo sem experiência em trading ou criptomoedas, pode começar a lucrar imediatamente.",
  },
  {
    question: "Meus dados e investimentos estão seguros?",
    answer:
      "Sim! Utilizamos criptografia de ponta a ponta, autenticação em duas etapas e nossos servidores são protegidos com as mais avançadas tecnologias de segurança. Seu dinheiro e dados pessoais estão totalmente protegidos.",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
            <HelpCircle className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">Tire suas dúvidas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Encontre respostas para as dúvidas mais comuns sobre nossa plataforma
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-[#111820] border border-white/5 rounded-2xl px-6 overflow-hidden data-[state=open]:border-teal-500/30 transition-colors"
              >
                <AccordionTrigger className="text-white hover:text-teal-400 text-left py-5 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
