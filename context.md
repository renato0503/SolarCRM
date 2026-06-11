# Contexto do Projeto - Spark

Este documento apresenta um resumo consolidado de tudo o que já foi implementado na **Spark** e quais são os próximos passos sugeridos para levar a aplicação ao ambiente de produção.

---

## 📅 O que já foi FEITO

### 1. Fundação e Estrutura do Projeto (Fase 1)
- **Scaffolding**: Inicialização da estrutura de arquivos utilizando Vite com template Vanilla JS (`npm create vite`).
- **Organização Modular**: Criação de diretórios estruturados para separar o código CSS (`src/css`) e o código de lógica JS (`src/js`).
- **Vite Multi-page**: Configuração do arquivo `vite.config.js` para suportar o empacotamento Rollup de múltiplas páginas independentes.

### 2. Lógica de Negócio e Dimensionamento Solar (Fase 2)
- **Banco de Equipamentos (`equipamentos.js`)**: Cadastro local estruturado contendo especificações técnicas e preços de custo de módulos fotovoltaicos (550W), inversores grid-tie de diversas potências, kits de fixação estrutural e custos estimados de engenharia e instalação.
- **Configurações Dinâmicas (`config.js`)**: Parametrização dos coeficientes globais de cálculo (Horas de Sol Pleno - HSP, Tarifa média de energia da distribuidora e Margem de Lucro global aplicada) salvos no `localStorage`.
- **Módulo de Cálculo (`calculator.js`)**: Algoritmo que recebe o consumo em kWh e calcula potência, painéis, inversor, custos e payback.

### 3. Apresentação Comercial Visual da Proposta (Fase 3)
- **Interface da Proposta (`proposta.html`)**: Tela com design limpo e moderno (modo claro padrão) otimizada para o cliente.
- **Animações Fluidas (`proposta.js` + Motion One)**: Contagem animada numérica e fade-in/slide-up dos painéis.
- **Geração de PDF**: Integração da biblioteca `html2pdf.js` para exportar a proposta formatada.

### 4. Integração com WhatsApp (Fase 4)
- **Gerador de Mensagem Inteligente**: Função que formata automaticamente os dados da proposta em texto persuasivo.
- **Transição de Status Automatizada**: No clique de disparo do WhatsApp, a proposta atualiza para status **"Enviado"**.

### 5. CRM, Autenticação e Configurações (Fase 5)
- **Painel Administrativo (`dashboard.html` & `dashboard.js`)**: Tela em tema escuro premium com:
  - Indicadores de desempenho (Total Leads, Propostas Enviadas, Faturamento, Vendas Fechadas)
  - Tabela com filtros por status e busca dinâmica
  - Ações rápidas: Ver Proposta, WhatsApp, Excluir
  - Modal de configurações
- **Controle de Acesso (`auth.js` & `login.html`)**: Firebase Auth com rotas e telas protegidas.
- **MockDB Fallback (`firebase.js`)**: Fallback automático para localStorage quando Firebase não disponível.

### 6. Configuração e Publicação (Fase 6)
- **Vite Subdirectory Base**: Parâmetro `base: '/SolarCRM/'` para subpastas.
- **Caminhos Relativos Portáveis**: Todas referências absolutas substituídas por relativas.
- **Automação de Deploy**: Scripts `predeploy` e `deploy` com gh-pages.
- **Deploy no Firebase Hosting**: URL produção: `https://solarcrm-60ce1.web.app`

### 7. Cálculo de Frete por CEP e Robustez de PDF (Fase 7)
- **CEP no Formulário**: Campo com máscara automática (`99999-999`) e validação estrita.
- **Cálculo de Distância por Geolocalização**: APIs ViaCEP, BrasilAPI e Nominatim OpenStreetMap.
- **Tabela de Frete Proporcional**: Até 15km (R$ 350), 15-25km (R$ 650), acima de 25km (R$ 1.100).
- **Robustez na Emissão do PDF**: Try-catch-finally, fallback para `window.print()`, 2 páginas A4 perfeitas.
- **Taxa Local de Deslocamento**: R$ 0 (até 15km), R$ 250 (15-25km), R$ 450 (acima de 25km).

### 8. Aprimoramento e Resolução da API de CEP (Fase 8)
- **Dicionário Local de Capitais**: Cache local com coordenadas das capitais brasileiras.
- **Fallback Inteligente de APIs**: ViaCEP → BrasilAPI como fallback.
- **Detector de Região por Prefixo**: Algoritmo baseado nas faixas de CEP brasileiras.

### 9. Otimização do Layout e Dimensões do PDF (Fase 9)
- **Compactação de Margens, Paddings e Fontes**: Dimensionamento preciso para escala A4.
- **Layout Multicolunas**: Grid de 2 colunas para especificações técnicas.
- **Enquadramento Perfeito em 2 Páginas**: CSS para controle de quebras de página.
- **Área de Assinaturas Alinhada**: Flex-box paralelo para rodapé.

