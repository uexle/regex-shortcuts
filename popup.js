

const el = id => document.getElementById(id);

let isEditMode = false;

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs && tabs[0] ? tabs[0].url : '';
}

function loadShortcuts() {
  return new Promise(resolve => {
    chrome.storage.sync.get({ shortcuts: [] }, data => {
      resolve(data.shortcuts || []);
    });
  });
}

function saveShortcuts(shortcuts) {
  return new Promise(resolve => {
    chrome.storage.sync.set({ shortcuts }, () => resolve());
  });
}

function createShortcutItem(shortcut, index, currentUrl) {
  const template = el('shortcut-item-template');
  const clone = template.content.cloneNode(true);
  
  const iconElement = clone.querySelector('.shortcut-icon');
  const nameElement = clone.querySelector('.shortcut-name');
  const applyButton = clone.querySelector('[data-action="apply"]');
  const editButton = clone.querySelector('[data-action="edit"]');
  const deleteButton = clone.querySelector('[data-action="delete"]');
  const actionsContainer = clone.querySelector('.shortcut-actions');

  // Configurar ícone e nome
  const iconName = shortcut.icon ? `bi-${shortcut.icon}` : 'bi-link-45deg';
  iconElement.className = `bi ${iconName}`;
  nameElement.textContent = shortcut.name || `Shortcut ${index + 1}`;
  applyButton.title = shortcut.name || `Shortcut ${index + 1}`;

  // Adicionar event listeners
  applyButton.addEventListener('click', () => applyShortcut(shortcut, currentUrl));
  editButton.addEventListener('click', () => fillFormForEdit(shortcut, index));
  deleteButton.addEventListener('click', () => deleteShortcut(index));

  // Ocultar ações se não estiver em modo de edição
  if (!isEditMode) {
    actionsContainer.classList.add('hidden');
  }

  return clone;
}

function createIconBarItem(shortcut, index) {
  const template = el('icon-bar-item-template');
  const clone = template.content.cloneNode(true);
  
  const item = clone.querySelector('.icon-bar-item');
  const iconElement = clone.querySelector('.bi');
  
  const iconName = shortcut.icon ? `bi-${shortcut.icon}` : 'bi-link-45deg';
  iconElement.className = `bi ${iconName}`;
  item.title = shortcut.name || '';
  
  item.addEventListener('click', async () => {
    const currentUrl = await getCurrentTabUrl();
    applyShortcut(shortcut, currentUrl);
  });

  return clone;
}

function createEditButton() {
  const template = el('edit-button-template');
  const clone = template.content.cloneNode(true);
  
  const editButton = clone.querySelector('[data-action="toggle-edit"]');
  editButton.addEventListener('click', () => toggleEditMode(true));
  
  return clone;
}

function renderShortcuts(shortcuts, currentUrl) {
  const container = el('shortcuts-list');
  container.innerHTML = '';
  
  shortcuts.forEach((shortcut, index) => {
    const shortcutElement = createShortcutItem(shortcut, index, currentUrl);
    container.appendChild(shortcutElement);
  });
}

function renderIconBar(shortcuts) {
  const bar = el('icon-bar');
  bar.innerHTML = '';
  
  // Adicionar ícones dos atalhos
  shortcuts.forEach((shortcut, index) => {
    const iconBarItem = createIconBarItem(shortcut, index);
    bar.appendChild(iconBarItem);
  });

  // Adicionar botão de edição
  const editButton = createEditButton();
  bar.appendChild(editButton);
  

}

function fillFormForEdit(shortcut, index) {
  el('name').value = shortcut.name || '';
  el('icon').value = shortcut.icon || '';
  el('pattern').value = shortcut.pattern || '';
  el('target').value = shortcut.target || '';
  el('open-new-tab').checked = !!shortcut.openNewTab;
  el('add-form').dataset.editIndex = index;
}

