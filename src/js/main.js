/**
 * Main.js - Ponto de entrada da aplicação
 * Inicializa o UIManager quando o DOM estiver pronto
 */

import UIManager from './ui/UIManager.js';

/**
 * Inicializa a aplicação
 */
const initApp = async () => {
  try {
    const uiManager = new UIManager();
    await uiManager.init();
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
};

// Aguarda carregamento do DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM já carregado
  initApp();
}
