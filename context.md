# Contexto do Projeto - Spark

Resumo consolidado do que já foi implementado na **Spark** (CRM Solar da Spark Engenharia Elétrica pela CerradoTech) e pendências.

---

## 📅 O que já foi FEITO (Fases 1-24)

### 1. Fundação (Fase 1)
- Scaffolding Vite + Vanilla JS, estrutura modular `src/js/` e `src/css/`, multi-page config.

### 2. Dimensionamento Solar (Fase 2)
- `equipamentos.js`, `config.js`, `calculator.js` com HSP, tarifa, margem e payback.

### 3. Proposta Comercial (Fase 3)
- `proposta.html` com design light, animações Motion One, exportação PDF via `html2pdf.js`.

### 4. WhatsApp (Fase 4)
- Mensagem formatada automática, atualização de status para "Enviado".

### 5. CRM e Auth (Fase 5)
- Dashboard premium dark, indicadores KPIs, tabela com filtros/busca, ações rápidas, modal config.
- Firebase Auth com `login.html`, `auth.js`, proteção de rotas.
- MockDB fallback localStorage.

### 6. Publicação (Fase 6)
- Vite base subdirectory, caminhos relativos, deploy Firebase Hosting + GitHub Pages.

### 7. Frete por CEP (Fase 7)
- Máscara CEP, APIs ViaCEP/BrasilAPI/Nominatim, tabela de frete proporcional (3 faixas), taxa de deslocamento.

### 8. API de CEP Robusta (Fase 8)
- Dicionário local de capitais, fallback inteligente, detector de região por prefixo.

### 9. Layout PDF (Fase 9)
- Compactação A4, multicolunas, quebras de página, área de assinaturas.

### 10. pdf.html Isolado (Fase 10)
- Template dedicado, páginas A4 rígidas 296mm, download automático.

### 11. Arquivos Estáticos (Fase 11)
- CDN imports (GStatic/JSDelivr), fallbacks JSON estáticos.

### 12. CRM Kanban (Fase 12)
- Kanban 6 colunas drag-and-drop, páginas públicas (`lead.html`, `historico.html`, `tv.html`), tabela de parcelas.

### 13. Auth e Segurança (Fase 13)
- Recuperação de senha, RBAC (admin/vendedor), criação auto de profile, auditoria (`audit_log`).

### 14. Equipamentos Dinâmicos (Fase 14)
- Firestore CRUD, cache em memória, página `admin/equipamentos.html`, filtros por categoria.

### 15. Multi-Vendedores (Fase 15)
- Atribuição automática, isolamento de dados, tag visual no dashboard.

### 16. Gráficos ApexCharts (Fase 16)
- Proposta: barras geração mensal. Dashboard: funil + faturamento com filtros. TV: área crescimento.
- Biblioteca local em `src/vendor/apexcharts.min.js`.

### 17. Timeline Interações (Fase 17)
- Coleção `interacoes` no Firestore, modal com histórico + formulário, ícones por tipo, `dbAddInteracao()`.

### 18. Motor de Cálculo Avançado (Sprint 18) ✅
- `irradiacao.js`: irradiação por orientação (N/NE/E/SE/S/SO/O/NO) × inclinação (5°-25°) × 12 meses.
- `financeiro.js`: TIR (Newton-Raphson), payback mensal, projeção 6 anos Fio B, tabela Price multi-banco.
- `config.js` expandido: Fio B progressivo 2023-2031, tipos de ligação (mono/bi/tri), autoconsumo, imposto.
- `equipamentos.js`: 6 painéis (DAH 620W, Ronma 610W, Sunova, Jinko, JA) + 19 inversores (Sofar, Solis, Growatt, Deye, Fronius) + garantias.
- `calculator.js` reescrito: HSP lookup → Valor Kit → Fator Preço → Imposto → Preço Final → Margem Efetiva.
- `pdf.html` 5 páginas profissionais (Capa, Vantagens, Especificações+Gráfico, Financeiro, Garantias+Assinaturas).
- `proposta.html`: +Info sistema, +TIR, +projeção 6 anos, +Fio B.
- `index.html`: +8 orientações, +5 inclinações, +tipo ligação, +tipo cliente.
- Estrutura: `precificacao.valorKit`, `precificacao.fatorPreco`, `precificacao.margemLucroEfetiva`, `precificacao.valorImposto`.
- Campo `dados_completos` + campos flat para backward compat.

### 19. Follow-up e Notificações (Sprint 19) ✅ (parcial)
- Sino de notificações com contador de leads pendentes no header do dashboard.
- Dropdown com lista ordenada por criticidade (3d/7d/14d).
- Filtro "⚠️ Precisa Atenção" no dashboard e Kanban.
- Badges visuais nos cards (👀 Atenção / ⚠️ 7+dias / ❄️ Frio).
- 🔴 FCM Push: pendente (requer chave VAPID).

