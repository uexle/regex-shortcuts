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
    this.importButton = getElement('import-shortcuts');
    this.exportButton = getElement('export-shortcuts');
    this.importFileInput = getElement('import-file-input');

    this.shortcuts = [];
    this.shortcutItems = [];
    this.onCloseCallback = null;

    this.draggedElement = null;
    this.draggedIndex = null;
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

    if (this.exportButton) {
      this.exportButton.addEventListener('click', () => {
        if (this.onExport) this.onExport();
      });
    }

    if (this.importButton && this.importFileInput) {
      this.importButton.addEventListener('click', () => {
        this.importFileInput.value = null;
        this.importFileInput.click();
      });

      this.importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const text = await file.text();
        if (this.onImport) this.onImport(text);
      });
    }
  }

  /**
   * Renderiza lista de atalhos
   * @param {Array} shortcuts - Lista de atalhos
   * @param {Object} callbacks - Callbacks para ações nos atalhos
   */
  renderShortcuts(shortcuts, { onApply, onEdit, onDelete, onReorder }) {
    if (!this.listContainer) return;

    this.shortcuts = shortcuts;
    this.shortcutItems = [];
    this.onReorderCallback = onReorder;
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
        this.shortcutItems[index] = item;
      }
    });

    const allItems = this.listContainer.querySelectorAll('.shortcut-item');
    allItems.forEach((container, index) => {
      this._setupDragAndDrop(container, index);
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

  /**
   * Configura event listeners de drag and drop para um item
   * @private
   * @param {HTMLElement} element - Elemento do item
   * @param {number} index - Índice do item
   */
  _setupDragAndDrop(element, index) {
    element.addEventListener('dragstart', (e) => {
      this.draggedElement = element;
      this.draggedIndex = index;
      element.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
      console.log('Drag started:', index);
    });

    element.addEventListener('dragend', (e) => {
      element.classList.remove('dragging');
      this.draggedElement = null;
      this.draggedIndex = null;

      const allItems = this.listContainer.querySelectorAll('.shortcut-item');
      allItems.forEach(item => item.classList.remove('drag-over'));
      console.log('Drag ended');
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      if (this.draggedElement && this.draggedElement !== element) {
        element.classList.add('drag-over');
      }
      return false;
    });

    element.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (this.draggedElement && this.draggedElement !== element) {
        element.classList.add('drag-over');
      }
    });

    element.addEventListener('dragleave', (e) => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('Drop event fired');
      element.classList.remove('drag-over');

      if (this.draggedElement && this.draggedElement !== element) {
        const targetIndex = parseInt(element.dataset.index);

        console.log('Reordering from', this.draggedIndex, 'to', targetIndex);

        if (this.draggedIndex !== null && targetIndex !== null &&
          this.draggedIndex !== targetIndex) {
          if (this.onReorderCallback) {
            this.onReorderCallback(this.draggedIndex, targetIndex);
          }
        }
      }

      return false;
    });
  }
}

export default EditArea;
