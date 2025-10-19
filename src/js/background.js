/**
 * Background Service Worker
 * Gerencia auto-execução de atalhos quando páginas são carregadas
 * 
 * NOTA: Este arquivo contém cópias de funções do shortcutService.js
 * porque Service Workers não suportam ES6 imports no Chrome Manifest V3.
 * Manter estas funções sincronizadas ao modificar shortcutService.js.
 */

// Armazena IDs de abas que foram restauradas da última sessão
const restoredTabs = new Set();

// Flag para detectar se é a primeira vez que o service worker inicia
let isFirstStart = true;

/**
 * Carrega atalhos do storage
 * @returns {Promise<Array>}
 */
const loadShortcuts = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ shortcuts: [] }, (result) => {
      resolve(result.shortcuts || []);
    });
  });
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS (cópias necessárias de shortcutService.js)
// ============================================================================

/**
 * Substitui placeholders ($1, $2, etc.) em uma string com valores do match
 * @param {string} template - String com placeholders
 * @param {Array} matches - Array de matches da regex
 * @returns {string} String com placeholders substituídos
 * @private
 */
const replacePlaceholders = (template, matches) => {
  let result = template;
  for (let i = 1; i < matches.length; i++) {
    const placeholder = new RegExp('\\$' + i, 'g');
    result = result.replace(placeholder, matches[i]);
  }
  return result;
};

/**
 * Verifica se um atalho causaria loop para uma URL específica (validação runtime)
 * @param {Object} shortcut - Atalho a verificar
 * @param {string} url - URL a testar
 * @returns {boolean} true se causaria loop, false caso contrário
 * @private
 */
const wouldCauseLoop = (shortcut, url) => {
  try {
    const regex = new RegExp(shortcut.pattern);
    const match = url.match(regex);
    
    if (!match) return false;
    
    const destination = replacePlaceholders(shortcut.target, match);
    
    // Verificar se o destino também daria match no padrão
    return regex.test(destination);
  } catch (error) {
    console.error('Erro ao verificar loop:', error);
    return true; // Em caso de erro, assumir que causaria loop por segurança
  }
};

// ============================================================================
// LÓGICA DE AUTO-EXECUÇÃO
// ============================================================================

/**
 * Aplica atalho automaticamente em uma aba
 * @param {number} tabId - ID da aba
 * @param {string} url - URL da aba
 * @param {Object} shortcut - Atalho a aplicar
 */
const applyShortcutToTab = async (tabId, url, shortcut) => {
  try {
    const regex = new RegExp(shortcut.pattern);
    const match = url.match(regex);
    
    if (!match) return;
    
    // Validação de segurança: verificar se causaria loop
    if (wouldCauseLoop(shortcut, url)) {
      console.warn(`[Auto-Exec Bloqueado] "${shortcut.name}": loop detectado para ${url}`);
      return;
    }
    
    // Calcular destino com valores capturados
    const destination = replacePlaceholders(shortcut.target, match);
    
    console.log(`[Auto-Exec] "${shortcut.name}": ${url} → ${destination}`);
    
    // Navegar para o destino
    if (shortcut.openNewTab) {
      await chrome.tabs.create({ url: destination });
    } else {
      await chrome.tabs.update(tabId, { url: destination });
    }
  } catch (error) {
    console.error(`[Auto-Exec Erro] "${shortcut.name}":`, error);
  }
};

/**
 * Verifica e aplica atalhos auto-executáveis para uma URL
 * @param {number} tabId - ID da aba
 * @param {string} url - URL a verificar
 */
const checkAndApplyAutoExecuteShortcuts = async (tabId, url) => {
  // Proteção: ignorar abas restauradas da sessão anterior
  if (restoredTabs.has(tabId)) {
    console.log(`[Auto-Exec] Ignorando aba restaurada: ${tabId}`);
    return;
  }
  
  // Proteção: ignorar URLs internas do navegador
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    return;
  }
  
  const shortcuts = await loadShortcuts();
  
  // Filtrar apenas atalhos com auto-execução ativada
  const autoExecuteShortcuts = shortcuts.filter(s => s.autoExecute === true);
  
  if (autoExecuteShortcuts.length === 0) return;
  
  // Tentar aplicar o primeiro atalho compatível
  for (const shortcut of autoExecuteShortcuts) {
    try {
      const regex = new RegExp(shortcut.pattern);
      if (regex.test(url)) {
        await applyShortcutToTab(tabId, url, shortcut);
        break; // Aplicar apenas o primeiro atalho compatível
      }
    } catch (error) {
      console.error(`[Auto-Exec] Erro ao verificar "${shortcut.name}":`, error);
    }
  }
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handler: Quando uma aba é atualizada/carregada
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(`[Auto-Exec] onUpdated: tabId=${tabId}, status=${changeInfo.status}, url=${tab.url}`);
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndApplyAutoExecuteShortcuts(tabId, tab.url);
  }
});

/**
 * Handler: Quando uma aba é fechada
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  restoredTabs.delete(tabId);
});

// ============================================================================
// PROTEÇÃO DE SESSÃO RESTAURADA
// ============================================================================

/**
 * Marca todas as abas existentes como restauradas e limpa após timeout
 * @param {string} reason - Motivo da marcação
 */
const markRestoredTabs = (reason) => {
  console.log(`[Proteção Sessão] ${reason}`);
  isFirstStart = true;
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        restoredTabs.add(tab.id);
      }
    });
    
    console.log(`[Proteção Sessão] ${restoredTabs.size} abas marcadas como restauradas`);
    
    // Limpar proteção após 10 segundos
    setTimeout(() => {
      restoredTabs.clear();
      isFirstStart = false;
      console.log('[Proteção Sessão] Proteção removida, auto-execução habilitada');
    }, 10000);
  });
};

/**
 * Handler: Quando o service worker é instalado/atualizado
 */
chrome.runtime.onInstalled.addListener((details) => {
  markRestoredTabs(`Instalação/Atualização (${details.reason})`);
});

/**
 * Handler: Quando o navegador inicia
 */
chrome.runtime.onStartup.addListener(() => {
  markRestoredTabs('Navegador iniciado');
});

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

console.log('[Background] Service worker carregado e pronto');
