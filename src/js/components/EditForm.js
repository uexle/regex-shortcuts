/**
 * Componente para formulário de adicionar/editar atalhos
 */

import { getElement } from '../utils/dom.js';
import * as shortcutService from '../services/shortcutService.js';

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
    this.onValidationErrorCallback = null;

    this._setupEventListeners();
  }

  /**
   * Define callback para erros de validação
   * @param {Function} callback - Função a ser chamada quando houver erro de validação
   */
  onValidationError(callback) {
    this.onValidationErrorCallback = callback;
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
    
    // Validar loop quando auto-execute é marcado
    this.autoExecuteInput?.addEventListener('change', () => {
      this._validateAutoExecute();
    });
    
    // Revalidar quando padrão ou destino mudam (se auto-execute estiver marcado)
    this.patternInput?.addEventListener('input', () => {
      if (this.autoExecuteInput?.checked) {
        this._validateAutoExecute();
      }
    });
    
    this.targetInput?.addEventListener('input', () => {
      if (this.autoExecuteInput?.checked) {
        this._validateAutoExecute();
      }
    });
  }
  
  /**
   * Valida se auto-execute causaria loop
   * @private
   */
  _validateAutoExecute() {
    if (!this.autoExecuteInput?.checked) {
      return;
    }
    
    const pattern = this.patternInput?.value.trim();
    const target = this.targetInput?.value.trim();
    
    if (!pattern || !target) {
      return;
    }
    
    // Validar se o padrão é válido primeiro
    try {
      new RegExp(pattern);
    } catch (error) {
      // Se regex inválida, não validar loop (será validado no submit)
      return;
    }
    
    // Usar a função do service para validar
    const shortcut = { pattern, target };
    
    if (shortcutService.wouldCauseLoop(shortcut)) {
      // Desmarcar checkbox
      this.autoExecuteInput.checked = false;
      
      // Notificar UIManager sobre o erro
      if (this.onValidationErrorCallback) {
        this.onValidationErrorCallback('Auto-execução não permitida: o padrão corresponde ao destino');
      }
    }
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
