import { CONSTANTS } from './constants.js';
import { highlightSyntax, assembleCode, highlightMemory, updateLeftLineCounter, calculateInstructionSize } from './assembler.js';
import { executeSingleInstruction, resetState } from './execution.js';
import { logMessage, loadLanguage, populateHelpModal } from './language.js';
import { clearLog, toggleModal, updateAcUI, updateBUI, updatePcUI, updateVaUI, updateIxUI, updateBpUI, updateVbUI, updateCacheUI, updateBaseUI, applySyntaxColors, populateCoresModal } from './ui.js';

// processa o que e digitado no editor de codigo
export function handleEditorInput(state, ui) {
    const textToProcess = ui.inputLeft.value;
    highlightSyntax(textToProcess, state, ui);
    handleLeftInputChange(state, ui);
}

// atualizacao logica e visual quando o texto muda
function handleLeftInputChange(state, ui) {
    updateLeftLineCounter(ui.inputLeft.value, state.leftInputBase, state.displayBase, ui.outputLeft, CONSTANTS.MEMORY_SIZE);
    assembleCode(state, ui.inputLeft.value, CONSTANTS.MEMORY_SIZE);
}

// zera o simulador e limpa as memorias e log
export function clearSimulator(state, ui) {
    clearLog(ui.logContainer);
    resetState(state, ui, CONSTANTS.I_CACHE_SIZE, CONSTANTS.D_CACHE_SIZE, CONSTANTS.VECTOR_REG_SIZE);
    logMessage('cleared', state, ui);
    updateLeftLineCounter(ui.inputLeft.value, state.leftInputBase, state.displayBase, ui.outputLeft, CONSTANTS.MEMORY_SIZE);
    assembleCode(state, ui.inputLeft.value, CONSTANTS.MEMORY_SIZE);
    
    // atualiza a janela de cores ao vivo se ela estiver aberta ao limpar
    if (ui.coresModal.style.display === 'block') {
        populateCoresModal(state, ui);
    }
}

// roda o programa em modo continuo ate o hlt ou loop infinito
export function runProgram(state, ui) {
    clearLog(ui.logContainer);
    assembleCode(state, ui.inputLeft.value, CONSTANTS.MEMORY_SIZE);
    resetState(state, ui, CONSTANTS.I_CACHE_SIZE, CONSTANTS.D_CACHE_SIZE, CONSTANTS.VECTOR_REG_SIZE);

    let steps = 0;
    while (steps < CONSTANTS.INFINITE_LOOP_THRESHOLD) {
        if (executeSingleInstruction(state, ui, CONSTANTS.MEMORY_SIZE) === 'HALT') {
            break;
        }
        steps++;
    }

    if (steps >= CONSTANTS.INFINITE_LOOP_THRESHOLD) {
        logMessage('errorInfiniteLoop', state, ui);
    }

    highlightMemory(state, CONSTANTS.MEMORY_SIZE, state.displayBase);

    // atualiza a janela de cores ao vivo se ela estiver aberta ao rodar
    if (ui.coresModal.style.display === 'block') {
        populateCoresModal(state, ui);
    }
}

// inicializa os dados necessarios para iniciar o passo a passo
export function initStepMode(state, ui) {
    clearLog(ui.logContainer);
    assembleCode(state, ui.inputLeft.value, CONSTANTS.MEMORY_SIZE);
    resetState(state, ui, CONSTANTS.I_CACHE_SIZE, CONSTANTS.D_CACHE_SIZE, CONSTANTS.VECTOR_REG_SIZE);
    state.isStepMode = true;
    ui.stepControls.style.display = 'flex';
}

// executa um unico passo de instrucao e atualiza interface
export function executeStep(state, ui) {
    if (!state.isStepMode) initStepMode(state, ui);
    
    if (executeSingleInstruction(state, ui, CONSTANTS.MEMORY_SIZE) === 'HALT') {
        state.isStepMode = false;
    }
    
    highlightMemory(state, CONSTANTS.MEMORY_SIZE, state.displayBase);

    // atualiza a janela de cores ao vivo se ela estiver aberta
    if (ui.coresModal.style.display === 'block') {
        populateCoresModal(state, ui);
    }
}

