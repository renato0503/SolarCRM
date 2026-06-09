# Contexto do Projeto - SolarCRM

Este documento apresenta um resumo consolidado de tudo o que já foi implementado no **SolarCRM** e quais são os próximos passos sugeridos para levar a aplicação ao ambiente de produção.

---

## 📅 O que já foi FEITO

### 1. Fundação e Estrutura do Projeto (Fase 1)
- **Scaffolding**: Inicialização da estrutura de arquivos utilizando Vite com template Vanilla JS (`npm create vite`).
- **Organização Modular**: Criação de diretórios estruturados para separar o código CSS (`src/css`) e o código de lógica JS (`src/js`).
- **Vite Multi-page**: Configuração do arquivo `vite.config.js` para suportar o empacotamento Rollup de múltiplas páginas independentes:
  - `index.html` (Simulador de Leads)
  - `proposta.html` (Apresentação Comercial)
  - `login.html` (Acesso do Vendedor)
  - `dashboard.html` (CRM de Vendas)

### 2. Lógica de Negócio e Dimensionamento Solar (Fase 2)
- **Banco de Equipamentos (`equipamentos.js`)**: Cadastro local estruturado contendo especificações técnicas e preços de custo de módulos fotovoltaicos (550W), inversores grid-tie de diversas potências, kits de fixação estrutural e custos estimados de engenharia e instalação.
- **Configurações Dinâmicas (`config.js`)**: Parametrização dos coeficientes globais de cálculo (Horas de Sol Pleno - HSP, Tarifa média de energia da distribuidora e Margem de Lucro global aplicada) salvos no `localStorage`.
- **Módulo de Cálculo (`calculator.js`)**: Algoritmo que recebe o consumo em kWh e calcula:
  - Potência ideal do sistema (kWp).
  - Quantidade de painéis solares necessários.
  - Seleção otimizada do modelo de inversor.
  - Subtotal de custo do kit, serviços e preço final com a margem de lucro.
  - Estimativa de geração mensal de energia, economia anual e tempo de retorno do investimento (Payback).

### 3. Apresentação Comercial Visual da Proposta (Fase 3)
- **Interface da Proposta (`proposta.html`)**: Tela com design limpo e moderno (modo claro padrão) otimizada para o cliente.
- **Animações Fluidas (`proposta.js` + Motion One)**:
  - Contagem animada numérica de 0 até o valor final da economia anual.
  - Fade-in e slide-up dos painéis de especificações técnicas e impacto ecológico.
- **Geração de PDF**: Integração da biblioteca `html2pdf.js` para exportar a proposta comercial formatada com apenas 1 clique, ocultando botões interativos através de regras de impressão CSS.

### 4. Integração com WhatsApp (Fase 4)
- **Gerador de Mensagem Inteligente**: Função que formata automaticamente os dados da proposta (kWp, geração, economia anual, preço final e payback) em um texto persuasivo enriquecido com emojis e quebras de linha.
- **Transição de Status Automatizada**: No clique de disparo do WhatsApp, a proposta atualiza automaticamente no banco de dados para o status **"Enviado"** e redireciona o vendedor para a API do WhatsApp.

### 5. CRM, Autenticação e Configurações (Fase 5)
- **Painel Administrativo (`dashboard.html` & `dashboard.js`)**: Tela em tema escuro premium para gestão comercial:
  - Painel de indicadores de desempenho (Total de Leads, Propostas Enviadas, Quantidade de Fechados e Faturamento Total do CRM).
  - Tabela com filtros rápidos por status (Novos, Enviados, Fechados, Perdidos) e barra de pesquisa dinâmica.
  - Menu de Ações rápidas por lead: Ver Proposta, Disparar WhatsApp e Excluir Lead.
  - Dropdowns internos à tabela para modificação imediata de status.
  - Modal de configurações onde o usuário altera os valores do `config.js` diretamente da interface.