### 20. Integrações (Sprint 20) ✅ (parcial)
- Slider de entrada (0-50%) no financiamento com recálculo dinâmico.
- Tabela Price com taxas por banco (BV, Santander, Bradesco, BB, Sicoob, Sicredi, BTG).
- Prazos: 12x a 120x.
- 🔴 Email (SendGrid): pendente (requer API key).
- 🔴 WhatsApp Business API: pendente (requer token Meta).
- 🔴 Pix/Boleto: pendente (requer gateway Mercado Pago/Asaas).

### 21. UI/UX Premium (Sprint 21) ✅ (parcial)
- Preview PDF funcional no modal da proposta (clona conteúdo + imprimir).
- Config modal com sliders (HSP, Tarifa, Margem, PR) + preview em tempo real.
- Labels ARIA em grupos de filtros, Escape fecha modais.
- Dark/Light mode toggle + skeleton loading (fases anteriores).
- 🔴 Tour guiado onboarding: pendente (escolher biblioteca).

### 22. PWA e Performance (Sprint 22) ✅ (parcial)
- `manifest.json` + `sw.js` (cache offline de assets estáticos).
- Botão "Instalar App" com prompt nativo (`beforeinstallprompt`).
- Meta tags PWA (theme-color, apple-mobile-web-app).
- Paginação: 50 leads por vez + botão "Carregar mais" com contador.
- 🔴 Índices Firestore: pendente (criar no console).

### 23. Infraestrutura (Sprint 23) ✅ (parcial)
- Backup: export JSON (leads, propostas, equipamentos, config) com download.
- Restore: upload de arquivo JSON com validação.
- Cache de CEP 24h em localStorage.
- Botões admin-only: 💾 Backup, 📥 Restore, 📦 Fornecedores.
- 🔴 Cloud Functions backup automático: pendente.
- 🔴 Crashlytics/Sentry: pendente.

### 24. Fornecedores e Estoque (Sprint 24) ✅ (parcial)
- Página `admin/fornecedores.html` com CRUD (nome, CNPJ, contato, telefone, site, obs).
- Armazenamento em localStorage (`solarcrm_fornecedores`).
- 🔴 Cotação automática: pendente (integrar com cálculo).
- 🔴 Gestão de estoque: pendente.

### Extras
- Logo Spark (`logospark.png`) em toda a plataforma (favicon + headers + PDF).
- `public/favicon.svg` e `public/icons.svg` substituídos.
- CSS `.brand-logo` atualizado para `<img>`.

### 25. Site Institucional spark-site (Fase 25) ✅
- Páginas públicas: `index.html`, `blog.html`, `orcamento.html`, `capacitores.html`, `industrial.html`, `solar.html`, `servicos.html`, `sobre.html`, `login.html`.
- Header e footer padronizados em todas as páginas.
- Emojis removidos e substituídos por ícones SVG inline.
- Botão "Solicite um Orçamento" redireciona para `simulador.html`.
- Menu mobile com contraste corrigido (texto branco sobre fundo escuro).
- Hero banner com imagem de fundo atualizada (`img/hero-bg.avif`).

### 26. Reorganização de Rotas e Deploy (Fase 26) ✅
- `index.html` da raiz convertido em redirect para `/spark-site/index.html`.
- Simulador renomeado de `index.html` para `simulador.html`.
- Todos os links internos atualizados (`simulador.html`, `login.html`, `dashboard.html`).
- `firebase.json` ajustado: rewrite `/` → `/spark-site/index.html`.
- Deploy Firebase Hosting atualizado com nova estrutura de rotas.

### 27. Correções de Bugs Categorias A e B (Fase 27) ✅
- **A4**: `proposta.js` já protegia acesso a `lead-cidade` com `if (leadCidadeEl)`.
- **B1/B4/B5**: Unificado banco de equipamentos. `firebase.js` agora importa `EQUIPAMENTOS` de `equipamentos.js` como fonte única, eliminando duplicação.
- **B2**: Removido campo órfão `percentualAutoconsumo` de `config.js`.
- **B3**: `calculator.js` agora usa `getTipoClienteConfig()` ao invés de lógica ternária hardcoded.
- **B6**: TIR refatorada para matemática anual nativa. `tirAnual` é direto e `tirMensal` é derivado.
- **B7**: Removidos fallbacks hardcoded em `pdf.js` (`28.5`, `25`, `50`), agora exibe `—` quando `configs` não existe.
- **B8**: Cálculo de dimensionamento e geração mensal usam `diasNoMes()` e média anual de 30.44 dias.
- **B9**: Função `gerarFluxoCaixaAcumulado` renomeada para `gerarSaldoAnoAAno` em `financeiro.js`, `calculator.js`.
- **B11**: Slider de entrada em `proposta.js` atualiza tabela de financiamento imediatamente.
- **B12-B16**: Ajustes de deploy e infra: meta tag mobile-web-app-capable, rewrites SPA em `firebase.json`, deploy de `firestore.rules` via CLI.

