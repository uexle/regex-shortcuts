/**
 * Componente para exibir e gerenciar mensagens de feedback
 */

import { getElement, addClass, removeClass } from '../utils/dom.js';

class Message {
  constructor() {
    this.messageElement = getElement('message');
    this.messageText = getElement('message-text');
    this.closeButton = getElement('message-close');
    this.timeout = null;

    this._setupEventListeners();
  }

  /**
   * Configura event listeners
   * @private
   */
  _setupEventListeners() {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.hide());
    }
  }

  /**
   * Exibe mensagem
   * @param {string} text - Texto da mensagem
   * @param {string} type - Tipo da mensagem ('info' | 'error' | 'success')
   * @param {number} duration - Duração em ms (0 = não oculta automaticamente)
   */
  show(text, type = 'info', duration = 5000) {
    if (!this.messageElement || !this.messageText) return;

    // Limpar timeout anterior
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // Configurar mensagem
    this.messageText.innerHTML = text;
    addClass(this.messageElement, 'visible');

    // Aplicar estilo baseado no tipo
    switch (type) {
      case 'error':
        this.messageElement.style.background = 'var(--error-bg)';
        break;
      case 'success':
        this.messageElement.style.background = 'var(--bg-overlay-light)';
        break;
      default:
        this.messageElement.style.background = 'var(--bg-overlay-light)';
    }

    // Auto-ocultar se duration > 0
    if (duration > 0) {
      this.timeout = setTimeout(() => this.hide(), duration);
    }
  }

  /**
   * Oculta mensagem
   */
  hide() {
    if (!this.messageElement) return;
    
    removeClass(this.messageElement, 'visible');
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * Exibe mensagem de sucesso
   * @param {string} text - Texto da mensagem
   */
  success(text) {
    this.show(text, 'success');
  }

  /**
   * Exibe mensagem de erro
   * @param {string} text - Texto da mensagem
   */
  error(text) {
    this.show(text, 'error');
  }

  /**
   * Exibe mensagem informativa
   * @param {string} text - Texto da mensagem
   */
  info(text) {
    this.show(text, 'info');
  }
}

export default Message;
