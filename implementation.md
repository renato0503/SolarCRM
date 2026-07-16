# 📋 Pendências e Sprints de Correção — Spark CRM

> Documento criado em **13/07/2026** com base na auditoria técnica completa realizada em `MEMORIA_DE_CALCULO.md`.

---

## 🔴 Problemas Identificados

### Categoria A — Bugs Críticos (quebram funcionalidade ou precisão)

| # | Severidade | Local | Problema |
|---|------------|-------|----------|
| A1 | ✅ Resolvido | `src/js/irradiacao.js` | Tabelas de irradiação `S ≡ SE` e `E ≡ O` foram corrigidas; agora cada orientação tem dados corretos. |
| A2 | ✅ Resolvido | `src/js/irradiacao.js` | Dados para inclinação 5° na orientação Norte foram adicionados com valores otimizados (0°, 14°, 30°). |
| A3 | ✅ Resolvido | `src/js/proposta.html` | Card "Investimento Total" agora tem contraste garantido via estilo inline com `!important` e cores ajustadas. |
| A4 | ✅ Resolvido | `src/js/proposta.js:64` | Acesso direto a `lead-cidade` que não existe em `proposta.html` (apenas em `pdf.html`). Lançava `TypeError: Cannot set properties of null`. ✅ JÁ CORRIGIDO |

### Categoria B — Bugs Moderados (causam inconsistência ou duplicação)

| # | Severidade | Local | Problema |
|---|------------|-------|----------|
| B1 | ✅ Resolvido | `src/js/equipamentos.js` × `src/js/firebase.js:getEquipamentosLocais()` | Bancos de equipamentos **unificados**: `firebase.js` agora importa `EQUIPAMENTOS` de `equipamentos.js` como fonte única. ✅ CORRIGIDO |
| B2 | ✅ Resolvido | `src/js/config.js:19` | Campo `percentualAutoconsumo: 0.25` removido de `defaultSettings`. Agora usa apenas `getTipoClienteConfig()`. ✅ CORRIGIDO |
| B3 | ✅ Resolvido | `src/js/calculator.js:114-115` | Agora usa `getTipoClienteConfig(tipo_cliente)` ao invés de codificação manual por tipo de cliente. ✅ CORRIGIDO |
| B4 | ✅ Resolvido | `src/js/equipamentos.js` × `src/js/firebase.js:getEquipamentosLocais()` | Banco `equipamentos.js` é agora a **fonte única** importada por `firebase.js`. Eliminada duplicação. ✅ CORRIGIDO |
| B5 | ✅ Resolvido | `src/js/firebase.js:566` (em `getEquipamentosLocais()`) | Campo `area` padronizado via importação de `equipamentos.js`. ✅ CORRIGIDO |
| B6 | ✅ Resolvido | `src/js/financeiro.js:5-12` (Newton-Raphson) | `calcularTIR` agora retorna TIR anual nativa. Em `calculator.js`, `tirAnual` é calculado diretamente e `tirMensal` é derivado por `(1+tirAnual)^(1/12)-1`. ✅ CORRIGIDO |
| B7 | ✅ Resolvido | `src/js/pdf.js:117` | Removidos fallbacks hardcoded (`28.5`, `25`, `50`) para `fio-percentual`, `fio-autoconsumo` e `fio-disponibilidade`. Agora exibe `—` quando `configs` não existe. ✅ CORRIGIDO |
| B8 | ✅ Resolvido | `src/js/calculator.js:39` | Adicionada função `diasNoMes(mes, ano)` e aplicada no cálculo de geração mensal detalhada. Dimensionamento agora usa média anual de 30.44 dias. ✅ CORRIGIDO |
| B9 | ✅ Resolvido | `src/js/financeiro.js:116-125` (`gerarFluxoCaixaAcumulado`) | Função renomeada para `gerarSaldoAnoAAno`. Todos os imports e usos atualizados em `calculator.js`. ✅ CORRIGIDO |
| B10 | 🟡 Médio | `src/js/dashboard.js` | Não auditado nesta revisão, mas provável que tenha referências inconsistentes a `profile.role` sem checar `null` (caso admin não tenha perfil). |
| B11 | ✅ Resolvido | `src/js/proposta.js:155` | Slider de entrada já atualiza `gerarTabelaFinanciamentoHtml` e tabela de parcelas imediatamente. ✅ CORRIGIDO |
| B12 | 🟡 Médio | `src/css/style.css:1` | Importa Google Fonts via `@import`. Recomenda-se self-host ou fallback para redes corporativas bloqueadas. |
| B13 | 🟡 Médio | `public/firebase.ts` (analytics) | Measurement ID local `G-XQQZCQQ1FE9` diverge do servidor `G-XQQZCQ1FE9`. Recomenda-se remover `measurementId` da config local para usar o valor do servidor. |
| B14 | ✅ Resolvido | `simulador.html:11` | Meta tag `mobile-web-app-capable` adicionada, mantendo `apple-mobile-web-app-capable` como fallback legacy. ✅ CORRIGIDO |
| B15 | ✅ Resolvido | `firebase.json` | Adicionados rewrites para rotas principais (`/simulador`, `/login`, `/dashboard`, `/proposta`, `/historico`, `/lead`). ✅ CORRIGIDO |
| B16 | ✅ Resolvido | Firestore rules (locais) | Regras `firestore.rules` deployadas via CLI (`firebase deploy --only firestore:rules`). ✅ CORRIGIDO |

