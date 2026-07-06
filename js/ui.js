import { CONSTANTS } from './constants.js';

export const ui = {
    inputLeft: document.getElementById('input-left'),
    outputLeft: document.getElementById('output-left'),
    highlightingArea: document.getElementById('highlighting-area'),
    highlightingCode: document.querySelector('#highlighting-area code'),
    memoryGrid: document.getElementById('memory-grid-container'),
    editorWrapper: document.getElementById('editor-wrapper'),
    gridWrapper: document.getElementById('grid-wrapper'),
    resizer: document.getElementById('drag-resizer'),
    acValue: document.getElementById('ac-value'),
    bValue: document.getElementById('b-value'),
    pcValue: document.getElementById('pc-value'),
    vaValue: document.getElementById('va-value'),
    ixValue: document.getElementById('ix-value'),
    bpValue: document.getElementById('bp-value'),
    vbValue: document.getElementById('vb-value'),
    tidValue: document.getElementById('tid-value'),
    baseDisplay: document.getElementById('base-display'),
    nFlagBox: document.getElementById('n-flag-box'),
    zFlagBox: document.getElementById('z-flag-box'),
    logContainer: document.getElementById('log-container'),
    stepControls: document.getElementById('step-controls'),
    aboutModal: document.getElementById('about-modal'),
    helpModal: document.getElementById('help-modal'),
    modulesModal: document.getElementById('modules-modal'),
    coresModal: document.getElementById('cores-modal'),
    overlay: document.getElementById('overlay'),
    languageSwitch: document.getElementById('language-switch'),
    themeSwitch: document.getElementById('theme-switch'),
    btnRunProg: document.getElementById('btnRunProg'),
    btnStep: document.getElementById('btnStep'),
    btnClear: document.getElementById('btnClear'),
    btnNext: document.getElementById('btnNext'),
    btnStopStep: document.getElementById('btnStopStep'),
    btnHex: document.getElementById('btnHex'),
    btnDec: document.getElementById('btnDec'),
    btnCloseAbout: document.getElementById('close-about'),
    btnCloseHelp: document.getElementById('close-help'),
    btnCloseModules: document.getElementById('close-modules'),
    btnCloseCores: document.getElementById('close-cores'),
    btnAbout: document.getElementById('about-btn'),
    btnHelp: document.getElementById('help-btn'),
    btnModules: document.getElementById('modules-btn'),
    btnCores: document.getElementById('btnCores'),
    btnLoad: document.getElementById('btnLoad'),
    btnSave: document.getElementById('btnSave'),
    fileMenuLabel: document.querySelector('#file .menu-label'),
    viewMenuLabel: document.querySelector('#view .menu-label'),
    runMenuLabel: document.querySelector('#run .menu-label'),
    icacheHits: document.getElementById('icache-hits'),
    icacheMisses: document.getElementById('icache-misses'),
    icacheTag: document.getElementById('icache-tag'),
    icacheData: document.getElementById('icache-data'),
    dcacheHits: document.getElementById('dcache-hits'),
    dcacheMisses: document.getElementById('dcache-misses'),
    dcacheTag: document.getElementById('dcache-tag'),
    dcacheData: document.getElementById('dcache-data'),
    helpTitle: document.getElementById('help-title'),
    helpContent: document.getElementById('help-content'),
    modulesTitle: document.getElementById('modules-title'),
    modulesDesc: document.getElementById('modules-desc'),
    coresTitle: document.getElementById('cores-title'),
    coresContent: document.getElementById('cores-content'),
    moduleClassicLabel: document.getElementById('module-classic-label'),
    moduleVLabel: document.getElementById('module-v-label'),
    moduleExpandedLabel: document.getElementById('module-expanded-label'),
    moduleRadioButtons: document.querySelectorAll('input[name="module-select"]'),
    vaBox: document.getElementById('va-box'),
    bBox: document.getElementById('b-box'),
    ixBox: document.getElementById('ix-box'),
    bpBox: document.getElementById('bp-box'),
    vbBox: document.getElementById('vb-box'),
    cacheContainer: document.querySelector('.cache-container')
};

