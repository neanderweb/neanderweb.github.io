import { CONSTANTS } from './constants.js';

// verifica se o navegador tem preferencia por tema escuro
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// inicializa as threads
const initThreads = [];
for(let i = 0; i < CONSTANTS.MAX_THREADS; i++) {
    initThreads.push({
        active: (i === 0), // apenas a thread 0 inicia ativa
        coreId: Math.floor(i / CONSTANTS.THREADS_PER_CORE), // atribui o core id com base no limite
        pc: 0, ac: 0, b: 0,
        va: new Array(CONSTANTS.VECTOR_REG_SIZE).fill(0),
        ix: 0, bp: 0,
        vb: new Array(CONSTANTS.VECTOR_REG_SIZE).fill(0),
        zeroFlag: true, negativeFlag: false
    });
}

// exporta o estado global da maquina
export const state = {
    memory: new Array(CONSTANTS.MEMORY_SIZE).fill(0),
    modifiedMemory: new Array(CONSTANTS.MEMORY_SIZE).fill(false),
    opcodeMap: new Array(CONSTANTS.MEMORY_SIZE).fill(null),
    pc: 0,
    ac: 0,
    b: 0,
    va: new Array(CONSTANTS.VECTOR_REG_SIZE).fill(0),
    ix: 0,
    bp: 0,
    vb: new Array(CONSTANTS.VECTOR_REG_SIZE).fill(0),
    zeroFlag: true,
    negativeFlag: false,
    
    // concorrencia e escalonamento
    currentThreadId: 0,
    threads: initThreads,

    isStepMode: false,
    displayBase: 10,
    leftInputBase: 10,
    currentLanguage: (navigator.language.toLowerCase().startsWith('pt')) ? 'pt' : 'en',
    currentModule: 'expanded',
    currentTheme: systemPrefersDark ? 'dark' : 'light',
    syntaxColors: null,
    languageStrings: {},
    iCache: { tag: -1, valid: false, data: new Array(CONSTANTS.I_CACHE_SIZE).fill(0), hits: 0, misses: 0 },
    dCache: { tag: -1, valid: false, data: new Array(CONSTANTS.D_CACHE_SIZE).fill(0), hits: 0, misses: 0 }
};