export const locations = [
  { id: "central", name: "Central", x: 46, y: 54, code: "01" },
  { id: "hospital", name: "Hospital São Bento", x: 26, y: 38, code: "02" },
  { id: "posto", name: "Posto Horizonte", x: 71, y: 70, code: "03" },
  { id: "norte", name: "Bairro Norte", x: 43, y: 23, code: "04" },
  { id: "sul", name: "Bairro Sul", x: 37, y: 81, code: "05" },
  { id: "estrada", name: "Estrada 13", x: 77, y: 38, code: "06" },
  { id: "floresta", name: "Floresta do Cedro", x: 84, y: 16, code: "07" },
  { id: "escola", name: "Escola Nair Lima", x: 23, y: 65, code: "08" },
  { id: "estacao", name: "Estação", x: 59, y: 42, code: "09" },
  { id: "fazenda", name: "Fazenda abandonada", x: 14, y: 18, code: "10" },
];
export const place = (id: string) =>
  locations.find((l) => l.id === id)?.name ?? id;
export const cameras = [
  "Entrada da Central",
  "Corredor B",
  "Estacionamento",
  "Estrada 13",
  "Hospital São Bento",
  "Escola Nair Lima",
  "Estação",
  "Depósito",
];
export const nightTitles = [
  "A cidade dorme",
  "Pontos cegos",
  "Já ouvimos isso antes",
  "O funcionário anterior",
  "Outubro de 1998",
  "Do lado de dentro",
  "O próximo operador",
];
export const documents: Record<string, { title: string; content: string }> = {
  manual: {
    title: "LEIA_PRIMEIRO.txt",
    content:
      "PREFEITURA DE SANTA AURORA\nDIVISÃO DE VIGILÂNCIA MUNICIPAL\n\nOperador,\nAtenda as chamadas antes do prazo de 50 minutos. Despache unidades para riscos concretos. Orientações por telefone economizam recursos, mas nem sempre bastam.\n\nAs câmeras e o rádio precisam de energia. Há duas cargas do gerador por turno. Restaure o enlace se o sinal cair. Recuperar equipes custa energia.\n\nO relógio da central é a única referência autorizada. Não use os horários das gravações.\n\n— Supervisora Helena Vilar",
  },
  employee: {
    title: "FUNCIONÁRIO_1998.txt",
    content:
      "CADASTRO 013 / ELIAS MOURA\nAdmissão: 13/10/1998\nDesligamento: █████████\n\nO funcionário não abandonou o posto. As três equipes confirmaram sua presença às 06:13, apesar de a central já estar vazia.\n\nAnotação a lápis: o arquivo não foi apagado. No terminal, tente archive 13.",
  },
  incident: {
    title: "INCIDENTE_13.pdf",
    content:
      "CÓPIA DIGITAL / RESTRITO\n\nÀs 03:43, todos os rádios transmitiram a voz do operador. Ele estava sentado ao nosso lado, sem falar.\n\nA perícia encontrou treze cadeiras na sala. A planta prevê doze.\n\nA portadora continua ativa. Use signal no terminal para isolá-la.",
  },
  protocol: {
    title: "PROTOCOLO_F13.txt",
    content:
      "PROTOCOLO DE CONTENÇÃO\n\nSe a central ligar para si mesma, não envie mais ninguém. Recolha as unidades.\n\nNão responda à voz que sabe seu nome. Desligue os auxiliares antes de 05:00 na última noite. Isole a portadora com signal.\n\nQuando pedirem sua identificação, registre operator. Não aceite a troca de turno pelo telefone.",
  },
  report: {
    title: "RELATORIO_NOTURNO.txt",
    content:
      "ARQUIVO RECUPERADO\n\nO chamado da Estrada 13 foi registrado em 1998, 2007 e ontem. Mesmas palavras. Mesma duração. A pessoa que atende é sempre diferente.\n\nNão estamos observando uma repetição. Estamos preenchendo a vaga de alguém.",
  },
  operator: {
    title: "OPERADOR_ATUAL.txt",
    content:
      "MATRÍCULA 013\nNome: [VOCÊ]\nAdmissão: amanhã\nÚltimo turno: ontem\n\nA frequência não transporta uma voz. Ela mantém um posto ocupado.\n\nSe ninguém aceitar a próxima chamada, talvez a cidade amanheça sozinha.",
  },
};