### Categoria C — Bugs de UX/UI/Mensagens

| # | Severidade | Local | Problema |
|---|------------|-------|----------|
| C1 | 🟡 Médio | `src/js/proposta.js:174` | Mensagem WhatsApp fala "Gostaria de falar com um **especialista**" mas poderia ser mais persuasiva com **gatilho de escassez/budget** (validade de 15 dias na proposta). |
| C2 | 🟡 Médio | `src/js/utils.js:38-39` | Mensagens de toast some após **4.5 segundos**. Toast de **success** no submit some antes que o cliente veja (já tem `setTimeout` para redirect de 1s, mas se conexão lenta, o user sai sem ver). |
| C3 | 🟡 Médio | `index.html:174` | Ícone SVG inline do cadeado com fonte "style=`stroke: var(--status-fechado);`" é bom. Mas o tooltip de segurança poderia incluir selo "LGPD" ou "criptografia" pra aumentar confiança. |
| C4 | 🟡 Baixo | `src/js/cal culator.js` | Não existe **lista de erros/validação** para dados de entrada — só `app.js` faz. Função `gerarProposta` aceita qualquer coisa sem validar. |
| C5 | 🟡 Baixo | `src/js/proposta.js:155` | Quando entrada slider muda, chama `gerarTabelaFinanciamento` mas **não atualiza o total imediatamente** no texto por extenso, apenas na tabela. |
| C6 | 🟡 Baixo | `src/js/dashboard.js` (não auditado) | Possível: paginação "Carregar mais" sem confirmação visual de quantos foram carregados vs total. |
| C7 | 🟡 Baixo | HTML/JS | Não há **breadcrumb** ou indicador de etapa ("Você está em: Simulação > Proposta > Confirmação"). Para clareza do cliente. |

---

## 🟢 Melhorias Prioritárias (sem bug mas recomendadas)

| # | Tipo | Local | Sugestão |
|---|------|-------|----------|
| M1 | Dataset | `src/js/irradiacao.js` | Adicionada cobertura multi-estado com `ESTADO_ANOMALIA` e funções `getHSP/getHSPMensal/getVariacaoSazonal` com parâmetro de estado. ✅ CORRIGIDO |
| M2 | Feature | `dashboard.html` | Adicionar **filtro por cidade/estado** (vinculado à tabela leads). Espelha `uf` que vem do calendário. |
| M3 | Performance | `firebase.js` (`dbGetLeads`) | Adicionar **paginação real com cursor Firestore** (`startAfter`) ao invés de pegar até 50 e cortar. |
| M4 | Feature | `proposta.html` | Adicionar **versão mobile** otimizada com progressive enhancement. Hoje o layout é assumido "desktop". |
| M5 | Export | `dashboard.html` | Adicionada exportação CSV de leads via botão `btnExportCSV` em `dashboard.js`. ✅ CORRIGIDO |
| M6 | Internacionalização | `src/js/utils.js` | Mensagens em pt-BR hardcoded; considerar i18n com JSON. |
| M7 | Energia | `calculator.js:39` | Adicionada função `perdaPorTemperatura()` aplicando -0,4% por °C acima de 25°C no `performanceRatio`. ✅ CORRIGIDO |
| M8 | Acessibilidade | `simulador.html` | Adicionados `aria-live` no toast, `aria-required` nos campos obrigatórios e breadcrumb com `aria-label`/`aria-current`. ✅ CORRIGIDO |
| M9 | LGPD | `simulador.html` | Adicionado checkbox de consentimento LGPD obrigatório antes do submit, com link para a lei. ✅ CORRIGIDO |
| M10 | Backup | `firebase.js` | Implementar **Cloud Function** para backup automático JSON → Firebase Storage (já indicada como pendência no CONTEXT.md). |
| M11 | Notificações | CONTEXT.md indica | **FCM Push** para vendedores (requer chave VAPID) — pendente há várias sprints. |
| M12 | Email | New flow | **SendGrid para emails transacionais** (proposta enviada, contrato) também pendente. |
| M13 | Pagamento | New flow | Gateway **Mercado Pago/Asaas** para Pix/Boleto na assinatura da proposta pendente. |
| M14 | Onboarding | Spr int 21 indica | Tour guiado para novos vendedores (driver.js/intro.js). |
| M15 | Estoque | Sprint 24 indica | Adicionar **quantidade disponível** + **reserva ao fechar lead** por SKU. |
| M16 | Cotação | Sprint 24 indica | Cotação automática integrando `fornecedores.html` → `calculator.js` para escolha de menor preço. |

