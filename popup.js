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

function renderShortcuts(shortcuts, currentUrl) {
  const container = el('shortcuts-list');
  container.innerHTML = '';
  shortcuts.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'shortcut';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-wrap';
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.title = s.name || `Shortcut ${idx+1}`;
    const iconName = s.icon ? `bi-${s.icon}` : 'bi-link-45deg';
    const i = document.createElement('i');
    i.className = `bi ${iconName}`;
    btn.appendChild(i);
    btn.addEventListener('click', () => applyShortcut(s, currentUrl));
    iconWrap.appendChild(btn);

    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = s.name || `Shortcut ${idx+1}`;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const edit = document.createElement('button');
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => fillFormForEdit(s, idx));

    const del = document.createElement('button');
    del.textContent = 'Excluir';
    del.addEventListener('click', async () => {
      if (!confirm('Deseja realmente excluir este atalho?')) return;
      shortcuts.splice(idx, 1);
      await saveShortcuts(shortcuts);
      init();
    });

    actions.appendChild(edit);
    actions.appendChild(del);

    // if not edit mode, hide actions
    if (!isEditMode) actions.style.display = 'none';

    div.appendChild(iconWrap);
    div.appendChild(nameEl);
    div.appendChild(actions);
    container.appendChild(div);
  });
}

function fillFormForEdit(s, idx) {
  el('name').value = s.name || '';
  el('icon').value = s.icon || '';
  el('pattern').value = s.pattern || '';
  el('target').value = s.target || '';
  el('open-new-tab').checked = !!s.openNewTab;
  el('add-form').dataset.editIndex = idx;
}

async function applyShortcut(s, currentUrl) {
  try {
    const re = new RegExp(s.pattern);
    const m = currentUrl.match(re);
    if (!m) {
      showMessage('A regex não combina com a URL atual.', 'error');
      return;
    }
    // replace $1, $2 with group values
    let dest = s.target;
    for (let i = 1; i < m.length; i++) {
      dest = dest.replace(new RegExp('\\$' + i, 'g'), m[i]);
    }
    // open in new tab or current tab depending on setting
    if (s.openNewTab) {
      chrome.tabs.create({ url: dest });
    } else {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: dest });
      } else {
        chrome.tabs.create({ url: dest });
      }
    }
  } catch (err) {
    showMessage('Erro ao aplicar o atalho: ' + err.message, 'error');
  }
}

function showMessage(text, type = 'info') {
  const m = el('message');
  const mt = el('message-text');
  if (!m) return;
  m.classList.add('visible');
  if (mt) mt.innerHTML = text;
  if (type === 'error') m.style.background = 'rgba(255,60,60,0.06)';
  else m.style.background = 'rgba(255,255,255,0.02)';
  // auto-hide after 5s
  clearTimeout(showMessage._t);
  showMessage._t = setTimeout(() => { m.classList.remove('visible'); }, 5000);
}

async function init() {
  const currentUrl = await getCurrentTabUrl();
  el('current-url').textContent = currentUrl || '(não detectada)';

  const shortcuts = await loadShortcuts();
  renderShortcuts(shortcuts, currentUrl);
  renderIconBar(shortcuts);
}

function renderIconBar(shortcuts) {
  const bar = el('icon-bar');
  bar.innerHTML = '';
  // create icon buttons
  shortcuts.forEach((s, idx) => {
    const b = document.createElement('div');
    b.className = 'icon-btn';
    b.title = s.name || '';
    const iconName = s.icon ? `bi-${s.icon}` : 'bi-link-45deg';
    const i = document.createElement('i');
    i.className = `bi ${iconName}`;
    b.appendChild(i);
  // no label in icon bar buttons (compact)
    b.addEventListener('click', async () => {
      const currentUrl = await getCurrentTabUrl();
      applyShortcut(s, currentUrl);
    });
    bar.appendChild(b);
  });

  // edit pencil button
  const editBtn = document.createElement('div');
  editBtn.className = 'icon-btn';
  // highlight this button differently
  editBtn.classList.add('edit-action');
  editBtn.title = 'Editar atalhos';
  const pi = document.createElement('i');
  pi.className = 'bi bi-pencil';
  editBtn.appendChild(pi);
  // compact edit button (no text label)
  editBtn.addEventListener('click', () => toggleEditMode(true));
  bar.appendChild(editBtn);
}

async function toggleEditMode(on) {
  isEditMode = !!on;
  el('edit-area').style.display = isEditMode ? 'block' : 'none';
  // hide icon-bar when editing
  el('icon-bar').style.display = isEditMode ? 'none' : 'flex';
  const shortcuts = await loadShortcuts();
  const currentUrl = await getCurrentTabUrl();
  renderShortcuts(shortcuts, currentUrl);
}

document.addEventListener('DOMContentLoaded', async () => {
  await init();

  // close edit handler
  const close = el('close-edit');
  if (close) close.addEventListener('click', () => toggleEditMode(false));

  const mClose = el('message-close');
  if (mClose) mClose.addEventListener('click', () => {
    const m = el('message');
    if (m) m.classList.remove('visible');
    clearTimeout(showMessage._t);
  });

  el('add-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = el('name').value.trim();
    const pattern = el('pattern').value.trim();
    const target = el('target').value.trim();
    if (!name || !pattern || !target) return;

    const shortcuts = await loadShortcuts();
    const editIndex = el('add-form').dataset.editIndex;
    const icon = el('icon').value.trim();
    const openNewTab = !!el('open-new-tab').checked;
    const item = { name, icon, pattern, target };
    item.openNewTab = openNewTab;
    if (editIndex !== undefined) {
      shortcuts[Number(editIndex)] = item;
      delete el('add-form').dataset.editIndex;
    } else {
      shortcuts.push(item);
    }
    await saveShortcuts(shortcuts);
    el('add-form').reset();
    await init();
  });
});
