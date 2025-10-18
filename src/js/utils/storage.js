/**
 * Utilitários para gerenciamento de storage (Chrome Storage API)
 */

const STORAGE_KEY = 'shortcuts';

/**
 * Carrega atalhos do storage
 * @returns {Promise<Array>} Lista de atalhos
 */
export const loadShortcuts = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, (data) => {
      resolve(data[STORAGE_KEY] || []);
    });
  });
};

/**
 * Salva atalhos no storage
 * @param {Array} shortcuts - Lista de atalhos a salvar
 * @returns {Promise<void>}
 */
export const saveShortcuts = (shortcuts) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: shortcuts }, () => {
      resolve();
    });
  });
};

/**
 * Adiciona um novo atalho
 * @param {Object} shortcut - Atalho a adicionar
 * @returns {Promise<Array>} Lista atualizada de atalhos
 */
export const addShortcut = async (shortcut) => {
  const shortcuts = await loadShortcuts();
  shortcuts.push(shortcut);
  await saveShortcuts(shortcuts);
  return shortcuts;
};

/**
 * Atualiza um atalho existente
 * @param {number} index - Índice do atalho
 * @param {Object} shortcut - Dados atualizados
 * @returns {Promise<Array>} Lista atualizada de atalhos
 */
export const updateShortcut = async (index, shortcut) => {
  const shortcuts = await loadShortcuts();
  if (index >= 0 && index < shortcuts.length) {
    shortcuts[index] = shortcut;
    await saveShortcuts(shortcuts);
  }
  return shortcuts;
};

/**
 * Remove um atalho
 * @param {number} index - Índice do atalho a remover
 * @returns {Promise<Array>} Lista atualizada de atalhos
 */
export const deleteShortcut = async (index) => {
  const shortcuts = await loadShortcuts();
  shortcuts.splice(index, 1);
  await saveShortcuts(shortcuts);
  return shortcuts;
};

/**
 * Exporta atalhos como JSON
 * @returns {Promise<string>} JSON com todos os atalhos
 */
export const exportShortcuts = async () => {
  const shortcuts = await loadShortcuts();
  return JSON.stringify(shortcuts, null, 2);
};

/**
 * Importa atalhos de JSON
 * @param {string} jsonData - String JSON contendo os atalhos
 * @returns {Promise<{success: boolean, shortcuts?: Array, error?: string}>}
 */
export const importShortcuts = async (jsonData) => {
  try {
    const shortcuts = JSON.parse(jsonData);
    
    // Validar se é um array
    if (!Array.isArray(shortcuts)) {
      return { 
        success: false, 
        error: 'O arquivo deve conter um array de atalhos.' 
      };
    }
    
    // Validar estrutura básica dos atalhos
    for (const shortcut of shortcuts) {
      if (!shortcut.name || !shortcut.pattern || !shortcut.target) {
        return { 
          success: false, 
          error: 'Arquivo inválido: todos os atalhos devem ter name, pattern e target.' 
        };
      }
    }
    
    // Salvar os atalhos importados
    await saveShortcuts(shortcuts);
    
    return { success: true, shortcuts };
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro ao processar arquivo: ' + error.message 
    };
  }
};