### Nova Lógica de Precificação (16/07/2026)
- Removido campo `estado` do simulador; foco apenas em Mato Grosso.
- Adicionado CEP com autocompletar ViaCEP para `cidade` e `bairro`.
- Nova fórmula: `(kWp × R$/kWp) + (placas × R$/placa) + taxa cidade`.
- `config.js` ganhou tabelas `custoEstrutura`, `custoKitPorFaixa` e `adicionalCidade`.
- `dashboard.html`/`dashboard.js` atualizados para editar esses valores.
- Proposta simplificada: exibe apenas valor final + itens principais.

---

## 🚧 Sprints de Correção

### 🏃 SPRINT 25 — Correções Imediatas (BUGS CRÍTICOS)

**Duração estimada: 1-2 dias**

#### Tarefa 25.1: Corrigir tabelas de irradiação duplicadas (A1 e A2)
- **Owner:** Dev
- **Descrição:** Recriar `IRRADIACAO_MENSAL` usando dados do **CRESESB/SUNData** ou interpolação física por orientação solar.
- Para evitar regressão, separar dados por **hemisfério** e usar fator de correção por ângulo azimutal:

```
Proposta de correção:
N(0°), NE(45°), E(90°), SE(135°), S(180°), SO(-135°), O(-90°), NO(-45°)
Cada orientação com sua irradiação mensal específica.
```

- **Validação:** Comparar com dados reais do INPE para Cuiabá-MT.
- **Arquivos afetados:** `src/js/irradiacao.js`

#### Tarefa 25.2: Corrigir especificidade CSS do card "Investimento Total" (A3)
- **Owner:** Dev
- **Descrição:** Em `proposta.html:28`, mudar o seletor `.pricing-card` para **usar `!important`** ou, melhor, aplicar o background **inline na div** (`style="background: linear-gradient(..."`); remover o gradiente do CSS externo `.pricing-card`.
- **Arquivos afetados:** `proposta.html` (CSS inline + classes DOM)

#### Tarefa 25.3: Atualizar `gerarTabelaFinanciamento` para fluxo mensal ANO 0 (já corrigido A4)
- **Owner:** Dev/QA
- **Descrição:** Testar reembolso do `find()` em `proposta.js:64` (`lead-cidade` foi corrigido). Validar em produção durante 48h.
- ✅ A4 já foi corrigido em sprint anterior.

---

### 🚶 SPRINT 26 — Refatoração de Bancos Duplicados (BUGS ALTOS)

**Duração estimada: 3-5 dias**

#### Tarefa 26.1: Consolidar banco de equipamentos (B1, B4, B5)
- **Owner:** Dev
- **Descrição:** Eliminar `src/js/equipamentos.js` (arquivo morto). Importar `getEquipamentosLocais` de `firebase.js` como **fonte única**.
  - Mover `GARANTIAS` para dentro de `getEquipamentosLocais().garantias` (ou em módulo separado `garantias.js` que é importado pelos 2 paths).
  - Padronizar campo `area` em todos os painéis (mínimo 2.58 m² para bifaciais 590-620W).
  - Atualizar `admin/equipamentos.html` para usar `equipamentos` de `firebase.js`.

#### Tarefa 26.2: Remover campo órfão `percentualAutoconsumo` (B2)
- **Owner:** Dev
- **Descrição:** Em `config.js:19`, remover `percentualAutoconsumo: 0.25`. Confirmar que **não é referenciado em nenhum outro lugar** via `grep -r percentualAutoconsumo src/`.

#### Tarefa 26.3: Usar `getTipoClienteConfig` no calculator (B3)
- **Owner:** Dev
- **Descrição:** Em `calculator.js:114-115`, substituir lógica ternária por:

```js
const tipoClienteConfig = getTipoClienteConfig(tipo_cliente);
const autoconsumo = tipoClienteConfig.autoconsumo;
```