### 10. Arquitetura Isolada de Impressão (`pdf.html`) (Fase 10)
- **Template Dedicado**: `pdf.html` isolado da página interativa.
- **Páginas A4 Rígidas**: Altura de 296mm para evitar transbordo.
- **Download Inteligente**: Abre aba `pdf.html`, gera PDF e fecha automaticamente.

### 11. Estratégia de Arquivos Estáticos e Eliminação de Bare Imports (Fase 11)
- **CDN Imports**: Todos os imports via Google GStatic e JSDelivr ESM (sem bare imports).
- **Fallbacks de JSON**: Arquivos `api/leads.json` e `api/propostas.json` como fallback estático.

### 12. Sistema CRM Completo com Kanban e Páginas Públicas (Fase 12)
- **Conexão Firebase Ativa**: Firestore e Analytics ativos.
- **Kanban com 6 colunas**: Novo, Qualificação, Proposta, Negociação, Fechado, Perdido.
- **Drag-and-drop**: Cards arrastáveis entre colunas para atualizar status.
- **Páginas Públicas**: `lead.html`, `historico.html`, `tv.html` sem autenticação.
- **Tabela de Parcelas**: 12x, 24x, 36x, 48x, 60x com taxa de 1,49% a.m.

### 13. Autenticação e Segurança (Fase 13)
- **Recuperação de Senha**: Modal "Esqueci minha senha" no `login.html` com envio via Firebase Auth.
- **Roles e Permissões (RBAC)**:
  - Campo `role` (admin/vendedor) no documento do usuário na coleção `users` do Firestore.
  - Middleware `protegerRota(allowedRoles)` em `auth.js` para verificação de roles.
  - Admin: acesso total (configurações, CRUD equipamentos, todos leads).
  - Vendedor: apenas seus próprios leads.
- **Criação Automática de Profile**: Ao fazer login, cria automaticamente `users/{uid}` com role.
- **Auditoria (`logAudit`)**:
  - Coleção `audit_log` no Firestore para logs de alterações.
  - Funções `auditAction()`, `auditLogin()`, `auditLogout()` em `auth.js`.
  - localStorage para fallback em modo mock.

### 14. Banco de Equipamentos Dinâmico (Fase 14)
- **Migração para Firestore**: Funções `getEquipamentos()`, `saveEquipamento()`, `deleteEquipamento()` em `firebase.js`.
- **Cache em Memória**: `equipamentosCache` com invalidação quando admin edita.
- **Interface de Gestão Admin**: Página `admin/equipamentos.html` com:
  - Lista de equipamentos por tipo (painéis, inversores, estruturas, kits, serviços).
  - Modal de edição com campos dinâmicos.
  - Filtros por categoria.
- **Sincronização com Calculator**: `calculator.js` refatorado para suportar `getEquipamentosLocais()` síncrono com fallback.

### 15. Multi-Vendedores (Fase 15)
- **Atribuição de Leads**: Campos `vendedorId` e `vendedorNome` adicionados aos leads.
- **Auto-atribuição**: Ao criar lead via `app.js`, captura usuário logado como vendedor responsável.
- **Isolamento de Dados**: `dbGetLeads(vendedorId, isAdminUser)` filtra leads por vendedor.
- **Exibição no Dashboard**: Tag visual com nome do vendedor responsável pelo lead.
- **RBAC Funcional**: Vendedores veem apenas seus leads, admins veem todos.

### 16. Gráficos com ApexCharts (Fase 16)
> **Biblioteca usada**: ApexCharts (v3.45.2 via CDN local `src/vendor/apexcharts.min.js`)
- **Proposta (`proposta.html`)**: Gráfico de barras com projeção de geração mensal (12 meses com variação sazonal).
- **Dashboard (`dashboard.html`)**:
  - Gráfico de funil de vendas (barras horizontais por status).
  - Gráfico de faturamento mensal com filtros de período (3M, 6M, 12M).
- **TV (`tv.html`)**: Gráfico de área com crescimento de leads nos últimos 6 meses.
- **Local**: ApexCharts baixado localmente para evitar bloqueios de Tracking Prevention.

### 17. Timeline de Interações (Fase 17)
- **Modelo de Dados**: Coleção `interacoes` no Firestore com campos:
  - `leadId`, `vendedorId`, `vendedorNome`
  - `tipo`: ligacao|whatsapp|email|reuniao|nota
  - `descricao`, `data`, `proximoContato`
- **Interface no Dashboard**: Modal de interações com:
  - Lista cronológica de interações por lead.
  - Formulário para nova interação (tipo, descrição, próximo contato).
  - Ícones por tipo de interação.
