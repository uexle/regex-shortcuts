/**
 * Utilitários para manipulação do DOM
 */

/**
 * Obtém elemento por ID de forma simplificada
 * @param {string} id - ID do elemento
 * @returns {HTMLElement|null}
 */
export const getElement = (id) => document.getElementById(id);

/**
 * Cria elemento a partir de um template
 * @param {string} templateId - ID do template
 * @returns {DocumentFragment|null}
 */
export const createFromTemplate = (templateId) => {
  const template = getElement(templateId);
  if (!template) return null;
  return template.content.cloneNode(true);
};

/**
 * Toggle class em elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {string} className - Nome da classe
 * @param {boolean} force - Forçar adição/remoção
 */
export const toggleClass = (element, className, force = undefined) => {
  if (!element) return;
  element.classList.toggle(className, force);
};

/**
 * Adiciona classe a elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {string} className - Nome da classe
 */
export const addClass = (element, className) => {
  if (!element) return;
  element.classList.add(className);
};

/**
 * Remove classe de elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {string} className - Nome da classe
 */
export const removeClass = (element, className) => {
  if (!element) return;
  element.classList.remove(className);
};

/**
 * Limpa conteúdo HTML de elemento
 * @param {HTMLElement} element - Elemento alvo
 */
export const clearElement = (element) => {
  if (!element) return;
  element.innerHTML = '';
};

/**
 * Define atributo em elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {string} attr - Nome do atributo
 * @param {string} value - Valor do atributo
 */
export const setAttribute = (element, attr, value) => {
  if (!element) return;
  element.setAttribute(attr, value);
};