- **Controle de Acesso (`auth.js` & `login.html`)**: Controle de sessão usando Firebase Auth com rotas e telas de login protegidas por guards de rota.
- **Segurança de Banco de Dados (`firestore.rules`)**: Regras para o Firestore protegendo leitura e escrita de leads/propostas, garantindo integridade das informações do CRM.
- **MockDB Fallback (`firebase.js`)**: Mecanismo inteligente de fallback. Caso não existam chaves de conexão do Firebase ativas no ambiente, a aplicação utiliza automaticamente um banco mockado no `localStorage`, permitindo rodar e testar 100% das funções do CRM de forma imediata e sem erros.

### 6. Configuração e Publicação no GitHub Pages (MVP) (Fase 6)
- **Vite Subdirectory Base**: Adicionado o parâmetro `base: '/SolarCRM/'` em `vite.config.js` para suportar corretamente arquivos compilados sob subpastas.
- **Caminhos Relativos Portáveis**: Substituição de todas as referências de caminhos absolutos (`/`) para relativos (`./`) nas páginas HTML e arquivos JavaScript, garantindo a portabilidade completa de rotas, redirecionamentos e assets.
- **Segurança e Proteção de Chaves**: Regras configuradas em `.gitignore` para proibir commits de arquivos `.env` e `.env.*` locais, evitando o vazamento acidental de chaves privadas do Firebase.
- **Automação de Build e Deploy**: Configuração do pacote `gh-pages` e scripts `"predeploy"` e `"deploy"` no `package.json` para compilação (`dist/`) e deploy automático da aplicação na branch `gh-pages` do repositório remoto.
- **Publicação no GitHub**: Inicialização do Git, vinculação com o remote `renato0503/SolarCRM` e push sincronizado das branches `main` e `gh-pages`.

### 7. Cálculo de Frete por CEP e Robustez de PDF (Fase 7)
- **CEP no Formulário**: Campo de endereço do simulador substituído por CEP com máscara automática (`99999-999`) e validação estrita.
- **Cálculo de Distância por Geolocalização**: Integração assíncrona com API ViaCEP (para puxar Cidade e UF) e Nominatim OpenStreetMap (para achar a latitude/longitude do CEP e do Centro da Cidade correspondente), calculando a distância física entre os dois pontos em linha reta pela fórmula de Haversine.
- **Isolamento de Falhas de Geocodificação (Correção Cuiabá/MT)**: Refatorado o calculador de frete para tratar a API Nominatim de geolocalização física separadamente. Com isso, mesmo se o Nominatim falhar (ex: limites de taxa), a Cidade e UF do ViaCEP são **sempre preservados** na proposta e no lead (exibindo Cuiabá/MT de forma confiável para o CEP `78005-400`).
- **Tabela de Frete Proporcional**: Inclusão de três faixas de frete no arquivo `equipamentos.js` integradas diretamente na planilha de custo direto do simulador em `calculator.js`:
  - Até 15 km: R$ 350,00 (mínimo)
  - De 15 km a 25 km: R$ 650,00 (médio)
  - Acima de 25 km: R$ 1.100,00 (máximo)
- **Salvaguarda de Falha em API**: Estrutura com fallbacks que garante a continuação do cálculo de frete (com distância padrão de 10km e frete mínimo) caso o cliente esteja sem conexão ou as APIs geográficas caiam.
- **Robustez na Emissão do PDF (Correção de Travamento e Integridade)**:
  * Removidos atributos obsoletos de `integrity` e `crossorigin` do script CDN `html2pdf.js` que causavam bloqueio de carregamento no navegador.
  * Importação explícita de `showToast` em `proposta.js` para sanar erros de referência indefinida.
  * Utilização de bloco `try-catch-finally` que obriga o corpo do documento a sempre remover a classe de estilização temporária de impressão (`.pdf-mode`), evitando que a tela fique travada após a geração do arquivo.
  * Inclusão de atraso de 150ms antes da captura do PDF para permitir a repintura do DOM no navegador.
  * Integração de **fallback automático de impressão nativa (`window.print()`)** caso a biblioteca `html2pdf` falhe ou não seja carregada no navegador do usuário, com layout de 2 páginas A4 perfeitamente formatadas.