- Verificar se `TIPO_CLIENTE_CONFIG['autoconsumo_remoto'] = 0` (cadastrado mas não usado).

#### Tarefa 26.4: Refatorar TIR para matemática anual nativa (B6)
- **Owner:** Dev/Matemático
- **Descrição:** Em `financeiro.js:1-18`, o fluxo já é anual. Refatorar a conversão mensal para anual:
  - Opção A: Trabalhar com Taxa Equivalente Anual: `i_anual = (1 + i_mensal)^12 − 1`
  - Opção B: Receber fluxos anuais e retornar TIR anual diretamente.
  - **Decisão:** Manter como TIR anual (mais intuitivo para o cliente) e transformar `tirMensal` em display calculado a partir da anual (`tirMensal = (1+tirAnual)^(1/12) − 1`).
- **Arquivos afetados:** `financeiro.js`, `calculator.js`, `proposta.js`, `pdf.js`

#### Tarefa 26.5: Remover fallback hardcoded em `pdf.js` (B7)
- **Owner:** Dev/QA
- **Descrição:** Em `pdf.js:117`, trocar `configs ? ${(configs.fioBTUSD * 100).toFixed(1)} : '28.5'` por:
  - Sempre exigir `dados_completos.configuracoes` ou erro explícito.
  - Validar no `app.js` antes de salvar proposta: `if (!prop).dados_completos === ...`.
- **Arquivos afetados:** `pdf.js`

---

### 🐢 SPRINT 27 — Melhorias de Precisão e Métricas

**Duração estimada: 3-5 dias**

#### Tarefa 27.1: Implementar dimensionamento por dias reais do mês (B8)
- **Owner:** Dev
- **Descrição:** Em `calculator.js`, criar função `diasNoMes(mes, ano)`:
```js
function diasNoMes(mes, ano) {
  return new Date(ano, mes, 0).getDate();
}
```
- Aplicar no cálculo de geração mensal detalhada (já tem `hspMensal` por mês):
```js
const geracaoMensalDetalhada = hspMensal.map(
  (irr, i) => Math.round(potenciaRealKwp * irr * diasNoMes(i+1, 2026) * PR)
);
```

#### Tarefa 27.2: Renomear `gerarFluxoCaixaAcumulado` para clareza (B9)
- **Owner:** Dev
- **Descrição:** Renomear para `gerarSaldoAnoAAno` em `financeiro.js:116` e `calculator.js:138`. Atualizar todos os usos.

#### Tarefa 27.3: Corrigir meta tag apple-mobile-web-app-capable deprecada (B14)
- **Owner:** Dev
- **Descrição:** Em `index.html:11`, substituir por:
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">  <!-- legacy fallback -->
```

#### Tarefa 27.4: Corrigir Measurement ID do Analytics (B13)
- **Owner:** Dev/Ops
- **Descrição:** Em `firebase.js:33`, trocar:
-  Local: `G-XQQZCQQ1FE9`
-  Servidor: `G-XQQZCQ1FE9`
- **Solução:** Remover `measurementId` da config local OU corrigir valor. Recomendar remover para forçar analytics automático Firebase usar o valor do servidor.

#### Tarefa 27.5: Self-host ou fallback de Google Fonts (B12)
- **Owner:** Dev
- **Descrição:** Em `style.css:1`, substituir:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@...&family=Outfit:...');
```
por:
```css
/* Self-host dos fonts via @font-face das WOFF2 baixadas */
@font-face { font-family: 'Inter'; src: url('/fonts/Inter-Regular.woff2') format('woff2'); }
@font-face { font-family: 'Outfit'; src: url('/fonts/Outfit-Bold.woff2') format('woff2'); }
```

#### Tarefa 27.6: Adicionar SPA rewrites (B15)
- **Owner:** DevOps
- **Descrição:** Em `firebase.json`:
```json
{
  "hosting": {
    "rewrites": [
      { "source": "/proposta", "destination": "/proposta.html" },
      { "source": "/dashboard", "destination": "/dashboard.html" },
      ...
    ]
  }
}
```

#### Tarefa 27.7: Deploy regras Firestore via CLI (B16)
- **Owner:** DevOps
- **Comando:**
```bash
firebase deploy --only firestore:rules
```
**Cuidado:** revisar antes se as regras locais batem com as do Console.

---

### 🎨 SPRINT 28 — UX e Validações

**Duração estimada: 3-5 dias**

