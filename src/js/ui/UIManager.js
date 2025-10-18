/**
 * UIManager - Coordena interações entre componentes e serviços
 */

import Message from '../components/Message.js';
import IconBar from '../components/IconBar.js';
import EditArea from '../components/EditArea.js';
import EditForm from '../components/EditForm.js';
import * as shortcutService from '../services/shortcutService.js';
import * as chromeUtil from '../utils/chrome.js';

class UIManager {
  constructor() {
    this.message = new Message();
    this.iconBar = new IconBar();
    this.editArea = new EditArea();
    this.editForm = new EditForm();

    this.isEditMode = false;
    this.currentUrl = '';
    this.shortcuts = [];
  }

  /**
   * Inicializa o gerenciador de UI
   */
  async init() {
    // Carregar URL atual
    this.currentUrl = await chromeUtil.getCurrentTabUrl();

    // Carregar atalhos
    await this.loadShortcuts();

    // Configurar componentes
    this._setupComponents();

    // Renderizar interface inicial
    this.renderNormalMode();
  }

  /**
   * Configura componentes e seus event listeners
   * @private
   */
  _setupComponents() {
    // Configurar área de edição
    this.editArea.init({
      onClose: () => this.toggleEditMode(false)
    });

    // Configurar formulário
    this.editForm.onSubmit(async (data, index) => {
      await this.handleFormSubmit(data, index);
    });
  }

  /**
   * Carrega atalhos do storage
   */
  async loadShortcuts() {
    this.shortcuts = await shortcutService.getAllShortcuts();
  }

  /**
   * Alterna entre modo normal e modo de edição
   * @param {boolean} enable - true para ativar modo de edição
   */
  async toggleEditMode(enable) {
    this.isEditMode = enable;

    // Atualizar URL atual
    this.currentUrl = await chromeUtil.getCurrentTabUrl();

    // Alternar body class
    if (enable) {
      document.body.classList.add('edit-mode');
      this.renderEditMode();
    } else {
      document.body.classList.remove('edit-mode');
      this.renderNormalMode();
    }
  }

  /**
   * Renderiza modo normal (barra de ícones)
   */
  renderNormalMode() {
    this.editArea.hide();
    
    this.iconBar.render(this.shortcuts, {
      onShortcutClick: (shortcut) => this.handleShortcutClick(shortcut),
      onEditClick: () => this.toggleEditMode(true)
    });
    
    this.iconBar.show();
  }

  /**
   * Renderiza modo de edição
   */
  renderEditMode() {
    this.iconBar.hide();
    
    this.editArea.setCurrentUrl(this.currentUrl);
    this.editArea.renderShortcuts(this.shortcuts, {
      onApply: (shortcut) => this.handleShortcutClick(shortcut),
      onEdit: (shortcut, index) => this.handleEdit(shortcut, index),
      onDelete: (shortcut, index) => this.handleDelete(index)
    });
    
    this.editArea.show();
  }

  /**
   * Handler para clique em atalho (aplicar regex)
   * @param {Object} shortcut - Atalho a aplicar
   */
  async handleShortcutClick(shortcut) {
    const currentUrl = await chromeUtil.getCurrentTabUrl();
    const result = await shortcutService.applyShortcut(shortcut, currentUrl);

    if (!result.success) {
      this.message.error(result.error);
    }
  }

  /**
   * Handler para editar atalho
   * @param {Object} shortcut - Atalho a editar
   * @param {number} index - Índice do atalho
   */
  handleEdit(shortcut, index) {
    this.editForm.fill(shortcut, index);
  }

  /**
   * Handler para deletar atalho
   * @param {number} index - Índice do atalho a deletar
   */
  async handleDelete(index) {
    const confirmed = confirm('Deseja realmente excluir este atalho?');
    if (!confirmed) return;

    try {
      await shortcutService.removeShortcut(index);
      await this.loadShortcuts();
      
      // Re-renderizar
      if (this.isEditMode) {
        this.renderEditMode();
      } else {
        this.renderNormalMode();
      }

      this.message.success('Atalho excluído com sucesso!');
    } catch (error) {
      this.message.error('Erro ao excluir atalho: ' + error.message);
    }
  }

  /**
   * Handler para submit do formulário
   * @param {Object} data - Dados do formulário
   * @param {number|null} index - Índice para edição (null para novo)
   */
  async handleFormSubmit(data, index) {
    try {
      const result = await shortcutService.saveShortcut(data, index);

      if (!result.success) {
        // Mostrar erros de validação
        this.message.error(result.errors.join('<br>'));
        return;
      }

      // Atualizar lista
      this.shortcuts = result.shortcuts;

      // Re-renderizar
      this.renderEditMode();

      // Mensagem de sucesso
      const action = index !== null ? 'atualizado' : 'adicionado';
      this.message.success(`Atalho ${action} com sucesso!`);

    } catch (error) {
      this.message.error('Erro ao salvar atalho: ' + error.message);
    }
  }
}

export default UIManager;