- **Botão no Card**: Relógio no dashboard para abrir histórico do lead.
- **Funções `dbAddInteracao()` e `dbGetInteracoes()`** em firebase.js.

### 18. Follow-up e Alertas (Fase 18)
- **Badges Visuais**: Sistema de alertas baseado em dias sem interação:
  - 3+ dias sem contato: badge "👀 Atenção" azul
  - 7+ dias sem contato: badge "⚠️ 7+dias" amarelo
  - 14+ dias sem resposta: badge "❄️ Frio" vermelho
- **Cálculo Inteligente**: Considera data da última interação ou data de criação do lead.
- **Exibição no Kanban e Tabela**: Badges visíveis em ambos os layouts.

---

## 📋 O que FALTA fazer

---

### 🔔 FASE 18 - Automação de Follow-up

#### 18.1 Regras de Alerta ✅
- [x] Lead sem interação há 3 dias: badge "Atenção" azul
- [x] Lead há 7 dias sem contato: badge "⚠️ 7+dias" amarelo
- [x] Lead há 14 dias sem resposta: badge "❄️ Frio" vermelho

#### 18.2 Notificações
- [ ] Firebase Cloud Messaging (FCM) para push
- [ ] Notificação no dashboard ao fazer login
- [ ] Badge no ícone do lead pendente

#### 18.3 Lembrete Automático
- [ ] Agendar lembrete para `proximoContato`
- [ ] Email ou WhatsApp automático (futuro)

---

### 📧 FASE 19 - Integrações

#### 19.1 Email
- [ ] Enviar proposta por email direto do dashboard
- [ ] Template HTML profissional
- [ ] Anexo do PDF

#### 19.2 WhatsApp Business API
- [ ] Resposta automática para mensagens
- [ ] Status de entrega da mensagem
- [ ] Webhook para receber respostas

#### 19.3 Pix/Boleto
- [ ] Gerar carnê de parcelas
- [ ] Links de pagamento via Pix
- [ ] Status: pendente/pago

---

### 🎨 FASE 20 - UI/UX

#### 20.1 Dark/Light Mode ✅
- [x] Toggle no dashboard (botão sol/lua)
- [x] Salvar preferência no localStorage (key: solarcrm_theme)
- [x] Respeita preferência do sistema inicialmente

#### 20.2 Skeleton Loading ✅
- [x] Skeleton CSS com animação shimmer
- [x] Substituir spinners genéricos por placeholders de tabela
- [x] Feedback visual durante fetch no dashboard

#### 20.3 Preview PDF
- [ ] Modal com preview antes de baixar
- [ ] Botões: Baixar PDF, Imprimir, Enviar Email

#### 20.4 Configurações com Preview
- [ ] Sliders de HSP, Tarifa, Margem com preview em tempo real
- [ ] Testar cálculo instantâneo

---

### 📱 FASE 21 - PWA

#### 21.1 Service Worker
- [ ] Cache de assets estáticos
- [ ] Funcionar offline (read-only)
- [ ] Atualizar quando nova versão disponível

#### 21.2 "Instalar App"
- [ ] Prompt de install native
- [ ] Ícone na home screen

#### 21.3 Push Notifications
- [ ] Solicitar permissão
- [ ] Receber notificações de novos leads

---

### ⚡ FASE 22 - Performance

#### 22.1 Paginação
- [ ] Infinite scroll no Kanban
- [ ] Limite de 50 leads por load
- [ ] Botão "Carregar mais"

#### 22.2 Índices Firestore
- [ ] Criar índice composto para buscas:
  - `vendedorId` + `status`
  - `createdAt` + `status`

#### 22.3 Lazy Loading
- [ ] Carregar imagens de perfil sob demanda
- [ ] Defer de scripts não críticos

---

### 📦 FASE 23 - Relatórios e Exportação

#### 23.1 Exportar CSV ✅
- [x] Botão "Exportar Leads" no dashboard
- [x] Colunas: Nome, Telefone, Email, Cidade/UF, Consumo, Potência, Painéis, Valor Final, Status, Vendedor, Data
- [x] Download de arquivo `.csv` com encoding UTF-8 e separador `;`

#### 23.2 Relatório de Faturamento ✅
- [x] Página `relatorios.html` com filtros de período (3M/6M/12M)
- [x] KPIs: Total Leads, Taxa de Conversão, Faturamento, Ticket Médio
- [x] Gráfico de faturamento mensal (area chart)
- [x] Gráfico de leads por status (donut chart)
- [x] Gráfico de evolução de leads vs fechados (bar chart)
- [x] Performance por vendedor com barra de progresso

