import type { GameState } from "./types";
export function ending(s: GameState) {
  return s.flags.signal && s.flags.operator && !s.systems.auxiliary
    ? {
        title: "A cidade amanheceu",
        text: "Às 06:00, a portadora desapareceu. Pela janela, você vê o primeiro ônibus. Há doze cadeiras na sala. Seu nome já não consta no cadastro. No rádio desligado, alguém tenta dizer obrigado.",
      }
    : {
        title: "O posto permanece ocupado",
        text: "O turno terminou. Você sobreviveu. Na saída, encontra um crachá com seu nome e uma data de admissão: amanhã. O telefone toca atrás da porta. Desta vez, outra pessoa atende.",
      };
}
