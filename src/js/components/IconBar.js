/**
 * Componente para barra de ícones de atalhos
 */

import { getElement, clearElement, createFromTemplate } from '../utils/dom.js';

class IconBar {
  constructor() {
    this.container = getElement('icon-bar');
    this.shortcuts = [];
    this.iconElements = []; // Armazenar referências dos elementos de ícone
  }

  /**
   * Renderiza a barra de ícones
   * @param {Array} shortcuts - Lista de atalhos
   * @param {Function} onShortcutClick - Callback quando atalho é clicado
   * @param {Function} onEditClick - Callback quando botão de editar é clicado
   */
  render(shortcuts, { onShortcutClick, onEditClick }) {
    if (!this.container) return;

    this.shortcuts = shortcuts;
    this.iconElements = []; // Resetar array de elementos
    clearElement(this.container);

    // Adicionar ícone para cada atalho
    shortcuts.forEach((shortcut, index) => {
      const item = this._createIconItem(shortcut, index, onShortcutClick);
      if (item) {
        const button = item.querySelector('.icon-bar-item');
        this.iconElements[index] = button; // Armazenar referência
        this.container.appendChild(item);
      }
    });

    // Adicionar botão de edição
    const editButton = this._createEditButton(onEditClick);
    if (editButton) this.container.appendChild(editButton);
  }

  /**
   * Cria item de ícone para atalho
   * @private
   * @param {Object} shortcut - Dados do atalho
   * @param {number} index - Índice do atalho
   * @param {Function} onClick - Callback de clique
   * @returns {DocumentFragment}
   */
  _createIconItem(shortcut, index, onClick) {
    const clone = createFromTemplate('icon-bar-item-template');
    if (!clone) return null;

    const item = clone.querySelector('.icon-bar-item');
    const iconElement = clone.querySelector('.bi');

    // Configurar ícone
    const iconName = shortcut.icon 
      ? `bi-${shortcut.icon}` 
      : 'bi-link-45deg';
    iconElement.className = `bi ${iconName} icon-element`;
    item.title = shortcut.name || '';

    // Event listener
    item.addEventListener('click', () => {
      if (onClick) onClick(shortcut, index);
    });

    return clone;
  }

  /**
   * Cria botão de edição
   * @private
   * @param {Function} onClick - Callback de clique
   * @returns {DocumentFragment}
   */
  _createEditButton(onClick) {
    const clone = createFromTemplate('edit-button-template');
    if (!clone) return null;

    const editButton = clone.querySelector('[data-action="toggle-edit"]');
    
    if (editButton) {
      editButton.addEventListener('click', () => {
        if (onClick) onClick();
      });
    }

    return clone;
  }

  /**
   * Mostra a barra de ícones
   */
  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  /**
   * Oculta a barra de ícones
   */
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  /**
   * Marca um ícone como erro (adiciona borda vermelha)
   * @param {number} index - Índice do ícone
   */
  markIconAsError(index) {
    const iconElement = this.iconElements[index];
    if (iconElement) {
      iconElement.classList.add('error');
    }
  }

  /**
   * Remove a marcação de erro de um ícone
   * @param {number} index - Índice do ícone
   */
  clearIconError(index) {
    const iconElement = this.iconElements[index];
    if (iconElement) {
      iconElement.classList.remove('error');
    }
  }
}

export default IconBar;
