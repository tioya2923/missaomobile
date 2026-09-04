// Configuração central de todo o conteúdo gerível pelo painel de administração —
// espelha exatamente src/components/Admin/resourcesConfig.js do site, para que
// o mesmo conteúdo seja editável nativamente na app.
//
// Cânticos e Catecismo/Orações são gerados a partir da lista de idiomas
// (API /api/idiomas) — ver gerarRecursosIdioma() mais abaixo — em vez de um
// bloco fixo por idioma. Criar um idioma novo em Administração → Idiomas faz
// aparecer "Cânticos (Nome)"/"Catecismo (Nome)" automaticamente.

import { MOEDAS_LISTA, labelMoeda } from './moeda';

export type TipoCampo = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select';

export interface OpcaoEstatica { valor: string; label: string }
export interface OpcoesEndpoint { endpoint: string; valor: string; label: string }

export interface CampoRecurso {
  nome: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio?: boolean;
  valorInicial?: string | number | boolean;
  linhas?: number;
  excluirProprio?: boolean;
  opcoes?: OpcoesEndpoint;
  opcoesEstaticas?: OpcaoEstatica[];
}

export interface ColunaRecurso {
  campo: string;
  label: string;
  ref?: string;
  formatar?: (valor: unknown) => string;
}

export interface RecursoConfig {
  key: string;
  titulo: string;
  grupo: string;
  api: { base: string; list: string };
  tituloCampo: string;
  campos: CampoRecurso[];
  colunas: ColunaRecurso[];
}

export interface IdiomaInfo { id: number; codigo: string; nome: string }

export const RECURSOS: RecursoConfig[] = [
  // ── Apoio ──────────────────────────────────────────────────────────────
  {
    key: 'apoio',
    titulo: 'Formas de Apoio',
    grupo: 'Apoio',
    api: { base: '/api/formasapoio', list: '/api/formasapoio/admin' },
    tituloCampo: 'label',
    campos: [
      {
        nome: 'moeda', label: 'Moeda que recebe', tipo: 'select', obrigatorio: true,
        valorInicial: 'AOA',
        opcoesEstaticas: MOEDAS_LISTA.map((m) => ({ valor: m.codigo, label: m.label })),
      },
      { nome: 'label', label: 'Nome (ex.: IBAN, Multicaixa Express, PIX...)', tipo: 'text', obrigatorio: true },
      { nome: 'valor', label: 'Valor (referência, IBAN, etc.)', tipo: 'text', obrigatorio: true },
      { nome: 'descricao', label: 'Descrição', tipo: 'text' },
      { nome: 'ordem', label: 'Ordem de exibição', tipo: 'number', valorInicial: 0 },
      { nome: 'ativo', label: 'Visível na aplicação', tipo: 'boolean', valorInicial: true },
    ],
    colunas: [
      { campo: 'moeda', label: 'Moeda', formatar: (v) => labelMoeda(String(v)) },
      { campo: 'label', label: 'Nome' },
      { campo: 'valor', label: 'Valor' },
    ],
  },

  // ── Calendário ─────────────────────────────────────────────────────────
  {
    key: 'eventos',
    titulo: 'Eventos do Calendário',
    grupo: 'Calendário',
    api: { base: '/api/calendario', list: '/api/calendario' },
    tituloCampo: 'titulo',
    campos: [
      { nome: 'data', label: 'Data', tipo: 'date', obrigatorio: true },
      { nome: 'titulo', label: 'Título', tipo: 'text', obrigatorio: true },
      { nome: 'descricao', label: 'Descrição (cor litúrgica, ofício, missa)', tipo: 'textarea' },
      { nome: 'leituras', label: 'Leituras', tipo: 'textarea' },
      { nome: 'observacoes', label: 'Observações', tipo: 'textarea' },
    ],
    colunas: [
      { campo: 'titulo', label: 'Título' },
      { campo: 'data', label: 'Data', formatar: (v) => (v ? new Date(String(v)).toLocaleDateString('pt-PT') : '—') },
    ],
  },

  // ── Idiomas ────────────────────────────────────────────────────────────
  {
    key: 'idiomas',
    titulo: 'Idiomas',
    grupo: 'Idiomas',
    api: { base: '/api/idiomas', list: '/api/idiomas' },
    tituloCampo: 'nome',
    campos: [
      { nome: 'nome', label: 'Nome (ex: Suaíli)', tipo: 'text', obrigatorio: true },
      { nome: 'codigo', label: 'Código curto (ex: swa)', tipo: 'text', obrigatorio: true },
      { nome: 'ordem', label: 'Ordem de exibição', tipo: 'number', valorInicial: 0 },
      { nome: 'ativo', label: 'Ativo (aparece na app)', tipo: 'boolean', valorInicial: true },
    ],
    colunas: [
      { campo: 'nome', label: 'Nome' },
      { campo: 'codigo', label: 'Código' },
      { campo: 'ativo', label: 'Ativo', formatar: (v) => (v ? 'Sim' : 'Não') },
    ],
  },
];