#### 23.3 Métricas de Conversão ✅
- [x] Taxa de conversão por vendedor (fechados/total)
- [x] Comparativo de faturamento entre vendedores
- [x] Evolução mensal de leads e fechamentos

---

### 🔧 FASE 24 - Infraestrutura

#### 24.1 Backup Manual
- [ ] Botão "Exportar Backup" no admin
- [ ] Download de JSON com todos os dados
- [ ] Restore via upload de JSON

#### 24.2 Rate Limiting
- [ ] Limite de chamadas às APIs externas
- [ ] Cache de CEP por 24h

#### 24.3 Monitoramento
- [ ] Analytics de uso
- [ ] Erros capturados (Sentry?)
- [ ] Uptime monitoring

---

## 📊 Resumo de Fases

| Fase | Descrição | Status | Items |
|------|-----------|--------|-------|
| 1-12 | Fundação e CRM Completo | ✅ Feito | 60+ |
| 13 | Autenticação e Segurança | ✅ Feito | 8 |
| 14 | Banco de Equipamentos Dinâmico | ✅ Feito | 9 |
| 15 | Multi-Vendedores | ✅ Feito | 7 |
| 16 | Gráficos com ApexCharts | ✅ Feito | 8 |
| 17 | Timeline de Interações | ✅ Feito | 6 |
| 18 | Automação de Follow-up | ⏳ Pendente | 7 |
| 19 | Integrações | ⏳ Pendente | 6 |
| 20 | UI/UX | ⏳ Pendente | 8 |
| 21 | PWA | ⏳ Pendente | 6 |
| 22 | Performance | ⏳ Pendente | 6 |
| 23 | Relatórios e Exportação | ✅ Feito | 7 |
| 24 | Infraestrutura | ⏳ Pendente | 6 |

**Total implementado: ~900+ linhas de código**
**Total pendente: 54 itens organizados em 7 fases**

---

## 🎯 Ordem de Implementação Sugerida (Próximas Fases)

1. **Fase 20** (UI/UX) → Dark/Light mode e preview PDF
2. **Fase 18** (Follow-up) → Alertas e automação de contato
3. **Fase 19, 21-22, 24** → Conforme necessidade

---

## 🏗️ Arquivos Criados/Modificados Recentemente

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/js/firebase.js` | Modificado | Auth reset, profiles, audit, interações, equipamentos |
| `src/js/auth.js` | Modificado | resetPassword, checkRole, auditAction |
| `src/js/calculator.js` | Modificado | Refatorado para equipamentos async |
| `src/js/dashboard.js` | Modificado | Gráficos ApexCharts, interações, filtros, skeleton loading |
| `src/js/proposta.js` | Modificado | Gráfico de geração ApexCharts |
| `src/js/tv.js` | Modificado | Gráfico de crescimento ApexCharts |
| `src/js/app.js` | Modificado | vendedorId ao criar lead |
| `src/js/admin/equipamentos.js` | Criado | CRUD de equipamentos |
| `src/js/relatorios.js` | Criado | Lógica de relatórios, KPIs, gráficos de evolução |
| `src/vendor/apexcharts.min.js` | Criado | Biblioteca ApexCharts local (522KB) |
| `src/css/style.css` | Modificado | Skeleton loading styles com shimmer animation |
| `login.html` | Modificado | Modal recuperação senha |
| `dashboard.html` | Modificado | Gráficos, coluna data, filtros período, link relatórios |
| `proposta.html` | Modificado | Canvas → div para ApexCharts |
| `tv.html` | Modificado | Canvas → div para ApexCharts |
| `admin/equipamentos.html` | Criado | Página de gestão de equipamentos |
| `relatorios.html` | Criado | Página de relatórios com gráficos ApexCharts |
| `vite.config.js` | Modificado | +admin/equipamentos.html +relatorios.html |
| `CONTEXT.md` | Atualizado | Fases 18, 20.1, 20.2, 23 completas |
| **Rebranding para Spark** | | |
| `favicon.svg` | Modificado | Novo ícone com raio e árvore |
| `src/css/style.css` | Modificado | Cores Spark (preto, amarelo, cinza, branco) |
| `dashboard.html`, `index.html`, etc. | Modificado | Nome e logo atualizados para Spark |
| `src/js/config.js` | Modificado | empresaNome: "Spark" |
| `src/js/*.js` | Modificado | Mensagens atualizadas |

---

## 🔑 Credenciais Firebase

- **Projeto**: solarcrm-60ce1
- **Auth Domain**: solarcrm-60ce1.firebaseapp.com
- **Database**: Firestore ativo
- **Usuários**: Admin criado via Firebase Console (admin@admin.com)

## 🌐 URLs de Deploy

- **Firebase Hosting**: https://solarcrm-60ce1.web.app
- **GitHub Pages**: https://renato0503.github.io/Spark/