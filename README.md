# 🔗 Regex Shortcuts

Extensão Chrome para criar atalhos personalizados baseados em expressões regulares (regex) para navegação rápida entre páginas web.

> 💻 **Desenvolvedor?** Veja [CONTRIBUTING.md](CONTRIBUTING.md) para arquitetura e guia técnico completo.

## 🚀 Instalação

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

## 🐛 Problemas Comuns

### Extensão não carrega
- Verifique se todas as pastas e arquivos estão presentes
- Confira erros em `chrome://extensions/` (clique em "Erros")
- Recarregue a extensão

### Atalho não funciona
- Teste a regex em [regex101.com](https://regex101.com)
- Verifique se a URL atual corresponde ao padrão
- Abra o console do popup para ver erros (botão direito → Inspecionar popup)
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
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Catálogo de ícones disponíveis
- [Regex Tester](https://regex101.com/) - Teste suas regex antes de usar

## 🤝 Contribuindo

Contribuições são bem-vindas! 

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

📖 **Leia o [CONTRIBUTING.md](CONTRIBUTING.md)** para detalhes sobre a arquitetura, padrões de código e guias de desenvolvimento.

## 📄 Licença

MIT

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