#### Tarefa 28.1: Validação no Calculator (C4, B11)
- **Owner:** Dev
- **Descrição:** Em `calculator.js`, adicionar função `validarDados(dados)`:
```js
export function validarDados(dados) {
  const erros = [];
  if (!dados.consumo_mensal_kwh || dados.consumo_mensal_kwh <= 0)
    erros.push("Consumo mensal deve ser maior que zero.");
  if (!dados.tipo_telha)
    erros.push("Tipo de telhado ausente.");
  // etc...
  return { valido: erros.length === 0, erros };
}
```
- Chamar em `gerarProposta()` antes de calcular.
- Chamar em `app.js` antes de salvar no Firestore.

#### Tarefa 28.2: Slider de entrada em tempo real (C5, B11)
- **Owner:** Dev
- **Descrição:** Em `proposta.js:155`, melhorar para também atualizar:
- Texto de impacto (parcela cabe na economia mensal?)
- Valor total com juros (mostrar economia vs à vista).

#### Tarefa 28.3: Toast mais persistente em submit (C2)
- **Owner:** Dev
- **Descrição:** Em `app.js:163`, trocar `setTimeout(redirect, 1000)` por:
```js
setTimeout(() => {
  if (!erros) window.location.href = `./proposta.html?id=...`;
}, 2500); // 2.5s para o cliente ver "Salvo com sucesso"
```

#### Tarefa 28.4: Mensagem WhatsApp persuasiva (C1)
- **Owner:** Dev/Marketing
- **Descrição:** Em `proposta.js:174-180`, adicionar gatilhos:
```js
const validadeISO = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
const mensagem = `Olá! Meu nome é *${lead.nome}*...%0A...%0A%0A` +
  `⚠️ *Proposta válida até ${validadeISO}* - aproveite os valores especiais!%0A` +
  `...`;
```

#### Tarefa 28.5: Checkbox LGPD (M9)
- **Owner:** Dev/Jurídico
- **Descrição:** Em `index.html`, antes do botão submit:
```html
<label style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
  <input type="checkbox" id="lgpdConsent" required>
  Aceito receber contato comercial conforme LGPD (Lei 13.709/2018)
</label>
```
Validar antes do submit.

#### Tarefa 28.6: Acessibilidade básica (M8)
- **Owner:** Dev
- **Descrição:** Adicionar `aria-live="polite"` em `#toastContainer` e `aria-required="true"` em inputs obrigatórios.

---

### 📊 SPRINT 29 — Features de Crescimento

**Duração estimada: 1-2 semanas**

#### Tarefa 29.1: Cobertura multi-estado (M1)
- **Owner:** Dev/Pesquisador
- **Descrição:** Em `src/js/irradiacao.js`, criar `IRRADIACAO_REGIONAL`:
```js
const IRRADIACAO_POR_ESTADO = {
  'MT': { capitais: { 'Cuiabá': { lat: -15.596, lon: -56.097, anomalia: 1.0 } } },
  'SP': { capitais: { 'São Paulo': { ..., anomalia: 0.93 } } },
  // ...
};
```
- Acessar por `getHSP(orientacao, inclinacao, estado)` automaticamente.

#### Tarefa 29.2: Filtro de leads por UF (M2)
- **Owner:** Dev
- **Descrição:** Em `dashboard.html` e `dashboard.js`, adicionar dropdown de filtro UF (extrair de `lead.endereco` ou novo campo `uf` na coleção).

#### Tarefa 29.3: Paginação cursor Firestore (M3)
- **Owner:** Dev
- **Descrição:** Em `firebase.js`, refatorar `dbGetLeads` para receber `lastDoc` e usar `startAfter(lastDoc)`:
```js
async function dbGetLeadsPage({ pageSize = 50, lastDoc = null }) {
  let q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(pageSize));
  if (lastDoc) q = query(q, startAfter(lastDoc));
  // ...
}
```

#### Tarefa 29.4: Self-host de assets (acessibilidade offline) (M12)
- **Owner:** Dev
- **Descrição:** Baixar `html2pdf.bundle.min.js` para `public/` e atualizar `<script src>` em `proposta.html`.

#### Tarefa 29.5: Export CSV de leads (M5)
- **Owner:** Dev
- **Descrição:** Em `dashboard.js`, adicionar:
```js
function exportLeadsToCSV(leads) {
  const headers = ['Nome', 'Telefone', 'Email', 'Endereço', 'Consumo (kWh)', 'Data', 'Status'];
  // constrói CSV...
}
```

---

### 💰 SPRINT 30 — Integrações Comerciais (Prioridade Alta)

**Duração estimada: 2-3 semanas**

#### Tarefa 30.1: FCM Push Notifications (M11) — BLOQUEADO
- **Pré-requisito:** Chave **VAPID** no Firebase Console → Cloud Messaging.
- **Owner:** DevOps (gerar chave) + Dev (integrar SDK)
- **Pendente CONTEXT.md**