---

## 🔴 PENDÊNCIAS (requerem credenciais/ações externas)

| Item | O que falta | Responsável |
|------|-------------|-------------|
| FCM Push Notifications | Criar chave VAPID no Firebase Console → Cloud Messaging | Admin Firebase |
| Cloud Function Follow-up | `firebase deploy --only functions` com scheduler | Dev |
| Envio de Email (SendGrid) | Criar conta SendGrid, obter API key, configurar template | Admin |
| WhatsApp Business API | Criar app no Meta Business, verificar número, obter token | Admin Spark |
| Pix/Boleto (Mercado Pago) | Criar conta Mercado Pago, obter access token | Financeiro |
| Tour guiado (Onboarding) | Escolher biblioteca (driver.js/intro.js) e criar passos | Dev |
| Índices Firestore | Criar no console: `vendedorId+status+createdAt`, `status+updatedAt` | Admin Firebase |
| Crashlytics | Ativar no Firebase Console, adicionar SDK | Admin Firebase |
| Cloud Function backup | Scheduler semanal export JSON → Firebase Storage | Dev |
| Cotação automática | Integrar fornecedores ao calculator.js para menor preço | Dev |
| Gestão de estoque | Adicionar quantidade disponível por SKU, reserva ao fechar lead | Dev |

---

## 🏗️ Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `src/js/irradiacao.js` | Dados irradiação solar (8 orientações × 5 inclinações × 12 meses) |
| `src/js/financeiro.js` | TIR, payback, projeção Fio B, tabela Price |
| `src/js/calculator.js` | Motor de cálculo avançado (Valor Kit → Fator Preço → Imposto → Margem Efetiva) |
| `src/js/config.js` | Configurações + Fio B progressivo + tipos de ligação |
| `src/js/equipamentos.js` | Banco expandido: 6 painéis + 19 inversores + garantias |
| `src/js/firebase.js` | Firestore + MockDB + equipamentos + interações + audit |
| `src/js/auth.js` | RBAC, protegerRota, resetPassword, auditAction |
| `src/js/dashboard.js` | Notificações, filtros, paginação, config sliders, backup |
| `src/js/proposta.js` | Leitura dados_completos, preview modal, entrada slider, gráfico |
| `src/js/pdf.js` | Popula template 5 páginas, geração html2pdf |
| `src/js/app.js` | Formulário público, cálculo, salvamento Firestore |
| `src/js/utils.js` | showToast, formatCurrency, formatPhone, calcularFretePorCEP + cache |
| `src/css/style.css` | Temas dark/light, skeleton loading, glass cards, brand-logo |
| `public/logospark.png` | Logo oficial Spark (363KB) |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service Worker cache offline |
| `admin/fornecedores.html` | CRUD de fornecedores |
| `admin/equipamentos.html` | CRUD de equipamentos |

---

## 🔑 Credenciais Firebase
- **Projeto**: solarcrm-60ce1
- **Auth Domain**: solarcrm-60ce1.firebaseapp.com
- **Database**: Firestore ativo
- **Usuários**: Admin criado via Firebase Console (admin@admin.com)

## 🌐 URLs
- **Firebase Hosting**: https://solarcrm-60ce1.web.app
- **GitHub Pages**: https://renato0503.github.io/Spark/

---

## 🔄 Atualizações Recentes (15/07/2026)

### Correções pós-sprint 27
- `src/js/irradiacao.js`: exportações `MESES`, `ORIENTACAO_LABELS` e `ESTADO_ANOMALIA` restauradas após refatoração.
- `src/js/firebase.js`: função `getEnv()` adicionada para evitar `TypeError` com `import.meta.env` em produção.
- Firebase Analytics: `measurementId` alinhado para `G-XQQZCQ1FE9`, removendo aviso de divergência.
- TIR na proposta: `tir_mensal`/`tir_anual` salvos como campos flat em `app.js` e lidos em `proposta.js`, evitando `—` na proposta.
- Simulador: link LGPD atualizado, emoji 🧮 removido do título, footer atualizado com crédito “Desenvolvido por Cerrado Tech” linkando para `https://www.cerradofinancas.com.br/`.
