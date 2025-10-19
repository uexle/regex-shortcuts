/**
 * Serviço para gerenciar lógica de negócio dos atalhos
 */

import * as storage from '../utils/storage.js';
import * as chromeUtil from '../utils/chrome.js';

/**
 * Calcula a URL de destino baseada no padrão e URL atual
 * @param {Object} shortcut - Atalho a processar
 * @param {string} currentUrl - URL atual
 * @returns {{success: boolean, destination?: string, error?: string}}
 */
export const calculateDestination = (shortcut, currentUrl) => {
  try {
    // Validar entrada
    if (!shortcut || !shortcut.pattern || !shortcut.target) {
      return { success: false, error: 'Atalho inválido' };
    }

    if (!currentUrl) {
      return { success: false, error: 'URL não detectada' };
    }

    // Criar regex e testar match
    const regex = new RegExp(shortcut.pattern);
    const match = currentUrl.match(regex);

    if (!match) {
      return { 
        success: false, 
        error: 'A regex não corresponde à URL atual' 
      };
    }

    // Substituir grupos capturados
    const destination = replacePlaceholders(shortcut.target, match);

    return { success: true, destination };
  } catch (err) {
    return { 
      success: false, 
      error: `Erro ao processar atalho: ${err.message}` 
    };
  }
};

/**
 * Aplica regex no padrão do atalho e navega para o destino
 * @param {Object} shortcut - Atalho a aplicar
 * @param {string} currentUrl - URL atual da aba
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const applyShortcut = async (shortcut, currentUrl) => {
  // Calcular destino
  const result = calculateDestination(shortcut, currentUrl);
  
  if (!result.success) {
    return result;
  }

  try {
    // Navegar para o destino
    await chromeUtil.navigateTo(result.destination, shortcut.openNewTab);
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: `Erro ao aplicar atalho: ${err.message}` 
    };
  }
};

/**
 * Substitui placeholders ($1, $2, etc.) em uma string com valores do match
 * @param {string} template - String com placeholders
 * @param {Array} matches - Array de matches da regex (resultado de String.match())
 * @returns {string} String com placeholders substituídos
 */
export const replacePlaceholders = (template, matches) => {
  let result = template;
  for (let i = 1; i < matches.length; i++) {
    const placeholder = new RegExp('\\$' + i, 'g');
    result = result.replace(placeholder, matches[i]);
  }
  return result;
};

/**
 * Verifica se um atalho causaria loop infinito
 * @param {Object} shortcut - Dados do atalho a validar
 * @param {string} [testUrl] - URL específica para testar (opcional)
 * @returns {boolean} true se causaria loop, false caso contrário
 */
export const wouldCauseLoop = (shortcut, testUrl = null) => {
  try {
    if (!shortcut.pattern || !shortcut.target) {
      return false;
    }

    const regex = new RegExp(shortcut.pattern);
    
    // Se testUrl foi fornecida, usar ela (validação em runtime)
    if (testUrl) {
      const match = testUrl.match(regex);
      if (!match) return false;
      
      const destination = replacePlaceholders(shortcut.target, match);
      return regex.test(destination);
    }
    
    // Validação estática: verificar se o padrão e destino são muito similares
    
    // 1. Se o destino não tem placeholders, testar direto
    if (!shortcut.target.includes('$')) {
      return regex.test(shortcut.target);
    }
    
    // 2. Verificar se o destino tem a mesma estrutura base do padrão
    // Remover grupos de captura do padrão para comparação
    const patternBase = shortcut.pattern
      .replace(/\^/g, '')
      .replace(/\$$/g, '')
      .replace(/\\/g, '')
      .replace(/\([^)]+\)/g, '')
      .replace(/\.\*/g, '')
      .replace(/\.\+/g, '')
      .replace(/\?/g, '');
    
    const targetBase = shortcut.target
      .replace(/\$\d+/g, '')
      .trim();
    
    // Se as bases são iguais ou muito similares, pode causar loop
    if (patternBase === targetBase) {
      return true;
    }
    
    // 3. Testar com um valor genérico que provavelmente daria match
    // Usar um valor que seja válido para a maioria dos casos
    const testValue = 'test123';
    let testDestination = shortcut.target;
    for (let i = 1; i <= 9; i++) {
      const placeholder = new RegExp('\\$' + i, 'g');
      testDestination = testDestination.replace(placeholder, testValue);
    }
    
    // Se o destino de teste der match no padrão, pode causar loop
    if (regex.test(testDestination)) {
      return true;
    }
    
    return false;
  } catch (error) {
    // Em caso de erro, assumir que não causa loop
    return false;
  }
};

/**
 * Valida dados do atalho
 * @param {Object} shortcut - Dados do atalho a validar
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateShortcut = (shortcut) => {
  const errors = [];

  if (!shortcut.name || !shortcut.name.trim()) {
    errors.push('Nome é obrigatório');
  }

  if (!shortcut.pattern || !shortcut.pattern.trim()) {
    errors.push('Padrão (regex) é obrigatório');
  } else {
    // Tentar compilar a regex para verificar se é válida
    try {
      new RegExp(shortcut.pattern);
    } catch (e) {
      errors.push('Regex inválida');
    }
  }

  if (!shortcut.target || !shortcut.target.trim()) {
    errors.push('Destino é obrigatório');
  }
  
  // Validar auto-execução
  if (shortcut.autoExecute && wouldCauseLoop(shortcut)) {
    errors.push('Auto-execução não permitida: o padrão corresponde ao destino');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Cria ou atualiza atalho
 * @param {Object} shortcutData - Dados do atalho
 * @param {number|null} index - Índice para atualizar (null para criar)
 * @returns {Promise<{success: boolean, shortcuts?: Array, errors?: string[]}>}
 */
export const saveShortcut = async (shortcutData, index = null) => {
  // Validar dados
  const validation = validateShortcut(shortcutData);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // Salvar ou atualizar
  let shortcuts;
  if (index !== null && index >= 0) {
    shortcuts = await storage.updateShortcut(index, shortcutData);
  } else {
    shortcuts = await storage.addShortcut(shortcutData);
  }

  return { success: true, shortcuts };
};

/**
 * Remove atalho
 * @param {number} index - Índice do atalho a remover
 * @returns {Promise<Array>} Lista atualizada de atalhos
 */
export const removeShortcut = async (index) => {
  return await storage.deleteShortcut(index);
};

/**
 * Reordena atalhos
 * @param {number} fromIndex - Índice de origem
 * @param {number} toIndex - Índice de destino
 * @returns {Promise<Array>} Lista atualizada de atalhos
 */
export const reorderShortcuts = async (fromIndex, toIndex) => {
  return await storage.reorderShortcuts(fromIndex, toIndex);
};

/**
 * Carrega todos os atalhos
 * @returns {Promise<Array>} Lista de atalhos
 */
export const getAllShortcuts = async () => {
  return await storage.loadShortcuts();
};

/**
 * Exporta todos os atalhos como JSON
 * @returns {Promise<string>} JSON com todos os atalhos
 */
export const exportShortcuts = async () => {
  return await storage.exportShortcuts();
};

/**
 * Importa atalhos de JSON
 * @param {string} jsonData - String JSON contendo os atalhos
 * @returns {Promise<{success: boolean, shortcuts?: Array, error?: string}>}
 */
export const importShortcuts = async (jsonData) => {
  return await storage.importShortcuts(jsonData);
};
