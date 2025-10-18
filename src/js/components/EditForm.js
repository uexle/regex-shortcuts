/**
 * Componente para formulário de adicionar/editar atalhos
 */

import { getElement } from '../utils/dom.js';

class EditForm {
  constructor() {
    this.form = getElement('add-form');
    this.nameInput = getElement('name');
    this.iconInput = getElement('icon');
    this.patternInput = getElement('pattern');
    this.targetInput = getElement('target');
    this.openNewTabInput = getElement('open-new-tab');
    this.autoExecuteInput = getElement('auto-execute');
    
    this.editIndex = null;
    this.onSubmitCallback = null;

    this._setupEventListeners();
  }

  /**
   * Configura event listeners
   * @private
   */
  _setupEventListeners() {
    if (!this.form) return;

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleSubmit();
    });
  }

  /**
   * Handler de submit do formulário
   * @private
   */
  _handleSubmit() {
    const data = this.getData();
    
    // Validação básica
    if (!data.name || !data.pattern || !data.target) {
      return;
    }

    if (this.onSubmitCallback) {
      this.onSubmitCallback(data, this.editIndex);
    }

    this.reset();
  }

  /**
   * Obtém dados do formulário
   * @returns {Object}
   */
  getData() {
    return {
      name: this.nameInput?.value.trim() || '',
      icon: this.iconInput?.value.trim() || '',
      pattern: this.patternInput?.value.trim() || '',
      target: this.targetInput?.value.trim() || '',
      openNewTab: this.openNewTabInput?.checked || false,
      autoExecute: this.autoExecuteInput?.checked || false
    };
  }

  /**
   * Preenche formulário com dados de atalho (para edição)
   * @param {Object} shortcut - Dados do atalho
   * @param {number} index - Índice do atalho
   */
  fill(shortcut, index) {
    if (!this.form) return;

    this.nameInput.value = shortcut.name || '';
    this.iconInput.value = shortcut.icon || '';
    this.patternInput.value = shortcut.pattern || '';
    this.targetInput.value = shortcut.target || '';
    this.openNewTabInput.checked = !!shortcut.openNewTab;
    this.autoExecuteInput.checked = !!shortcut.autoExecute;
    
    this.editIndex = index;
  }

  /**
   * Limpa o formulário
   */
  reset() {
    if (this.form) {
      this.form.reset();
    }
    this.editIndex = null;
  }

  /**
   * Define callback para submit
   * @param {Function} callback - Função a ser chamada no submit
   */
  onSubmit(callback) {
    this.onSubmitCallback = callback;
  }

  /**
   * Verifica se está em modo de edição
   * @returns {boolean}
   */
  isEditing() {
    return this.editIndex !== null;
  }
}

export default EditForm;