- **Descritivo Detalhado de Valores e Taxa Local**:
  * Adicionado cálculo de preços comerciais de venda unitários (com margem de lucro aplicada) para Módulos, Inversor, Estrutura, Serviços e Frete.
  * Inclusão de uma **taxa local de deslocamento de instalação** baseada na quilometragem calculada (R$ 0,00 até 15km; R$ 250,00 de 15 a 25km; R$ 450,00 acima de 25km) somada nos serviços.
  * Exibição estruturada dessas informações por HTML dinâmico sob cada item da especificação técnica em `proposta.html`, detalhando o valor individual e informando a presença da taxa de deslocamento no bloco de Serviços.
  * Área de assinaturas formais de aceite para o PDF ao final do documento `proposta.html` preenchendo automaticamente o nome do cliente.

### 8. Aprimoramento e Resolução da API de CEP (Fase 8)
- **Dicionário Local de Capitais**: Criação de um cache local com as coordenadas das principais capitais brasileiras (como Cuiabá e Campo Grande), o que otimiza a performance de geolocalização e previne rate-limiting do Nominatim (OpenStreetMap).
- **Fallback Inteligente de APIs**: Encadeamento de requisições que consulta primeiramente o ViaCEP e migra automaticamente para a BrasilAPI caso haja falhas na primeira, assegurando alta taxa de sucesso.
- **Detector de Região por Prefixo**: Criação de um algoritmo inteligente baseado nas faixas de CEP brasileiras que determina o Estado e a Capital do CEP inserido instantaneamente, garantindo a correção de dados (ex. CEP `78005-400` resolvido para Cuiabá/MT) mesmo com falha total de rede ou APIs off-line.

### 9. Otimização do Layout e Dimensões do PDF (Fase 9)
- **Compactação Geral de Margens, Paddings e Fontes**: Dimensionamento preciso de tipografia e espaçamentos sob a classe `body.pdf-mode` (para PDF gerado por biblioteca) e diretivas `@media print` (para impressão nativa do navegador). As fontes do cabeçalho e dos valores em destaque foram reduzidas e otimizadas para escala A4 corporativa.
- **Preservação de Layout Multicolunas**: Forçado o posicionamento rígido de 3 colunas para os destaques financeiros. A especificação técnica (`#cardSpecs`) agora utiliza um grid de 2 colunas para organizar os itens (Módulos, Inversor, Estrutura e Logística lado a lado; e Serviços ocupando a largura total), reduzindo a altura do card pela metade e mantendo o alinhamento impecável.
- **Evitar Quebras de Páginas em Branco**: Resolução do espaçamento excessivo reorganizando o fluxo vertical das páginas para caber exatamente em 2 páginas A4.
- **Enquadramento Perfeito em Exatamente 2 Páginas**: Injeção estratégica de diretivas CSS para controle de quebras de página (`break-before: page` e `break-inside: avoid`). O documento foi ajustado milimetricamente para se dividir entre a Página 1 (Cabeçalho, Visão Geral, Valores e Especificações de Módulos/Instalação) e a Página 2 (Métricas Ecológicas/Geração, Dicas Solar e Assinaturas), eliminando qualquer transbordo acidental e páginas em branco.
- **Área de Assinaturas Alinhada**: Formatação da seção de assinaturas corporativa/cliente em blocos horizontais paralelos (`flex-box` balanceado) perfeitamente posicionados ao rodapé da segunda página.