// formata o numero na base escolhida (decimal ou hexadecimal)
export function formatNumber(num, displayBase) {
    return displayBase === 10 ? String(num) : num.toString(16).toUpperCase();
}

// insere nova mensagem no container de log
export function log(message, logContainer) {
    logContainer.innerHTML += message + '<br>';
    logContainer.scrollTop = logContainer.scrollHeight;
}

// limpa o painel de logs
export function clearLog(logContainer) {
    logContainer.innerHTML = '';
}

// atualiza visualmente o valor do acumulador ac e flags
export function updateAcUI(ac, zeroFlag, negativeFlag, displayBase, acValue, nFlagBox, zFlagBox, overrideFlags = false) {
    ac &= 0xFF;
    if (!overrideFlags) {
        zeroFlag = (ac === 0);
        negativeFlag = ((ac & 0x80) !== 0);
    }

    acValue.textContent = formatNumber(ac, displayBase);
    
    nFlagBox.classList.toggle('active', negativeFlag);
    zFlagBox.classList.toggle('active', zeroFlag);
    
    return { ac, zeroFlag, negativeFlag };
}

// atualiza visualmente o valor do registrador b
export function updateBUI(b, displayBase, bValue) {
    b &= 0xFF;
    bValue.textContent = formatNumber(b, displayBase);
    return b;
}

// atualiza visualmente o valor do registrador de pc
export function updatePcUI(pc, displayBase, pcValue) {
    pcValue.textContent = formatNumber(pc, displayBase);
}

// atualiza visualmente o vetor a (va)
export function updateVaUI(va, displayBase, vaValue) {
    const formattedVa = va.map(v => formatNumber(v, displayBase));
    vaValue.textContent = `[${formattedVa.join(', ')}]`;
}

// atualiza visualmente o registrador de indice ix
export function updateIxUI(ix, displayBase, ixValue) {
    ixValue.textContent = formatNumber(ix, displayBase);
}

// atualiza visualmente o ponteiro base bp
export function updateBpUI(bp, displayBase, bpValue) {
    bpValue.textContent = formatNumber(bp, displayBase);
}

// atualiza visualmente o vetor b (vb)
export function updateVbUI(vb, displayBase, vbValue) {
    const formattedVb = vb.map(v => formatNumber(v, displayBase));
    vbValue.textContent = `[${formattedVb.join(', ')}]`;
}

// atualiza a numeracao grafica correspondente a thread na barra 
export function updateTidUI(tid, tidValue) {
    if(tidValue) tidValue.textContent = tid;
}

// atualiza a flag visual exibindo hex ou dec no topo da tela
export function updateBaseUI(displayBase, baseDisplay) {
    baseDisplay.textContent = displayBase === 10 ? 'DEC' : 'HEX';
}

// atualiza numericamente os hits e misses na caixinha de caches
export function updateCacheUI(iCache, dCache, displayBase, icacheHits, icacheMisses, icacheTag, icacheData, dcacheHits, dcacheMisses, dcacheTag, dcacheData) {
    icacheHits.textContent = iCache.hits;
    icacheMisses.textContent = iCache.misses;
    icacheTag.textContent = iCache.valid ? formatNumber(iCache.tag, displayBase) : '-';
    icacheData.textContent = iCache.valid ? `[${iCache.data.map(d => formatNumber(d, displayBase)).join(', ')}]` : '[...]';
    
    dcacheHits.textContent = dCache.hits;
    dcacheMisses.textContent = dCache.misses;
    dcacheTag.textContent = dCache.valid ? formatNumber(dCache.tag, displayBase) : '-';
    dcacheData.textContent = dCache.valid ? `[${dCache.data.map(d => formatNumber(d, displayBase)).join(', ')}]` : '[...]';
}

