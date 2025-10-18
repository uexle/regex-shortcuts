/**
 * Componente para área de edição/listagem de atalhos
 */

import { getElement, clearElement } from '../utils/dom.js';
import ShortcutItem from './ShortcutItem.js';

class EditArea {
  constructor() {
    this.container = getElement('edit-area');
    this.listContainer = getElement('shortcuts-list');
    this.currentUrlElement = getElement('current-url');
    this.closeButton = getElement('close-edit');
    
    this.shortcuts = [];
    this.shortcutItems = []; // Armazenar referências dos itens
    this.onCloseCallback = null;
  }

  /**
   * Inicializa event listeners
   * @param {Function} onClose - Callback para fechar área de edição
   */
  init({ onClose }) {
    this.onCloseCallback = onClose;

    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        if (this.onCloseCallback) this.onCloseCallback();
      });
    }
  }

  /**
   * Renderiza lista de atalhos
   * @param {Array} shortcuts - Lista de atalhos
   * @param {Object} callbacks - Callbacks para ações nos atalhos
   */
  renderShortcuts(shortcuts, { onApply, onEdit, onDelete }) {
    if (!this.listContainer) return;

    this.shortcuts = shortcuts;
    this.shortcutItems = []; // Resetar array
    clearElement(this.listContainer);

    shortcuts.forEach((shortcut, index) => {
      const item = new ShortcutItem(shortcut, index, {
        onApply,
        onEdit,
        onDelete
      });

      const element = item.getElement();
      if (element) {
        this.listContainer.appendChild(element);
        this.shortcutItems[index] = item; // Armazenar referência
      }
    });
  }

  /**
   * Atualiza URL atual exibida
   * @param {string} url - URL a exibir
   */
  setCurrentUrl(url) {
    if (!this.currentUrlElement) return;

    const displayUrl = url || '(não detectada)';
    this.currentUrlElement.textContent = displayUrl;
    this.currentUrlElement.title = url || '';
  }

  /**
   * Mostra área de edição
   */
  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  /**
   * Oculta área de edição
   */
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  /**
   * Marca um botão de atalho como erro
   * @param {number} index - Índice do atalho
   */
  markShortcutAsError(index) {
    const item = this.shortcutItems[index];
    if (item) {
      const button = item.getApplyButton();
      if (button) {
        button.classList.add('error');
      }
    }
  }

  /**
   * Remove marcação de erro de um botão de atalho
   * @param {number} index - Índice do atalho
   */
  clearShortcutError(index) {
    const item = this.shortcutItems[index];
    if (item) {
      const button = item.getApplyButton();
      if (button) {
        button.classList.remove('error');
      }
    }
  }
}

export default EditArea;