### 10. Arquitetura Isolada de Impressão (`pdf.html`) (Fase 10)
- **Criação do Template Dedicado**: Implementação do arquivo `pdf.html` e sua lógica de carregamento assíncrono em `src/js/pdf.js`, operando de forma isolada da página interativa `proposta.html`. Isso previne deformações de layout decorrentes de responsividade do navegador ou estilos dinâmicos da tela.
- **Páginas A4 Rígidas sem Transbordo**: Redução da altura da folha `.pdf-page` no CSS para `296mm` (um milímetro menor que o A4 padrão) para absorver eventuais erros de arredondamento de pixels dos navegadores e da biblioteca `html2pdf.js`. Isso evita quebras automáticas de linha que criavam páginas em branco entre as seções.
- **Remoção de Páginas Trilhantes**: Configuração da regra `:not(:last-child)` na diretiva `page-break-after: always` e inclusão do parâmetro `pagebreak: { mode: 'css' }` nas configurações da biblioteca. Com isso, o PDF encerra exatamente no término da segunda página, eliminando qualquer folha em branco residual.
- **Vite Bundler Integrado**: Adicionado o ponto de entrada `pdf.html` em `vite.config.js` para garantir que o compilador do Vite compacte e gere as referências relativas do template de exportação de forma idêntica às demais telas.
- **Download Inteligente**: Ao clicar em "Baixar PDF" na proposta, a aba `pdf.html` é aberta, carrega os dados reais, gera a exportação através de `html2pdf.js` e se fecha de maneira invisível e automatizada.

---

## 📋 O que FALTA fazer

Como a lógica e interface da aplicação já estão totalmente prontas e funcionais, os próximos passos concentram-se em infraestrutura, parametrização e publicação comercial:

### 1. Configuração do Projeto no Firebase Console (Infraestrutura)
- [ ] Criar um projeto no console do Firebase (https://console.firebase.google.com).
- [ ] Ativar o **Cloud Firestore** em modo de produção na região mais adequada.
- [ ] Ativar o **Firebase Authentication** com provedor de e-mail e senha.
- [ ] Criar a conta de vendedor padrão no painel do Authentication para permitir o login corporativo inicial.

### 2. Ativação das Variáveis de Ambiente (Conexão Firebase Real)
- [ ] Copiar o arquivo `.env.example` para `.env` ou `.env.local` na raiz do projeto.
- [ ] Substituir os valores fictícios pelas chaves reais do SDK do Web App gerado no console do Firebase.
- [ ] Reiniciar o servidor de desenvolvimento para aplicar a conexão real.

### 3. Migração do GitHub Pages para Produção Oficial (Opcional)
- [ ] O GitHub Pages servirá perfeitamente para testes e homologação como MVP. Se desejar usar o domínio customizado da empresa com SSL ou hospedar regras estritas integradas diretamente no CLI do Firebase, seguir os passos de Deploy em Produção (Firebase Hosting) listados a seguir.

### 4. Deploy de Produção (Firebase Hosting)
- [ ] Instalar a CLI do Firebase globalmente:
  ```bash
  npm install -g firebase-tools
  ```
- [ ] Fazer login no terminal:
  ```bash
  firebase login
  ```
- [ ] Inicializar o projeto no diretório raiz:
  ```bash
  firebase init
  ```
  *(Selecionar as opções: **Hosting** e **Firestore Rules**; apontar a pasta pública de deploy como `dist`)*
- [ ] Fazer o build dos assets otimizados:
  ```bash
  npm run build
  ```
- [ ] Publicar o app na URL gratuita com HTTPS fornecida pelo Firebase Hosting:
  ```bash
  firebase deploy
  ```

### 5. Melhorias e Funcionalidades Adicionais (Sugestões)
- [ ] **Integração com Gráfico de Geração**: Incluir a biblioteca `Chart.js` na página da proposta comercial para exibir a projeção de geração solar mês a mês em formato de gráfico de barras.
- [ ] **Recuperação de Senha**: Adicionar o fluxo de "Esqueci minha senha" na tela de login para enviar e-mail de redefinição pelo Firebase Auth.
- [ ] **Banco de Equipamentos no Firestore**: Mover o array de equipamentos do arquivo local `equipamentos.js` para uma coleção no Firestore, possibilitando ao dono da empresa atualizar preços de inversores e módulos em tempo real sem precisar recompilar ou alterar o código do front-end.
- [ ] **Histórico e Relatório de Distâncias de Frete**: Armazenar métricas de distâncias calculadas por CEP no Firestore para ajudar a gerência a mapear áreas de atuação com mais vendas e ajustar os multiplicadores de frete.
- [ ] **Preview Visual do PDF**: Criar um painel de preview interativo diretamente na interface do administrador para permitir ajustes visuais rápidos antes de realizar o download ou impressão.
