/**
 * Componente para item de atalho na lista de edição
 */

import { createFromTemplate } from '../utils/dom.js';

class ShortcutItem {
  /**
   * @param {Object} shortcut - Dados do atalho
   * @param {number} index - Índice do atalho
   * @param {Function} onApply - Callback para aplicar atalho
   * @param {Function} onEdit - Callback para editar atalho
   * @param {Function} onDelete - Callback para deletar atalho
   */
  constructor(shortcut, index, { onApply, onEdit, onDelete }) {
    this.shortcut = shortcut;
    this.index = index;
    this.onApply = onApply;
    this.onEdit = onEdit;
    this.onDelete = onDelete;

    this.element = this._createElement();
    this.containerElement = null;
  }

  /**
   * Cria elemento DOM do item
   * @private
   * @returns {DocumentFragment}
   */
  _createElement() {
    const clone = createFromTemplate('shortcut-item-template');
    if (!clone) return null;

    const itemElement = clone.querySelector('.shortcut-item');
    const iconElement = clone.querySelector('.shortcut-icon');
    const nameTextElement = clone.querySelector('.shortcut-name-text');
    const autoExecuteBadge = clone.querySelector('.auto-execute-badge');
    const applyButton = clone.querySelector('[data-action="apply"]');
    const editButton = clone.querySelector('[data-action="edit"]');
    const deleteButton = clone.querySelector('[data-action="delete"]');

    if (itemElement) {
      itemElement.draggable = true;
      itemElement.dataset.index = this.index;
      this.containerElement = itemElement;
    }

    const iconName = this.shortcut.icon 
      ? `bi-${this.shortcut.icon}` 
      : 'bi-link-45deg';
    iconElement.className = `bi ${iconName} icon-element`;

    const displayName = this.shortcut.name || `Shortcut ${this.index + 1}`;
    if (nameTextElement) {
      nameTextElement.textContent = displayName;
    }
    applyButton.title = displayName;

    if (this.shortcut.autoExecute && autoExecuteBadge) {
      autoExecuteBadge.classList.remove('hidden');
    }

    this.applyButton = applyButton;

    if (applyButton) {
      applyButton.addEventListener('click', () => {
        if (this.onApply) this.onApply(this.shortcut, this.index);
      });
    }

    if (editButton) {
      editButton.addEventListener('click', () => {
        if (this.onEdit) this.onEdit(this.shortcut, this.index);
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        if (this.onDelete) this.onDelete(this.shortcut, this.index);
      });
    }

    return clone;
  }

  /**
   * Retorna elemento DOM
   * @returns {DocumentFragment}
   */
  getElement() {
    return this.element;
  }

  /**
   * Retorna o botão de aplicar atalho
   * @returns {HTMLElement}
   */
  getApplyButton() {
    return this.applyButton;
  }

  /**
   * Retorna o elemento container do item
   * @returns {HTMLElement}
   */
  getContainer() {
    return this.containerElement;
  }
}

export default ShortcutItem;