// Ecrãs que não seguem o CRUD genérico (fluxo próprio), mas que ainda assim
// devem aparecer no menu da Administração.
export interface ExtraConfig { key: string; titulo: string; grupo: string }
export const EXTRAS: ExtraConfig[] = [
  { key: 'lojas', titulo: 'Lojas parceiras', grupo: 'Marketplace' },
  { key: 'encomendas', titulo: 'Todas as encomendas', grupo: 'Marketplace' },
  { key: 'vendas', titulo: 'Vendas das lojas', grupo: 'Marketplace' },
];

// ── Cânticos e Catecismo/Orações — gerados por idioma ───────────────────────

export function chaveCanticosTopicos(codigo: string): string { return `canticos-topicos-${codigo}`; }
export function chaveCanticos(codigo: string): string { return `canticos-${codigo}`; }
export function chaveCatecismoTopicos(codigo: string): string { return `catecismo-topicos-${codigo}`; }
export function chaveCatecismo(codigo: string): string { return `catecismo-${codigo}`; }

export function gerarRecursosIdioma(idioma: IdiomaInfo): RecursoConfig[] {
  const { codigo, nome } = idioma;
  const q = `?idioma=${codigo}`;

  const topicosCanticos: RecursoConfig = {
    key: chaveCanticosTopicos(codigo),
    titulo: 'Tópicos',
    grupo: `Cânticos (${nome})`,
    api: { base: `/api/topicos${q}`, list: `/api/topicos${q}` },
    tituloCampo: 'nome',
    campos: [{ nome: 'nome', label: 'Nome', tipo: 'text', obrigatorio: true }],
    colunas: [{ campo: 'nome', label: 'Nome' }, { campo: 'slug', label: 'Slug' }],
  };

  const canticos: RecursoConfig = {
    key: chaveCanticos(codigo),
    titulo: 'Cânticos',
    grupo: `Cânticos (${nome})`,
    api: { base: `/api/canticos${q}`, list: `/api/canticos${q}` },
    tituloCampo: 'titulo',
    campos: [
      { nome: 'titulo', label: 'Título', tipo: 'text', obrigatorio: true },
      { nome: 'topicoId', label: 'Tópico', tipo: 'select', obrigatorio: true, opcoes: { endpoint: `/api/topicos${q}`, valor: 'id', label: 'nome' } },
      { nome: 'letra', label: 'Letra', tipo: 'textarea', obrigatorio: true, linhas: 10 },
      { nome: 'autor', label: 'Autor (opcional)', tipo: 'text' },
    ],
    colunas: [{ campo: 'titulo', label: 'Título' }, { campo: 'topicoId', label: 'Tópico', ref: 'topicoId' }],
  };

  const topicosCatecismo: RecursoConfig = {
    key: chaveCatecismoTopicos(codigo),
    titulo: 'Tópicos e Subtópicos',
    grupo: `Catecismo (${nome})`,
    api: { base: `/api/catecismopttopicos/topicos${q}`, list: `/api/catecismopttopicos/topicos/todos${q}` },
    tituloCampo: 'titulo',
    campos: [
      { nome: 'titulo', label: 'Título', tipo: 'text', obrigatorio: true },
      {
        nome: 'parentId', label: 'Tópico principal (deixe vazio para ser um tópico de topo)',
        tipo: 'select', excluirProprio: true,
        opcoes: { endpoint: `/api/catecismopttopicos/topicos/todos${q}`, valor: 'id', label: 'titulo' },
      },
    ],
    colunas: [{ campo: 'titulo', label: 'Título' }, { campo: 'parentId', label: 'Subtópico de', ref: 'parentId' }],
  };

  const catecismo: RecursoConfig = {
    key: chaveCatecismo(codigo),
    titulo: 'Catecismo / Orações',
    grupo: `Catecismo (${nome})`,
    api: { base: `/api/catecismopt${q}`, list: `/api/catecismopt${q}` },
    tituloCampo: 'titulo',
    campos: [
      { nome: 'titulo', label: 'Pergunta / Título', tipo: 'text', obrigatorio: true },
      { nome: 'catecismoPtTopicoId', label: 'Tópico', tipo: 'select', opcoes: { endpoint: `/api/catecismopttopicos/topicos/todos${q}`, valor: 'id', label: 'titulo' } },
      { nome: 'texto', label: 'Resposta / Texto', tipo: 'textarea', obrigatorio: true, linhas: 10 },
    ],
    colunas: [{ campo: 'titulo', label: 'Título' }, { campo: 'catecismoPtTopicoId', label: 'Tópico', ref: 'catecismoPtTopicoId' }],
  };

  return [topicosCanticos, canticos, topicosCatecismo, catecismo];
}