// encerra o modo passo a passo
export function stopStepMode(state, ui) {
    state.isStepMode = false;
    ui.stepControls.style.display = 'none';
}

// converte a base numerica de todo o texto no editor
export function convertLeftEditor(newBase, state, ui) {
    const text = ui.inputLeft.value;
    const newLines = text.split('\n').map(line => {
        const commentPart = line.includes(';') ? ' ;' + line.split(';')[1] : '';
        const code = line.split(';')[0].trim();
        if (!code) return line;

        const tokens = code.split(/[\s,]+/);
        const op = tokens[0].toUpperCase();

        if ([...CONSTANTS.OPERAND_INSTRUCTIONS, ...CONSTANTS.SIMPLE_INSTRUCTIONS].includes(op)) {
            if (tokens.length > 1) {
                const val = parseInt(tokens[1], state.leftInputBase);
                if (!isNaN(val)) tokens[1] = (newBase === 10) ? String(val) : val.toString(16).toUpperCase();
            }
            return tokens.join(' ') + commentPart;
        } else {
            const val = parseInt(tokens[0], state.leftInputBase);
            return !isNaN(val) ? ((newBase === 10) ? String(val) : val.toString(16).toUpperCase()) : line;
        }
    });
    
    state.leftInputBase = newBase;
    state.displayBase = newBase;
    
    ui.inputLeft.value = newLines.join('\n');
    highlightSyntax(ui.inputLeft.value, state, ui);
    
    const acResult = updateAcUI(state.ac, state.zeroFlag, state.negativeFlag, state.displayBase, ui.acValue, ui.nFlagBox, ui.zFlagBox);
    state.ac = acResult.ac;
    state.zeroFlag = acResult.zeroFlag;
    state.negativeFlag = acResult.negativeFlag;
    
    state.b = updateBUI(state.b, state.displayBase, ui.bValue);
    updatePcUI(state.pc, state.displayBase, ui.pcValue);
    updateVaUI(state.va, state.displayBase, ui.vaValue);
    updateIxUI(state.ix, state.displayBase, ui.ixValue);
    updateBpUI(state.bp, state.displayBase, ui.bpValue);
    updateVbUI(state.vb, state.displayBase, ui.vbValue);
    updateCacheUI(state.iCache, state.dCache, state.displayBase, ui.icacheHits, ui.icacheMisses, ui.icacheTag, ui.icacheData, ui.dcacheHits, ui.dcacheMisses, ui.dcacheTag, ui.dcacheData);
    updateBaseUI(state.displayBase, ui.baseDisplay);
    updateLeftLineCounter(ui.inputLeft.value, state.leftInputBase, state.displayBase, ui.outputLeft, CONSTANTS.MEMORY_SIZE);
    highlightMemory(state, CONSTANTS.MEMORY_SIZE, state.displayBase);
}

// carrega um arquivo de memoria do computador do usuario
export function loadFile(state, ui) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.mem';
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            let content = ev.target.result;
            const firstLine = content.split('\n')[0].trim().toUpperCase();
            
            let newBase = state.leftInputBase;
            
            if (firstLine === '#HEX') {
                newBase = 16;
                content = content.substring(content.indexOf('\n') + 1);
            } else if (firstLine === '#DEC') {
                newBase = 10;
                content = content.substring(content.indexOf('\n') + 1);
            }

            state.leftInputBase = newBase;
            state.displayBase = newBase;
            
            ui.inputLeft.value = content;
            
            handleEditorInput(state, ui);
            const acResult = updateAcUI(state.ac, state.zeroFlag, state.negativeFlag, state.displayBase, ui.acValue, ui.nFlagBox, ui.zFlagBox);
            state.ac = acResult.ac;
            state.zeroFlag = acResult.zeroFlag;
            state.negativeFlag = acResult.negativeFlag;
            
            state.b = updateBUI(state.b, state.displayBase, ui.bValue);
            updatePcUI(state.pc, state.displayBase, ui.pcValue);
            updateVaUI(state.va, state.displayBase, ui.vaValue);
            updateIxUI(state.ix, state.displayBase, ui.ixValue);
            updateBpUI(state.bp, state.displayBase, ui.bpValue);
            updateVbUI(state.vb, state.displayBase, ui.vbValue);
            updateCacheUI(state.iCache, state.dCache, state.displayBase, ui.icacheHits, ui.icacheMisses, ui.icacheTag, ui.icacheData, ui.dcacheHits, ui.dcacheMisses, ui.dcacheTag, ui.dcacheData);
            updateBaseUI(state.displayBase, ui.baseDisplay);
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

