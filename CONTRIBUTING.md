# 🛠️ Guia de Contribuição

Documentação técnica para desenvolvedores.

## 📁 Estrutura do Projeto

```
regex-shortcuts/
├── manifest.json              # Configuração da extensão Chrome
├── popup.html                 # Interface HTML do popup
├── styles.css                 # Estilos CSS
├── icon.png                   # Ícone da extensão
├── README.md                  # Documentação para usuários
├── CONTRIBUTING.md            # Este arquivo (para desenvolvedores)
└── src/
    └── js/
        ├── main.js                    # Ponto de entrada da aplicação
        ├── utils/
        │   ├── dom.js                 # Utilitários para manipulação do DOM
        │   ├── storage.js             # Gerenciamento de Chrome Storage
        │   └── chrome.js              # Wrapper para Chrome/Browser APIs
        ├── services/
        │   └── shortcutService.js     # Lógica de negócio dos atalhos
        ├── components/
        │   ├── Message.js             # Sistema de mensagens de feedback
        │   ├── ShortcutItem.js        # Item individual de atalho
        │   ├── IconBar.js             # Barra de ícones (modo normal)
        │   ├── EditForm.js            # Formulário de edição/criação
        │   └── EditArea.js            # Área de edição completa
        └── ui/
            └── UIManager.js           # Coordenador de UI e estado
```

## 🏗️ Arquitetura

### Camadas

```
main.js
  ↓
UIManager (coordena tudo)
  ↓
├─ Components (UI)
├─ Services (lógica de negócio)
└─ Utils (funções auxiliares)
```

| Camada | Responsabilidade | Pode chamar |
|--------|------------------|-------------|
| **Utils** | Funções reutilizáveis sem lógica de negócio | Nada |
| **Services** | Lógica de negócio (validação, regex, CRUD) | Utils |
| **Components** | Renderização e eventos de UI | Utils |
| **UIManager** | Coordenação entre camadas | Tudo |
| **main.js** | Inicialização | UIManager |

### Fluxo de Dados

#### Inicialização
```
User abre extensão
       ↓
main.js executa
       ↓
UIManager.init()
       ↓
shortcutService.getAllShortcuts()
       ↓
storage.loadShortcuts()
       ↓
Chrome Storage API
       ↓
Renderiza IconBar (modo normal)
```

#### Aplicar Atalho
```
User clica em atalho
       ↓
IconBar → callback
       ↓
UIManager.handleShortcutClick()
       ↓
chrome.getCurrentTabUrl()
       ↓
shortcutService.applyShortcut()
  ├─ Valida inputs
  ├─ Aplica regex
  ├─ Substitui $1, $2...
  └─ Retorna URL destino
       ↓
chrome.navigateTo()
       ↓
Navegação no Chrome
```

#### Criar/Editar Atalho
```
User preenche formulário
       ↓
EditForm → onSubmit callback
       ↓
UIManager.handleFormSubmit()
       ↓
shortcutService.saveShortcut()
  ├─ validateShortcut()
  └─ storage.updateShortcut() ou storage.addShortcut()
       ↓
UIManager.loadShortcuts()
       ↓
Re-renderiza EditArea
       ↓
Message.success()
```

## 🎯 Princípios

- **SoC**: Utils não conhecem negócio, Services não mexem no DOM, Components comunicam via callbacks
- **Encapsulamento**: Cada componente gerencia seu estado
- **ES6 Modules**: Imports explícitos, facilita manutenção
- **SRP**: Um módulo = uma responsabilidade

## 🔧 Setup e Desenvolvimento

1. Clone o repo e abra no Chrome (`chrome://extensions/` → Modo desenvolvedor → Carregar sem compactação)
2. Edite arquivos em `src/js/`
3. Recarregue extensão e teste
4. Debug: Botão direito no ícone → Inspecionar popup

### Adicionar Funcionalidade

**Novo componente:** Crie em `src/js/components/`, importe no UIManager, inicialize no constructor

**Nova validação:** Adicione lógica em `shortcutService.validateShortcut()`

**Nova utilidade:** Adicione função em `utils/` apropriado (dom, storage, chrome)

## 📋 Padrões

### JavaScript

**Usar ES6+ features:**
```javascript
// ✅ Bom
const data = await loadData();
const filtered = items.filter(item => item.active);
const { name, icon } = shortcut;

// ❌ Evitar
var data = loadData().then(function(result) { ... });
var filtered = items.filter(function(item) { return item.active; });
var name = shortcut.name;
var icon = shortcut.icon;
```

**Funções pequenas e focadas:**
```javascript
// ✅ Bom - função tem uma responsabilidade
const validateName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  return { valid: true };
};

// ❌ Evitar - função faz muitas coisas
const validateAndSave = (shortcut) => {
  // validação
  // formatação
  // salvamento
  // renderização
  // ...muitas responsabilidades
};
```

**Documentação com JSDoc:**
```javascript
/**
 * Aplica regex no padrão do atalho e navega
 * @param {Object} shortcut - Atalho a aplicar
 * @param {string} currentUrl - URL atual da aba
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const applyShortcut = async (shortcut, currentUrl) => {
  // implementação
};
```

### HTML

**Estrutura semântica:**
```html
<!-- ✅ Bom -->
<section id="edit-area" aria-labelledby="edit-area-title">
  <header class="edit-header">
    <h2 id="edit-area-title">Editar Atalhos</h2>
  </header>
</section>

<!-- ❌ Evitar -->
<div id="edit-area">
  <div class="edit-header">
    <div>Editar Atalhos</div>
  </div>
</div>
```

**Acessibilidade (ARIA):**
```html
<button 
  type="button" 
  aria-label="Fechar edição" 
  title="Fechar edição">
  <i class="bi bi-x-lg" aria-hidden="true"></i>
</button>
```

### CSS

**Variáveis CSS para temas:**
```css
:root {
  --accent: #1f6feb;
  --text-primary: #e6eef8;
}

button {
  background: var(--accent);
  color: var(--text-primary);
}
```

**Classes utilitárias:**
```css
.hidden { display: none !important; }
```

## 🧪 Testes

Antes de commitar, teste: criar/editar/deletar atalhos, aplicar regex válida/inválida, mensagens de feedback, alternar modos, verificar console

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch (`git checkout -b feature/MinhaFeature`)
3. Faça mudanças seguindo os padrões
4. Teste funcionalidades
5. Commit (`git commit -m 'feat: adiciona MinhaFeature'`)
6. Push (`git push origin feature/MinhaFeature`)
7. Abra Pull Request

## 📚 Recursos

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Regex Tester](https://regex101.com/)

---