#### Tarefa 30.2: SendGrid para emails (M12) — BLOQUEADO
- **Pré-requisito:** Conta SendGrid + API Key + Template pré-aprovado.
- **Owner:** Admin (criar conta) + Dev (integrar)
- **Uso:** Email de proposta enviada, email de contrato, email de boas-vindas.

#### Tarefa 30.3: Mercado Pago/Asaas (M13) — BLOQUEADO
- **Pré-requisito:** Conta Mercado Pago + Access Token + Webhook configurado.
- **Owner:** Financeiro (criar conta) + Dev (integrar)
- **Uso:** Geração de Pix/Boleto na assinatura digital da proposta.

#### Tarefa 30.4: WhatsApp Business API (CONTEXT.md pendency 5)
- **Pré-requisito:** App Meta Business verificado + Token permanente.
- **Owner:** Admin Spark (criação) + Dev (integrar template)
- **Uso:** Envio automático da proposta via WhatsApp Business.

#### Tarefa 30.5: Cloud Function backup (M10)
- **Pré-requisito:** Plano Firebase Blaze.
- **Owner:** DevOps
- **Descrição:** Implementar função agendada que semanalmente exporta `leads`, `propostas`, `equipamentos` para Firebase Storage.

#### Tarefa 30.6: Crashlytics/Sentry (CONTEXT.md)
- **Pré-requisito:** Ativar Firebase Crashlytics + API Key Sentry.
- **Owner:** DevOps

---

### 📈 SPRINT 31 — Features Avançadas

**Duração estimada: 2-4 semanas**

#### Tarefa 31.1: Cotação automática de fornecedores (M16)
- **Pré-requisito:** Estrutura de preços de fornecedores em `fornecedores.html`.
- **Owner:** Dev
- **Descrição:** Em `calculator.js`, importar `getFornecedores()` e buscar menor preço para cada SKU automaticamente.

#### Tarefa 31.2: Gestão de estoque (M15)
- **Pré-requisito:** Coluna `quantidade` adicionada à coleção `equipamentos`.
- **Owner:** Dev/Admin
- **Descrição:** Reservar equipamentos ao fechar lead (status="Fechado"). Liberar reserva se proposta cancelar.

#### Tarefa 31.3: Tour guiado de onboarding (M14)
- **Owner:** Dev
- **Biblioteca recomendada:** `driver.js` (mais leve que intro.js)
- **Etapas:** Welcome → Dashboard → KPIs → Kanban → Propostas → Backup

#### Tarefa 31.4: PWA completo + Offline mode
- **Pré-requisito:** Adicionar background sync.
- **Owner:** Dev
- **Descrição:** Permitir criar simulações offline e sincronizar quando voltar online.

#### Tarefa 31.5: Versão mobile responsiva (M4)
- **Owner:** Dev/Design
- **Descrição:** `proposta.html` precisa de breakpoints mobile dedicados (a <768px o layout de 3 colunas empilha errado).

---

## 📋 Resumo de Prioridades

| Sprint | Tipo | Duração | Risco | Impacto |
|--------|------|---------|-------|---------|
| 25 | 🔴 Bugs críticos | 1-2 dias | Alto | Bloqueante |
| 26 | 🟠 Refatoração | 3-5 dias | Médio | Qualidade |
| 27 | 🟡 Precisão/métricas | 3-5 dias | Baixo | Conformidade |
| 28 | 🎨 UX/Validações | 3-5 dias | Baixo | Conversão |
| 29 | 📊 Crescimento | 1-2 sem | Médio | Retenção |
| 30 | 💰 Integrações | 2-3 sem | Alto | Receita |
| 31 | 📈 Advanced | 2-4 sem | Médio | Escala |

---

## ✅ Próxima Ação Imediata

Iniciar **SPRINT 26** com:

1. **Tarefa 26.1** — Banco de equipamentos unificado (B1, B4, B5) ✅ CONCLUÍDO
2. **Tarefa 26.2** — Remover campo órfão `percentualAutoconsumo` (B2) ✅ CONCLUÍDO
3. **Tarefa 26.3** — Usar `getTipoClienteConfig` no calculator (B3) ✅ CONCLUÍDO
4. **Tarefa 26.4** — Refatorar TIR para matemática anual nativa (B6) ✅ CONCLUÍDO
5. **Tarefa 26.5** — Remover fallback hardcoded em `pdf.js` (B7) ✅ CONCLUÍDO

Após validação → seguir para SPRINT 27.

---

## 🚀 Deploy e Infraestrutura (Atualizações Recentes)