async function deleteShortcut(index) {
  if (!confirm('Deseja realmente excluir este atalho?')) return;
  
  const shortcuts = await loadShortcuts();
  shortcuts.splice(index, 1);
  await saveShortcuts(shortcuts);
  init();
}

async function applyShortcut(shortcut, currentUrl) {
  try {
    const re = new RegExp(shortcut.pattern);
    const match = currentUrl.match(re);
    if (!match) {
      showMessage('A regex não combina com a URL atual.', 'error');
      return;
    }
    
    // Substituir $1, $2 com valores dos grupos
    let destination = shortcut.target;
    for (let i = 1; i < match.length; i++) {
      destination = destination.replace(new RegExp('\\$' + i, 'g'), match[i]);
    }
    
    // Abrir em nova aba ou aba atual dependendo da configuração
    if (shortcut.openNewTab) {
      chrome.tabs.create({ url: destination });
    } else {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: destination });
      } else {
        chrome.tabs.create({ url: destination });
      }
    }
  } catch (err) {
    showMessage('Erro ao aplicar o atalho: ' + err.message, 'error');
  }
}

function showMessage(text, type = 'info') {
  const messageElement = el('message');
  const messageText = el('message-text');
  
  if (!messageElement) return;
  
  messageElement.classList.add('visible');
  if (messageText) messageText.innerHTML = text;
  
  if (type === 'error') {
    messageElement.style.background = 'var(--error-bg)';
  } else {
    messageElement.style.background = 'var(--bg-overlay-light)';
  }
  
  // Auto-ocultar após 5s
  clearTimeout(showMessage._timeout);
  showMessage._timeout = setTimeout(() => {
    messageElement.classList.remove('visible');
  }, 5000);
}

async function toggleEditMode(enable) {
  isEditMode = !!enable;
  const editArea = el('edit-area');
  const iconBar = el('icon-bar');
  const body = document.body;
  
  if (isEditMode) {
    editArea.classList.remove('hidden');
    iconBar.classList.add('hidden');
    body.classList.add('edit-mode');
  } else {
    editArea.classList.add('hidden');
    iconBar.classList.remove('hidden');
    body.classList.remove('edit-mode');
  }
  
  const shortcuts = await loadShortcuts();
  const currentUrl = await getCurrentTabUrl();
  renderShortcuts(shortcuts, currentUrl);
}

async function init() {
  const currentUrl = await getCurrentTabUrl();
  el('current-url').textContent = currentUrl || '(não detectada)';

  const shortcuts = await loadShortcuts();
  renderShortcuts(shortcuts, currentUrl);
  renderIconBar(shortcuts);
}

function setupEventListeners() {
  // Fechar área de edição
  const closeEditButton = el('close-edit');
  if (closeEditButton) {
    closeEditButton.addEventListener('click', () => toggleEditMode(false));
  }

  // Fechar mensagem
  const messageCloseButton = el('message-close');
  if (messageCloseButton) {
    messageCloseButton.addEventListener('click', () => {
      const messageElement = el('message');
      if (messageElement) messageElement.classList.remove('visible');
      clearTimeout(showMessage._timeout);
    });
  }

  // Formulário de adicionar/editar
  const addForm = el('add-form');
  if (addForm) {
    addForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const name = el('name').value.trim();
      const pattern = el('pattern').value.trim();
      const target = el('target').value.trim();
      
      if (!name || !pattern || !target) return;

      const shortcuts = await loadShortcuts();
      const editIndex = addForm.dataset.editIndex;
      const icon = el('icon').value.trim();
      const openNewTab = !!el('open-new-tab').checked;
      
      const shortcutItem = { name, icon, pattern, target, openNewTab };
      
      if (editIndex !== undefined) {
        shortcuts[Number(editIndex)] = shortcutItem;
        delete addForm.dataset.editIndex;
      } else {
        shortcuts.push(shortcutItem);
      }
      
      await saveShortcuts(shortcuts);
      addForm.reset();
      await init();
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await init();
  setupEventListeners();
});