// intercala abrir ou fechar as popups e o overlay escuro
export function toggleModal(modalElement, show, overlay) {
    modalElement.style.display = show ? 'block' : 'none';
    overlay.style.display = show ? 'block' : 'none';
}

// gera a estrutura em grid do container de memoria do lado direito
export function createMemoryGrid(memoryGrid, memorySize) {
    for (let i = 0; i < memorySize; i++) {
        const cell = document.createElement('div');
        cell.className = 'memory-cell';
        cell.id = `mem-cell-${i}`;

        const addr = document.createElement('div');
        addr.className = 'memory-cell-addr';
        addr.id = `mem-addr-${i}`;

        const value = document.createElement('div');
        value.className = 'memory-cell-value';
        value.id = `mem-value-${i}`;
        
        cell.appendChild(addr);
        cell.appendChild(value);
        memoryGrid.appendChild(cell);
    }
}

// aplica os esquemas de cores de acordo com o modo escuro ou claro
export function applySyntaxColors(theme, syntaxColors) {
    if (!syntaxColors || !syntaxColors[theme]) return;
    const colors = syntaxColors[theme];
    for (const [key, value] of Object.entries(colors)) {
        document.body.style.setProperty(`--${key}`, value);
    }
}

// popula os cards do modal de visualizacao das threads ao vivo
export function populateCoresModal(state, ui) {
    ui.coresContent.innerHTML = '';
    
    // itera sobre as threads gerando os cards visuais agrupados por core
    state.threads.forEach((t, index) => {
        const isCurrent = (index === state.currentThreadId && t.active);
        const card = document.createElement('div');
        card.className = `core-card ${t.active ? '' : 'core-inactive'}`;

        // define as variaveis exibidas de acordo com o contexto atual
        const pc = isCurrent ? state.pc : t.pc;
        const ac = isCurrent ? state.ac : t.ac;
        const b = isCurrent ? state.b : t.b;
        const ix = isCurrent ? state.ix : t.ix;
        const bp = isCurrent ? state.bp : t.bp;
        const va = isCurrent ? state.va : t.va;
        const vb = isCurrent ? state.vb : t.vb;
        const z = isCurrent ? state.zeroFlag : t.zeroFlag;
        const n = isCurrent ? state.negativeFlag : t.negativeFlag;

        // titulo visual com a indicacao da thread em seu respectivo core
        card.innerHTML = `
            <div class="core-header">Core ${t.coreId} - Thread ${index % CONSTANTS.THREADS_PER_CORE}</div>
            <div class="core-stat"><span>Status:</span> <span>${t.active ? (isCurrent ? 'Executando' : 'Pronta') : 'Inativa'}</span></div>
            <div class="core-stat"><span>PC:</span> <span>${formatNumber(pc, state.displayBase)}</span></div>
            <div class="core-stat"><span>AC:</span> <span>${formatNumber(ac, state.displayBase)}</span></div>
            <div class="core-stat"><span>B:</span> <span>${formatNumber(b, state.displayBase)}</span></div>
            <div class="core-stat"><span>IX:</span> <span>${formatNumber(ix, state.displayBase)}</span></div>
            <div class="core-stat"><span>BP:</span> <span>${formatNumber(bp, state.displayBase)}</span></div>
            <div class="core-stat"><span>Flags:</span> <span>Z:${z ? 1 : 0} | N:${n ? 1 : 0}</span></div>
            <div class="core-stat" style="flex-direction: column; text-align: center;">
                <span style="margin-bottom: 2px;">VA: [${va.map(v => formatNumber(v, state.displayBase)).join(', ')}]</span>
                <span>VB: [${vb.map(v => formatNumber(v, state.displayBase)).join(', ')}]</span>
            </div>
        `;
        ui.coresContent.appendChild(card);
    });
}