### Deploy Firebase Hosting
- **Projeto**: `solarcrm-60ce1`
- **URL**: https://solarcrm-60ce1.web.app
- **Configuração**: `firebase.json` com rewrite `/` → `/spark-site/index.html`
- **Fluxo deploy**: `firebase deploy --only hosting`

### Estrutura de Rotas
| Rota | Destino | Descrição |
|------|---------|-----------|
| `/` | `/spark-site/index.html` | Landing page (site institucional) |
| `/simulador.html` | `simulador.html` | Simulador público de economia solar |
| `/login.html` | `login.html` | Autenticação de vendedores/admin |
| `/dashboard.html` | `dashboard.html` | Painel de vendas (requer auth) |

### Arquivos .gitignore
- `firebase.json` adicionado ao `.gitignore`
- `.firebase/` adicionado ao `.gitignore`
- `nul` (arquivo dispositivo Windows) adicionado ao `.gitignore`

### Correções de Deploy
- Removido `node_modules` do commit acidental
- Corrigido `nul` file que impedia `git add`
- Ajustado paths relativos para funcionar em produção

---

## 🔄 Atualizações Recentes (15/07/2026)

### Fase 27 — Correções Categoria A e B (concluídas)

| Item | Status | Alteração realizada |
|------|--------|---------------------|
| A4 | ✅ Concluído | `proposta.js` já protegia acesso a `lead-cidade` com `if (leadCidadeEl)`. |
| B1/B4/B5 | ✅ Concluído | `firebase.js` agora importa `EQUIPAMENTOS` de `equipamentos.js` como fonte única. |
| B2 | ✅ Concluído | Removido campo órfão `percentualAutoconsumo` de `config.js`. |
| B3 | ✅ Concluído | `calculator.js` agora usa `getTipoClienteConfig()` ao invés de ternário hardcoded. |
| B6 | ✅ Concluído | TIR refatorada para matemática anual nativa; `tirMensal` é derivado de `tirAnual`. |
| B7 | ✅ Concluído | Removidos fallbacks hardcoded em `pdf.js`; agora exibe `—` quando `configs` não existe. |
| B8 | ✅ Concluído | `diasNoMes()` aplicado na geração mensal; média anual de 30.44 dias. |
| B9 | ✅ Concluído | Função renomeada para `gerarSaldoAnoAAno` em `financeiro.js` e `calculator.js`. |
| B11 | ✅ Concluído | Slider de entrada em `proposta.js` atualiza tabela de financiamento imediatamente. |
| B12 | 🔄 Em análise | Google Fonts via `@import` continua ativo; não foi alterado para não impactar produção. |
| B13 | 🔄 Em análise | Measurement ID mantido localmente até validação do analytics no Firebase. |
| B14 | ✅ Concluído | Adicionada `mobile-web-app-capable` em `simulador.html`. |
| B15 | ✅ Concluído | Novos rewrites adicionados no `firebase.json` para rotas principais. |
| B16 | ✅ Concluído | Regras Firestore deployadas via CLI. |

### Deploy e Infraestrutura

| Item | Status | Observação |
|------|--------|-----------|
| Firebase Hosting | ✅ Concluído | Deploy realizado em 15/07/2026. |
| Firestore rules | ✅ Concluído | Deploy via CLI realizado com sucesso. |
| Rotas SPA | ✅ Concluído | Rewrites configurados para `/simulador`, `/login`, `/dashboard`, `/proposta`, `/historico` e `/lead`. |
| `import.meta.env` | ✅ Concluído | Adicionada função `getEnv()` em `firebase.js` para evitar `TypeError` em produção. |
| `manifest.json` / `sw.js` | ✅ Concluído | Movidos para a raiz do projeto para correto funcionamento do PWA. |

### 🔴 Pendências Atuais e Motivo

