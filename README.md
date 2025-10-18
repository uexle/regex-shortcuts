# 🔗 Regex Shortcuts - Chrome Extension

Extensão para criar atalhos personalizados baseados em expressões regulares (regex) para navegação rápida entre páginas web.

## � Instalação

1. Clone ou baixe este repositório
2. Abra o Chrome e vá para `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** (canto superior direito)
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta do projeto
6. Pronto! O ícone da extensão aparecerá na barra de ferramentas

## 💡 Como Usar

### Criar um Atalho

1. Clique no ícone da extensão
2. Clique no ícone de engrenagem (⚙️) para entrar no modo de edição
3. Preencha o formulário:
   - **Nome**: Nome descritivo para o atalho (ex: "Ir para Admin")
   - **Ícone**: Nome do ícone Bootstrap (ex: "gear") - opcional
   - **Regex**: Padrão para capturar a URL atual (ex: `https://example.com/item/(\d+)`)
   - **Destino**: URL de destino usando grupos capturados (ex: `https://example.com/admin/item/$1`)
   - **Nova guia**: Marque para abrir em nova aba
4. Clique em **"Adicionar / Atualizar"**

### Usar um Atalho

1. Navegue até uma página que corresponda ao padrão regex do atalho
2. Clique no ícone da extensão
3. Clique no ícone do atalho desejado
4. Você será redirecionado para a URL de destino!

### Exemplos Práticos

#### Exemplo 1: GitHub Issue → Pull Request
```
Regex:    https://github.com/(.+)/(.+)/issues/(\d+)
Destino:  https://github.com/$1/$2/pull/$3
```
Navega de uma issue para o PR de mesmo número.

#### Exemplo 2: Ambiente de Produção → Staging
```
Regex:    https://app\.example\.com/(.*)
Destino:  https://staging\.example\.com/$1
```
Troca entre ambientes mantendo o mesmo caminho.

#### Exemplo 3: YouTube → YouTube Music
```
Regex:    https://www\.youtube\.com/watch\?v=(.+)
Destino:  https://music.youtube.com/watch?v=$1
```
Converte links do YouTube para YouTube Music.

## �📁 Estrutura do Projeto

```
regex-shortcuts/
├── manifest.json              # Configuração da extensão Chrome
├── popup.html                 # Interface HTML do popup
├── styles.css                 # Estilos CSS
├── icon.png                   # Ícone da extensão
├── README.md                  # Este arquivo
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

### Camadas da Aplicação

#### 1. **Utils** (`src/js/utils/`)
Funções utilitárias reutilizáveis sem lógica de negócio:
- **dom.js**: Helpers para manipulação do DOM
- **storage.js**: Interface com Chrome Storage API
- **chrome.js**: Wrapper para APIs do Chrome (tabs, navegação)

#### 2. **Services** (`src/js/services/`)
Lógica de negócio da aplicação:
- **shortcutService.js**: Gerencia CRUD de atalhos, validação e aplicação de regex

#### 3. **Components** (`src/js/components/`)
Componentes de UI reutilizáveis e encapsulados:
- **Message.js**: Sistema de notificações/feedback
- **ShortcutItem.js**: Renderiza item individual de atalho
- **IconBar.js**: Gerencia barra de ícones (modo normal)
- **EditForm.js**: Formulário de adicionar/editar atalhos
- **EditArea.js**: Área de edição com lista de atalhos

#### 4. **UI Manager** (`src/js/ui/`)
Coordenação e orquestração:
- **UIManager.js**: Gerencia estado global, coordena componentes

#### 5. **Entry Point** (`src/js/main.js`)
Inicialização da aplicação

### Fluxo de Dados

```
main.js
  └─> UIManager.init()
       ├─> shortcutService.getAllShortcuts()
       │    └─> storage.loadShortcuts()
       │         └─> Chrome Storage API
       │
       ├─> Renderiza componentes
       │    ├─> IconBar (modo normal)
       │    ├─> EditArea (modo edição)
       │    └─> Message (feedback)
       │
       └─> Event handlers
            └─> shortcutService.applyShortcut()
                 └─> chrome.navigateTo()
```

## 🎯 Princípios de Design

- **Separação de Responsabilidades**: Utils, Services, Components e UI Manager têm papéis distintos
- **Encapsulamento**: Cada componente gerencia seu próprio estado e DOM
- **Modularidade**: Cada arquivo exporta uma funcionalidade específica (ES6 modules)
- **Testabilidade**: Componentes independentes podem ser testados isoladamente

## � Desenvolvimento

### Fazer Mudanças

1. Edite os arquivos em `src/js/`
2. Recarregue a extensão em `chrome://extensions/` (clique no ícone de reload)
3. Teste no popup

### Debug

1. Clique com botão direito no ícone da extensão
2. Selecione **"Inspecionar popup"**
3. Use o Console do DevTools para ver logs e erros

### Adicionar Novo Componente

```javascript
// 1. Criar src/js/components/MyComponent.js
class MyComponent {
  constructor() {
    // Setup
  }
  render(data) {
    // Renderizar
  }
}
export default MyComponent;

// 2. Importar em ui/UIManager.js
import MyComponent from '../components/MyComponent.js';

// 3. Usar no UIManager
this.myComponent = new MyComponent();
```

### Adicionar Nova Validação

```javascript
// Em services/shortcutService.js
export const validateShortcut = (shortcut) => {
  const errors = [];
  
  // Adicione sua validação aqui
  if (minhaCondicao) {
    errors.push('Mensagem de erro');
  }
  
  return { valid: errors.length === 0, errors };
}
```

## � Troubleshooting

### Extensão não carrega
- Verifique se todas as pastas e arquivos estão presentes
- Confira erros em `chrome://extensions/` (clique em "Erros")
- Recarregue a extensão

### Atalho não funciona
- Teste a regex em [regex101.com](https://regex101.com)
- Verifique se a URL atual corresponde ao padrão
- Abra o console do popup para ver erros
- Use `\` para escapar caracteres especiais (ex: `\.` para ponto literal)

### URL não trunca
- Verifique se `styles.css` tem as regras de truncamento
- Force refresh do popup (Ctrl+R no popup aberto)

### Mudanças não aparecem
- Recarregue a extensão em `chrome://extensions/`
- Feche e abra o popup novamente
- Limpe o cache do navegador se necessário

## 📝 Recursos Úteis

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Regex Tester](https://regex101.com/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use ES6+ features
- Mantenha funções pequenas (< 50 linhas)
- Documente com JSDoc
- Siga a estrutura de camadas existente
- Teste manualmente antes de commitar

## 📄 Licença

MIT

## ✨ Créditos

**Desenvolvido por**: Weslei (uexle)  
**Versão**: 2.0.0  
**Data**: Outubro 2025
