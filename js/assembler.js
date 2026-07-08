import { CONSTANTS } from './constants.js';
import { formatNumber } from './ui.js';

export function isInstructionVisible(instr, currentModule) {
    if (currentModule === 'classic') {
        return CONSTANTS.CLASSIC_INSTRUCTIONS.includes(instr);
    }
    if (currentModule === 'v') {
        return !CONSTANTS.EXPANDED_ONLY_INSTRUCTIONS.includes(instr);
    }
    return true;
}

export function calculateInstructionSize(line) {
    const code = line.split(';')[0].trim();
    if (!code) return 1;

    const parts = code.split(/[\s,]+/);
    const op = parts[0].toUpperCase();

    if (CONSTANTS.INSTRUCTION_MAP.hasOwnProperty(op)) {
        if (CONSTANTS.OPERAND_INSTRUCTIONS.includes(op) && !CONSTANTS.SIMPLE_INSTRUCTIONS.includes(op)) {
            return 2;
        }
    }
    return 1;
}

export function highlightSyntax(text, state, ui) {
    let escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    const simpleRegex = new RegExp(`\\b(${CONSTANTS.SIMPLE_INSTRUCTIONS.join('|')})\\b`, 'gi');
    const operandRegex = new RegExp(`\\b(${CONSTANTS.OPERAND_INSTRUCTIONS.join('|')})\\b`, 'gi');

    const lines = escapedText.split('\n');
    const highlightedLines = lines.map(line => {
        const commentIndex = line.indexOf(';');
        let codePart = line;
        let commentPart = '';

        // separa codigo do comentario
        if (commentIndex !== -1) {
            codePart = line.substring(0, commentIndex);
            commentPart = line.substring(commentIndex);
        }

        codePart = codePart.replace(simpleRegex, (match) => {
            const upperMatch = match.toUpperCase();
            if (isInstructionVisible(upperMatch, state.currentModule)) {
                if (CONSTANTS.VECTOR_INSTRUCTIONS.includes(upperMatch)) {
                    return `<span class="instr-vector">${match}</span>`;
                }
                return `<span class="instr-simple">${match}</span>`;
            }
            return match;
        });

        codePart = codePart.replace(operandRegex, (match) => {
            const upperMatch = match.toUpperCase();
            if (isInstructionVisible(upperMatch, state.currentModule)) {
                if (CONSTANTS.VECTOR_INSTRUCTIONS.includes(upperMatch)) {
                    return `<span class="instr-vector">${match}</span>`;
                }
                return `<span class="instr-operand">${match}</span>`;
            }
            return match;
        });
        
        // reconstroi a linha botando a cor correta de forma isolada do comentario
        if (commentPart) {
            return codePart + `<span class="comment">${commentPart}</span>`;
        }
        return codePart;
    });

    ui.highlightingCode.innerHTML = highlightedLines.join('\n') + '\n';
}

export function highlightMemory(state, memorySize, displayBase) {
    for (let i = 0; i < memorySize; i++) {
        const addrCell = document.getElementById(`mem-addr-${i}`);
        const valueCell = document.getElementById(`mem-value-${i}`);

        if (addrCell && valueCell) {
            addrCell.textContent = i.toString(displayBase).toUpperCase();
            valueCell.textContent = formatNumber(state.memory[i], displayBase);

			// controle da classe modified pela edicao ou exec
            if (state.modifiedMemory && state.modifiedMemory[i]) {
                addrCell.classList.add('modified');
            } else {
                addrCell.classList.remove('modified');
            }

            const opcodeType = state.opcodeMap[i];
            valueCell.className = 'memory-cell-value';
            if (opcodeType === 'simple') {
                valueCell.classList.add('instr-simple');
            } else if (opcodeType === 'operand') {
                valueCell.classList.add('instr-operand');
            } else if (opcodeType === 'vector') {
                valueCell.classList.add('instr-vector');
            }
        }
    }
}

export function updateLeftLineCounter(inputValue, leftInputBase, displayBase, outputLeft, memorySize) {
    const lines = inputValue.split('\n');
    const memPos = [];
    let addr = 0;
    for (const line of lines) {
        if (addr >= memorySize) {
            memPos.push('...');
        } else {
            memPos.push(formatNumber(addr, displayBase));
        }
        addr += calculateInstructionSize(line);
    }
    outputLeft.innerHTML = memPos.join('<br>');
}

export function assembleCode(state, inputValue, memorySize) {
    const lines = inputValue.split('\n');
    state.memory.fill(0);
    state.opcodeMap.fill(null);
    
    // inicia e limpa array de modificacoes
    if (!state.modifiedMemory) state.modifiedMemory = new Array(memorySize).fill(false);
    state.modifiedMemory.fill(false);
    
    let memPtr = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (memPtr >= memorySize) break;

        const raw = line.split(';')[0].trim();
        if (!raw) {
            state.memory[memPtr] = 0;
            state.modifiedMemory[memPtr] = false;
            memPtr++;
            continue;
        }
        
        const tokens = raw.split(/[\s,]+/);
        const op = tokens[0].toUpperCase();

        if (CONSTANTS.INSTRUCTION_MAP.hasOwnProperty(op)) {
            const isOperand = CONSTANTS.OPERAND_INSTRUCTIONS.includes(op) && !CONSTANTS.SIMPLE_INSTRUCTIONS.includes(op);
            if (isOperand && memPtr + 2 > memorySize) break;

            state.memory[memPtr] = CONSTANTS.INSTRUCTION_MAP[op];
            state.modifiedMemory[memPtr] = true;
            
            if (isInstructionVisible(op, state.currentModule)) {
                if (CONSTANTS.SIMPLE_INSTRUCTIONS.includes(op)) {
                    state.opcodeMap[memPtr] = 'simple';
                } else if (CONSTANTS.OPERAND_INSTRUCTIONS.includes(op)) {
                    state.opcodeMap[memPtr] = 'operand';
                }
                if (CONSTANTS.VECTOR_INSTRUCTIONS.includes(op)) {
                    state.opcodeMap[memPtr] = 'vector';
                }
            }

            memPtr++;

            if (isOperand) {
                if (tokens.length > 1 && tokens[1]) {
                    const operand = parseInt(tokens[1], state.leftInputBase);
                    state.memory[memPtr] = isNaN(operand) ? 0 : (operand & 0xFF);
                    state.modifiedMemory[memPtr] = true;
                    memPtr++;
                } else {
                    state.modifiedMemory[memPtr] = false;
                    memPtr++;
                }
            }
        } else {
            const data = parseInt(raw, state.leftInputBase);
            state.memory[memPtr] = isNaN(data) ? 0 : (data & 0xFF);
            state.modifiedMemory[memPtr] = true;
            memPtr++;
        }
    }

    highlightMemory(state, memorySize, state.displayBase);
}