/**
 * Utilitários para API do Chrome/Browser
 */

/**
 * Normaliza uma URL, adicionando protocolo se necessário
 * @param {string} url - URL a normalizar
 * @returns {string} URL normalizada
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  const trimmed = url.trim();
  
  // Se já tem protocolo, retorna como está
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }
  
  // Se parece um localhost ou IP, adiciona http://
  if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?/.test(trimmed)) {
    return `http://${trimmed}`;
  }
  
  // Se parece um domínio ou caminho web, adiciona https://
  if (/^([a-z0-9-]+\.)+[a-z]{2,}/.test(trimmed) || trimmed.includes('/')) {
    return `https://${trimmed}`;
  }
  
  // Para strings simples sem indicação de URL, usa como busca no Google
  // ou retorna como https:// (pode ser ajustado conforme preferência)
  return `https://${trimmed}`;
};

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
  const normalizedUrl = normalizeUrl(url);
  
  if (newTab) {
    await openInNewTab(normalizedUrl);
  } else {
    await updateCurrentTab(normalizedUrl);
  }
};
