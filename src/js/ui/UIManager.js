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
    this.currentUrl = await chromeUtil.getCurrentTabUrl();
    await this.loadShortcuts();
    this._setupComponents();
    this.renderNormalMode();
  }

  /**
   * Configura componentes e seus event listeners
   * @private
   */
  _setupComponents() {
    this.editArea.init({
      onClose: () => this.toggleEditMode(false)
    });

    this.editForm.onValidateLoop((shortcut) => {
      return shortcutService.wouldCauseLoop(shortcut);
    });

    this.editForm.onValidationError((errorMessage) => {
      this.message.error(errorMessage);
    });
    
    this.editForm.onSubmit(async (data, index) => {
      await this.handleFormSubmit(data, index);
    });

    this.editArea.onExport = async () => {
      try {
        const json = await shortcutService.exportShortcuts();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shortcuts.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.message.success('Arquivo exportado com sucesso.');
      } catch (err) {
        this.message.error('Erro ao exportar: ' + err.message);
      }
    };

    this.editArea.onImport = async (jsonText) => {
      try {
        const result = await shortcutService.importShortcuts(jsonText);
        if (!result.success) {
          this.message.error(result.error || 'Erro ao importar arquivo.');
          return;
        }

        await this.loadShortcuts();
        this.renderEditMode();
        this.message.success('Atalhos importados com sucesso.');
      } catch (err) {
        this.message.error('Erro ao importar: ' + err.message);
      }
    };
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

    this.currentUrl = await chromeUtil.getCurrentTabUrl();

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
      onShortcutClick: (shortcut, index) => this.handleShortcutClick(shortcut, index),
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
      onApply: (shortcut, index) => this.handleShortcutClick(shortcut, index),
      onEdit: (shortcut, index) => this.handleEdit(shortcut, index),
      onDelete: (shortcut, index) => this.handleDelete(index),
      onReorder: (fromIndex, toIndex) => this.handleReorder(fromIndex, toIndex)
    });
    
    this.editArea.show();
  }

  /**
   * Handler para clique em atalho (aplicar regex)
   * @param {Object} shortcut - Atalho a aplicar
   * @param {number} index - Índice do atalho
   */
  async handleShortcutClick(shortcut, index) {
    const currentUrl = await chromeUtil.getCurrentTabUrl();
    const result = await shortcutService.applyShortcut(shortcut, currentUrl);

    if (!result.success) {
      this.message.error(result.error);
      
      if (this.isEditMode) {
        this.editArea.markShortcutAsError(index);
      } else {
        this.iconBar.markIconAsError(index);
      }
      
      setTimeout(() => {
        if (this.isEditMode) {
          this.editArea.clearShortcutError(index);
        } else {
          this.iconBar.clearIconError(index);
        }
      }, 3000);
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
        this.message.error(result.errors.join('<br>'));
        return;
      }

      this.shortcuts = result.shortcuts;

      this.renderEditMode();

      const action = index !== null ? 'atualizado' : 'adicionado';
      this.message.success(`Atalho ${action} com sucesso!`);

    } catch (error) {
      this.message.error('Erro ao salvar atalho: ' + error.message);
    }
  }

  /**
   * Handler para reordenar atalhos
   * @param {number} fromIndex - Índice de origem
   * @param {number} toIndex - Índice de destino
   */
  async handleReorder(fromIndex, toIndex) {
    try {
      this.shortcuts = await shortcutService.reorderShortcuts(fromIndex, toIndex);
      
      this.renderEditMode();
      
      this.message.success('Ordem dos atalhos atualizada!');
    } catch (error) {
      this.message.error('Erro ao reordenar atalhos: ' + error.message);
    }
  }
}

export default UIManager;