// salva o programa atual em arquivo txt no computador do usuario
export function saveFile(state, ui) {
    const metadata = `#${state.leftInputBase === 10 ? 'DEC' : 'HEX'}\n`;
    const textToSave = metadata + ui.inputLeft.value;
    
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'program.mem';
    link.click();
    URL.revokeObjectURL(link.href);
}

// altera qual modulo logico da arquitetura sera usado
export function setModule(moduleName, state, ui) {
    state.currentModule = moduleName;
    const isClassic = moduleName === 'classic';
    const isExpanded = moduleName === 'expanded';

    ui.vaBox.classList.toggle('hidden', isClassic);
    ui.cacheContainer.classList.toggle('hidden', isClassic);
    
    ui.ixBox.classList.toggle('hidden', !isExpanded);
    ui.bpBox.classList.toggle('hidden', !isExpanded);
    ui.vbBox.classList.toggle('hidden', !isExpanded);
    ui.bBox.classList.toggle('hidden', !isExpanded);
    
    // mostra/oculta botao cores
    ui.btnCores.style.display = isExpanded ? 'block' : 'none';
    
    highlightSyntax(ui.inputLeft.value, state, ui);
    assembleCode(state, ui.inputLeft.value, CONSTANTS.MEMORY_SIZE);
}