// Decodifica o idioma a partir de uma chave gerada (ex: "canticos-swa" → "swa").
export function decodificarIdiomaDaChave(key: string): string | null {
  for (const prefixo of ['canticos-topicos-', 'canticos-', 'catecismo-topicos-', 'catecismo-']) {
    if (key.startsWith(prefixo)) return key.slice(prefixo.length);
  }
  return null;
}

export function getRecurso(key: string): RecursoConfig | null {
  return RECURSOS.find((r) => r.key === key) ?? null;
}

// Versão que também resolve recursos dinâmicos (cânticos/catecismo por idioma),
// dada a lista de idiomas já carregada (de /api/idiomas).
export function getRecursoComIdiomas(key: string, idiomas: IdiomaInfo[] | null): RecursoConfig | null {
  const estatico = getRecurso(key);
  if (estatico) return estatico;

  const codigo = decodificarIdiomaDaChave(key);
  if (!codigo) return null;
  const idioma = (idiomas || []).find((i) => i.codigo === codigo);
  if (!idioma) return null;

  return gerarRecursosIdioma(idioma).find((r) => r.key === key) ?? null;
}

export interface GrupoMenu { nome: string; itens: { key: string; titulo: string; ehExtra: boolean }[] }
export function getGrupos(idiomas: IdiomaInfo[] = []): GrupoMenu[] {
  const grupos: GrupoMenu[] = [];
  const push = (grupo: string, key: string, titulo: string, ehExtra: boolean) => {
    let g = grupos.find((g) => g.nome === grupo);
    if (!g) { g = { nome: grupo, itens: [] }; grupos.push(g); }
    g.itens.push({ key, titulo, ehExtra });
  };
  for (const r of RECURSOS) push(r.grupo, r.key, r.titulo, false);
  for (const e of EXTRAS) push(e.grupo, e.key, e.titulo, true);
  for (const idioma of idiomas) {
    for (const r of gerarRecursosIdioma(idioma)) push(r.grupo, r.key, r.titulo, false);
  }
  return grupos;
}
