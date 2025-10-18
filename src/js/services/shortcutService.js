/**
 * Serviço para gerenciar lógica de negócio dos atalhos
 */

import * as storage from '../utils/storage.js';
import * as chromeUtil from '../utils/chrome.js';

/**
 * Aplica regex no padrão do atalho e navega para o destino
 * @param {Object} shortcut - Atalho a aplicar
 * @param {string} currentUrl - URL atual da aba
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const applyShortcut = async (shortcut, currentUrl) => {
  try {
    // Validar entrada
    if (!shortcut || !shortcut.pattern || !shortcut.target) {
      return { success: false, error: 'Atalho inválido.' };
    }

    if (!currentUrl) {
      return { success: false, error: 'URL atual não detectada.' };
    }

    // Criar regex e testar match
    const regex = new RegExp(shortcut.pattern);
    const match = currentUrl.match(regex);

    if (!match) {
      return { 
        success: false, 
        error: 'A regex não combina com a URL atual.' 
      };
    }

    // Substituir grupos capturados ($1, $2, etc.)
    let destination = shortcut.target;
    for (let i = 1; i < match.length; i++) {
      const placeholder = new RegExp('\\$' + i, 'g');
      destination = destination.replace(placeholder, match[i]);
    }

    // Navegar para o destino
    await chromeUtil.navigateTo(destination, shortcut.openNewTab);

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: `Erro ao aplicar o atalho: ${err.message}` 
    };
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
    errors.push('Nome é obrigatório.');
  }

  if (!shortcut.pattern || !shortcut.pattern.trim()) {
    errors.push('Regex (padrão) é obrigatório.');
  } else {
    // Tentar compilar a regex para verificar se é válida
    try {
      new RegExp(shortcut.pattern);
    } catch (e) {
      errors.push('Regex inválida: ' + e.message);
    }
  }

  if (!shortcut.target || !shortcut.target.trim()) {
    errors.push('Destino é obrigatório.');
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
 * Carrega todos os atalhos
 * @returns {Promise<Array>} Lista de atalhos
 */
export const getAllShortcuts = async () => {
  return await storage.loadShortcuts();
};
