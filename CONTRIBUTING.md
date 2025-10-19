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
        ├── background.js              # Service Worker (auto-execução)
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
main.js (popup)          background.js (service worker)
  ↓                              ↓
UIManager (coordena tudo)   Auto-execução de atalhos
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
| **main.js** | Inicialização do popup | UIManager |
| **background.js** | Service Worker para auto-execução | Chrome APIs |

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

#### Auto-Execução de Atalhos
```
User navega para página
       ↓
chrome.tabs.onUpdated (background.js)
       ↓
checkAndApplyAutoExecuteShortcuts()
  ├─ Verifica se tab não é restaurada
  ├─ Carrega atalhos com autoExecute=true
  ├─ Testa regex contra URL
  └─ Verifica loop prevention
       ↓
applyShortcutToTab()
  ├─ Aplica regex e substitui $1, $2...
  └─ Navega (mesma aba ou nova)
```

**Proteção de Sessão Restaurada:**
- Marca todas as abas existentes ao iniciar/atualizar extensão
- Ignora auto-execução nessas abas por 10 segundos
- Previne redirecionamentos indesejados ao restaurar sessão

## 🎯 Princípios

- **SoC**: Utils não conhecem negócio, Services não mexem no DOM, Components comunicam via callbacks
- **Encapsulamento**: Cada componente gerencia seu estado
- **ES6 Modules**: Imports explícitos (exceto background.js), facilita manutenção
- **SRP**: Um módulo = uma responsabilidade
- **Segurança**: Validação de loops e proteção contra redirecionamentos acidentais

## 🚀 Funcionalidades Principais

### Auto-Execução (Background Service Worker)

A extensão possui um sistema de auto-execução que monitora navegação e aplica atalhos automaticamente:

**Como funciona:**
1. Atalhos marcados com `autoExecute: true` são monitorados pelo `background.js`
2. Quando uma página carrega (`chrome.tabs.onUpdated`), verifica se corresponde ao padrão regex
3. Se corresponder, aplica o atalho automaticamente (redirecionamento)

**Proteções:**
- **Loop Prevention:** Detecta se o destino também corresponderia ao padrão (causaria loop infinito)
- **Session Restore Protection:** Ignora abas restauradas por 10 segundos ao iniciar o navegador
- **Ignore Chrome URLs:** Não processa páginas internas do Chrome

**⚠️ Limitações Técnicas:**
- `background.js` roda como Service Worker (Manifest V3)
- Service Workers NÃO suportam ES6 imports
- Funções utilitárias são **duplicadas** de `shortcutService.js`
- **Manter sincronizado:** Ao modificar validações em `shortcutService.js`, atualizar cópias em `background.js`

### Import/Export de Atalhos

A extensão permite exportar e importar atalhos em formato JSON:

**Exportar:**
- Clique no botão de download (⬇️) no modo de edição
- Gera arquivo `regex-shortcuts-backup.json` com todos os atalhos

**Importar:**
- Clique no botão de upload (⬆️) no modo de edição
- Selecione arquivo JSON válido
- Atalhos são **mesclados** (IDs novos são gerados, evita duplicatas)

**Formato JSON:**
```json
{
  "shortcuts": [
    {
      "id": 1234567890,
      "name": "Nome do Atalho",
      "icon": "gear",
      "pattern": "https://example\\.com/(.*)",
      "target": "https://staging\\.example\\.com/$1",
      "openNewTab": false,
      "autoExecute": false
    }
  ]
}
```

### Reordenação de Atalhos (Drag & Drop)

Os atalhos podem ser reordenados no modo de edição:

**Como funciona:**
1. Arraste um atalho pelo handle (☰) no modo de edição
2. Solte sobre outro atalho para reposicionar
3. A ordem é salva automaticamente no Chrome Storage

**Implementação:**
- `EditArea.js`: Gerencia eventos `dragstart`, `dragover`, `drop`
- `storage.reorderShortcuts()`: Reorganiza array e persiste
- Feedback visual durante drag (classes CSS `dragging`, `drag-over`)

## � Modelo de Dados

### Estrutura de um Atalho

```javascript
{
  id: Number,           // Timestamp único gerado ao criar
  name: String,         // Nome descritivo (obrigatório)
  icon: String,         // Nome do ícone Bootstrap (opcional, padrão: "link-45deg")
  pattern: String,      // Regex para capturar URL (obrigatório)
  target: String,       // URL de destino com $1, $2... (obrigatório)
  openNewTab: Boolean,  // Abre em nova aba? (padrão: false)
  autoExecute: Boolean  // Auto-executa ao navegar? (padrão: false)
}
```

### Armazenamento

- **API:** `chrome.storage.sync`
- **Chave:** `shortcuts`
- **Valor:** Array de objetos de atalhos
- **Limite:** 8KB por item (limite do Chrome Sync Storage)
- **Sincronização:** Automática entre dispositivos com mesma conta Chrome

## �🔧 Setup e Desenvolvimento

1. Clone o repo e abra no Chrome (`chrome://extensions/` → Modo desenvolvedor → Carregar sem compactação)
2. Edite arquivos em `src/js/`
3. Recarregue extensão e teste
4. Debug: Botão direito no ícone → Inspecionar popup

### Adicionar Funcionalidade

**Novo componente:** Crie em `src/js/components/`, importe no UIManager, inicialize no constructor

**Nova validação:** Adicione lógica em `shortcutService.validateShortcut()`

**Nova utilidade:** Adicione função em `utils/` apropriado (dom, storage, chrome)

**Modificar background.js:** 
- ⚠️ **IMPORTANTE:** `background.js` NÃO suporta ES6 imports (limitação do Chrome Manifest V3)
- Funções duplicadas de `shortcutService.js` devem ser mantidas sincronizadas manualmente
- Teste sempre o funcionamento da auto-execução após modificações

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

Antes de commitar, teste:

### Funcionalidades Básicas
- ✅ Criar/editar/deletar atalhos
- ✅ Aplicar regex válida/inválida
- ✅ Mensagens de feedback
- ✅ Alternar entre modos (normal/edição)
- ✅ Verificar console do popup

### Auto-Execução
- ✅ Atalhos com `autoExecute=true` são aplicados automaticamente
- ✅ Proteção de sessão restaurada (não redireciona abas existentes ao iniciar extensão)
- ✅ Prevenção de loops (detecta quando regex corresponde ao destino)
- ✅ Console do background worker (`chrome://extensions/` → "Service Worker")

### Debug
- **Popup:** Botão direito no ícone → Inspecionar popup
- **Background:** `chrome://extensions/` → Clique em "Service Worker"

## 🤝 Contribuindo

### Processo de Contribuição

1. Fork o projeto
2. Crie branch (`git checkout -b feature/MinhaFeature`)
3. Faça mudanças seguindo os padrões
4. Teste funcionalidades
5. Commit (`git commit -m 'feat: adiciona MinhaFeature'`)
6. Push (`git push origin feature/MinhaFeature`)
7. Abra Pull Request

### Convenções de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit:

```
tipo(escopo): descrição curta

[corpo opcional]
```

**Tipos:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Manutenção, configuração, dependências

**Exemplos:**
```bash
git commit -m "feat: adiciona sistema de auto-execução"
git commit -m "fix: corrige loop detection no background.js"
git commit -m "docs: atualiza CONTRIBUTING.md com novos fluxos"
git commit -m "refactor: separa validação em funções menores"
```

## 📚 Recursos

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Regex Tester](https://regex101.com/)

---
