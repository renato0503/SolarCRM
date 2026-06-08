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

---

## 📋 O que FALTA fazer

Como a lógica e interface da aplicação já estão totalmente prontas e funcionais, os próximos passos concentram-se em infraestrutura, parametrização e publicação comercial:

### 1. Configuração do Projeto no Firebase Console (Infraestrutura)
- [ ] Criar um projeto no console do Firebase (https://console.firebase.google.com).
- [ ] Ativar o **Cloud Firestore** em modo de produção na região mais adequada.
- [ ] Ativar o **Firebase Authentication** com provedor de e-mail e senha.
- [ ] Criar a conta de vendedor padrão no painel do Authentication para permitir o login corporativo inicial.

### 2. Ativação das Variáveis de Ambiente
- [ ] Copiar o arquivo `.env.example` para `.env` ou `.env.local` na raiz do projeto.
- [ ] Substituir os valores fictícios pelas chaves reais do SDK do Web App gerado no console do Firebase.
- [ ] Reiniciar o servidor de desenvolvimento para aplicar a conexão real.

### 3. Deploy de Produção (Firebase Hosting)
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

### 4. Melhorias e Funcionalidades Adicionais (Sugestões)
- [ ] **Integração com Gráfico de Geração**: Incluir a biblioteca `Chart.js` na página da proposta comercial para exibir a projeção de geração solar mês a mês em formato de gráfico de barras.
- [ ] **Recuperação de Senha**: Adicionar o fluxo de "Esqueci minha senha" na tela de login para enviar e-mail de redefinição pelo Firebase Auth.
- [ ] **Banco de Equipamentos no Firestore**: Mover o array de equipamentos do arquivo local `equipamentos.js` para uma coleção no Firestore, possibilitando ao dono da empresa atualizar preços de inversores e módulos em tempo real sem precisar recompilar ou alterar o código do front-end.