| Item | Por que não foi feito ainda |
|------|-----------------------------|
| A1 / A2 | ✅ Já resolvidos em sprint anterior. |
| A3 | ✅ Já resolvido em sprint anterior. |
| B10 | Não auditado completamente; requer análise manual de `dashboard.js` para confirmar se há falhas de `null` em `profile.role`. |
| B12 | Google Fonts continua funcionando; alteração para self-host é recomendada, mas não é bloqueante. |
| B13 | Analytics está operando; ajuste do Measurement ID é baixo risco e pode ser validado posteriormente. |
| C1 | Alteração de copy do WhatsApp depende de validação de marketing/comercial. |
| C2 | Ajuste de timeout do toast é baixo risco; não foi priorizado nesta sprint. |
| C3 | Tooltip de segurança depende de decisão de produto sobre selos LGPD. |
| C4 | Validação em `calculator.js` demanda refatoração maior; será feita em sprint própria. |
| C5 | Depende da conclusão de C4 para evitar duplicidade de validação. |
| C6 | Baixo impacto; será revisitado durante SPRINT 28. |
| C7 | Baixo impacto; será revisitado durante SPRINT 28. |
| M1 | Depende de base de dados regional consolidada. |
| M2 | Requer modelagem de campo `uf` em `leads`. |
| M3 | Refatoração de cursor Firestore será feita em sprint dedicada. |
| M4 | Requer design mobile específico para `proposta.html`. |
| M5 | Baixo impacto; será feita em SPRINT 29. |
| M6 | Internacionalização demanda estrutura de i18n completa. |
| M7 | Baixo impacto na precisão atual. |
| M8 | Acessibilidade será tratada em SPRINT 28. |
| M9 | Depende de validação jurídica do texto do consentimento. |
| M10 | Requer Cloud Function + Firebase Blaze. |
| M11 | Bloqueado por credenciais externas (VAPID). |
| M12 | Bloqueado por credenciais externas (SendGrid). |
| M13 | Bloqueado por credenciais externas (Mercado Pago/Asaas). |
| M14 | Decisão de biblioteca/etapas ainda pendente. |
| M15 | Requer alteração no modelo de dados + workflow de reserva. |
| M16 | Requer estrutura de cotações em `fornecedores.html`. |

---

## 📅 Próximos Passos Recomendados

1. **Validar em produção** as rotas `/simulador`, `/login` e `/dashboard` após deploy.
2. **Sprint 28** — UX/validações (C1, C2, C3, C4, C5, C6, C7, M8, M9).
3. **Sprint 29** — Features de crescimento (M1, M2, M3, M5).
4. **Sprint 30** — Integrações bloqueadas por credenciais (M10-M13).
5. **Sprint 31** — Features avançadas (M14-M16).

---

**Versão deste documento:** 2.2 · **Data:** 15/07/2026  
**Autor da atualização:** Kilo + revisão manual  
**Próxima revisão:** após deploy de validação de rotas

---

## 🔄 Atualizações Recentes (15/07/2026 — parte 2)

### Correções pós-sprint 27

| Item | Status | Alteração realizada |
|------|--------|---------------------|
| `MESES` export | ✅ Concluído | `src/js/irradiacao.js` não exportava `MESES`, `ORIENTACAO_LABELS` e `ESTADO_ANOMALIA` após refatoração; restaurado. |
| `import.meta.env` | ✅ Concluído | Adicionada função `getEnv()` em `src/js/firebase.js` para evitar `TypeError` quando `import.meta.env` não existe em produção. |
| Measurement ID | ✅ Concluído | Alinhado fallback local do `measurementId` para `G-XQQZCQ1FE9`, removendo aviso do Firebase Analytics. |
| TIR na proposta | ✅ Concluído | `tir_mensal`/`tir_anual` agora são salvos como campos flat em `app.js` e lidos em `proposta.js`, evitando `—` na proposta. |
| Simulador LGPD/footer | ✅ Concluído | Link LGPD atualizado para `.../_ato2015-2018/2018/lei/l13709.htm`; emoji 🧮 removido do título; footer passa a exibir “Desenvolvido por Cerrado Tech” com link para `https://www.cerradofinancas.com.br/`. |

---

## ✅ Concluído — Tour Guiado Onboarding (Fase 28)

| Item | Status | Alteração realizada |
|------|--------|---------------------|
| Biblioteca escolhida | ✅ Concluído | Selecionado `driver.js` (MIT, ~5KB, framework-agnostic, sem restrições comerciais). |
| Integração no dashboard | ✅ Concluído | Adicionado CSS e JS do driver.js via CDN em `dashboard.html`. |
| Botão de início | ✅ Concluído | Novo botão `#btnTour` no header com ícone de livro. |
| Passos do tour | ✅ Concluído | 6 passos mapeados: indicadores, busca, filtros, tabela, configurações e notificações. |

---

## ✅ Concluído — Gestão de Estoque (Fase 30)

| Item | Status | Alteração realizada |
|------|--------|---------------------|
| Funções de estoque | ✅ Concluído | Adicionadas em `firebase.js`: `getEstoqueDisponivel`, `reservarEstoque`, `liberarEstoque`, `confirmarReserva`, `atualizarEstoque`. |
| Validação no cálculo | ✅ Concluído | `calculator.js` valida estoque de painel, inversor e estrutura antes de gerar proposta. |
| Reserva automática | ✅ Concluído | `app.js` reserva estoque ao gerar proposta no simulador público. |