// atrela eventos de interacao de componentes da interface
export function bindEventListeners(state, ui) {
    ui.btnLoad.addEventListener('click', () => loadFile(state, ui));
    ui.btnSave.addEventListener('click', () => saveFile(state, ui));
    ui.btnHex.addEventListener('click', () => convertLeftEditor(16, state, ui));
    ui.btnDec.addEventListener('click', () => convertLeftEditor(10, state, ui));
    ui.btnRunProg.addEventListener('click', () => runProgram(state, ui));
    ui.btnStep.addEventListener('click', () => initStepMode(state, ui));
    ui.btnClear.addEventListener('click', () => clearSimulator(state, ui));
    
    ui.btnAbout.addEventListener('click', () => toggleModal(ui.aboutModal, true, ui.overlay));
    ui.btnCloseAbout.addEventListener('click', () => toggleModal(ui.aboutModal, false, ui.overlay));
    
    ui.btnHelp.addEventListener('click', () => toggleModal(ui.helpModal, true, ui.overlay));
    ui.btnCloseHelp.addEventListener('click', () => toggleModal(ui.helpModal, false, ui.overlay));

    ui.btnModules.addEventListener('click', () => toggleModal(ui.modulesModal, true, ui.overlay));
    ui.btnCloseModules.addEventListener('click', () => toggleModal(ui.modulesModal, false, ui.overlay));

    // eventos do novo modal cores
    ui.btnCores.addEventListener('click', () => {
        populateCoresModal(state, ui);
        toggleModal(ui.coresModal, true, ui.overlay);
    });
    ui.btnCloseCores.addEventListener('click', () => toggleModal(ui.coresModal, false, ui.overlay));

    ui.languageSwitch.addEventListener('click', async () => {
        const newLang = state.currentLanguage === 'en' ? 'pt' : 'en';
        await loadLanguage(newLang, state, ui, populateHelpModal);
    });

    ui.themeSwitch.addEventListener('click', () => {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode');
        ui.themeSwitch.textContent = state.currentTheme === 'light' ? '🌙' : '☀️';
        applySyntaxColors(state.currentTheme, state.syntaxColors);
    });

    ui.inputLeft.addEventListener('input', () => handleEditorInput(state, ui));
    
    ui.inputLeft.addEventListener('scroll', () => {
        ui.highlightingArea.scrollTop = ui.inputLeft.scrollTop;
        ui.highlightingArea.scrollLeft = ui.inputLeft.scrollLeft;
        ui.outputLeft.scrollTop = ui.inputLeft.scrollTop;
    });

    ui.btnNext.addEventListener('click', () => executeStep(state, ui));
    ui.btnStopStep.addEventListener('click', () => stopStepMode(state, ui));

    ui.overlay.addEventListener('click', () => {
        toggleModal(ui.aboutModal, false, ui.overlay);
        toggleModal(ui.helpModal, false, ui.overlay);
        toggleModal(ui.modulesModal, false, ui.overlay);
        toggleModal(ui.coresModal, false, ui.overlay); // fecha modal cores ao clicar fora
    });

    ui.moduleRadioButtons.forEach(radio => {
        radio.addEventListener('change', (event) => {
            setModule(event.target.value, state, ui);
        });
    });

    // resizer
    let isDragging = false;

    ui.resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        ui.resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        e.preventDefault(); 
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const container = ui.editorWrapper.parentElement; 
        const containerRect = container.getBoundingClientRect();
        
        let newWidthPercentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        if (newWidthPercentage < 20) newWidthPercentage = 20;
        if (newWidthPercentage > 80) newWidthPercentage = 80;

        ui.editorWrapper.style.width = `${newWidthPercentage}%`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            ui.resizer.classList.remove('dragging');
            document.body.style.cursor = ''; 
        }
    });

    // atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // se estiver focado no editor de texto nao interfere nos atalhos
        if (document.activeElement === ui.inputLeft) return;

        // verifica se o painel do passo a passo (botoes) ta na tela
        const isStepPanelActive = ui.stepControls.style.display === 'flex';

        // atalhos modo passo a passo
        if (isStepPanelActive) {
            if (e.code === 'Space') {
                e.preventDefault(); 
                stopStepMode(state, ui);
                return; 
            } else if (e.code === 'ArrowRight') {
                e.preventDefault(); 
                executeStep(state, ui);
                return;
            }
        }

        // funcao auxiliar para fechar todos as janelas
        const closeAllModals = () => {
            toggleModal(ui.aboutModal, false, ui.overlay);
            toggleModal(ui.helpModal, false, ui.overlay);
            toggleModal(ui.modulesModal, false, ui.overlay);
            toggleModal(ui.coresModal, false, ui.overlay);
        };

        // atalhos globais
        const key = e.key.toUpperCase();
        
        if (key === 'R') {
            runProgram(state, ui);
        } else if (key === 'T') {
            initStepMode(state, ui);
        } else if (key === 'C') {
            clearSimulator(state, ui);
        } else if (key === 'D') {
            convertLeftEditor(10, state, ui);
        } else if (key === 'H') {
            convertLeftEditor(16, state, ui);
        } else if (key === 'M') {
            const wasOpen = ui.modulesModal.style.display === 'block';
            closeAllModals(); // fecha tudo que estiver aberto
            if (!wasOpen) toggleModal(ui.modulesModal, true, ui.overlay);
        } else if (key === 'P') {
            const wasOpen = ui.helpModal.style.display === 'block';
            closeAllModals(); // fecha tudo que estiver aberto
            if (!wasOpen) toggleModal(ui.helpModal, true, ui.overlay);
        } else if (key === 'Z') {
            // condicao para abrir janela cores
            if (state.currentModule === 'expanded') {
                const wasOpen = ui.coresModal.style.display === 'block';
                closeAllModals(); // fecha tudo que estiver aberto
                if (!wasOpen) {
                    populateCoresModal(state, ui);
                    toggleModal(ui.coresModal, true, ui.overlay);
                }
            }
        } else if (key === 'ESCAPE') {
            closeAllModals();
        }
    });
}