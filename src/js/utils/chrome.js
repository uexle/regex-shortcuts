/**
 * Utilitários para API do Chrome/Browser
 */

/**
 * Obtém a URL da aba ativa atual
 * @returns {Promise<string>} URL da aba atual
 */
export const getCurrentTabUrl = async () => {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs && tabs[0] ? tabs[0].url : '';
};

/**
 * Abre URL em nova aba
 * @param {string} url - URL a abrir
 * @returns {Promise<void>}
 */
export const openInNewTab = async (url) => {
  await chrome.tabs.create({ url });
};

/**
 * Atualiza URL da aba atual
 * @param {string} url - Nova URL
 * @returns {Promise<void>}
 */
export const updateCurrentTab = async (url) => {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs && tabs[0]) {
    await chrome.tabs.update(tabs[0].id, { url });
  } else {
    await openInNewTab(url);
  }
};

/**
 * Navega para URL (nova aba ou atual)
 * @param {string} url - URL de destino
 * @param {boolean} newTab - Se true, abre em nova aba
 * @returns {Promise<void>}
 */
export const navigateTo = async (url, newTab = false) => {
  if (newTab) {
    await openInNewTab(url);
  } else {
    await updateCurrentTab(url);
  }
};
