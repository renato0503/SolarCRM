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
| A4 | 🔴 Crítico | `src/js/proposta.js:64` | Acesso direto a `lead-cidade` que não existe em `proposta.html` (apenas em `pdf.html`). Lançava `TypeError: Cannot set properties of null`. ✅ JÁ CORRIGIDO |

### Categoria B — Bugs Moderados (causam inconsistência ou duplicação)

| # | Severidade | Local | Problema |
|---|------------|-------|----------|
| B1 | 🟠 Alto | `src/js/equipamentos.js` × `src/js/firebase.js:getEquipamentosLocais()` | Bancos de equipamentos **duplicados e ligeiramente divergentes**: `equipamentos.js:6-12` lista 6 painéis (DAH 620, Ronma 610, Sunova 590, Sunova 570, Jinko 585, JA Solar 550w), enquanto `firebase.js:566-571` (em `getEquipamentosLocais`) lista só 5 (sem Sunova 570W). Inversores: `equipamentos.js` tem 19; `firebase.js` tem 16 (sem `inv_gro_25`, `inv_gro_30` e `inv_fro_20`). |
| B2 | 🟠 Alto | `src/js/config.js:19` | `percentualAutoconsumo: 0.25` é definido em `defaultSettings` mas **NÃO é mais usado**. O código usa `TIPO_CLIENTE_CONFIG[autoconsumo]` em `calculator.js:114-115`. Campo órfão que pode dar correção enganosa se voltar a ser usado. |
| B3 | 🟠 Alto | `src/js/calculator.js:114-115` | A constante `autoconsumo` tem codificação manual por tipo de cliente (`tipo_cliente === 'comercial' ? 0.70`...). Deveria consumir `getTipoClienteConfig(tipoClie nte)` (definida em `config.js:86`) para manter **fonte única de verdade** (`Single Source of Truth`). |
| B4 | 🟠 Alto | `src/js/equipamentos.js` × `src/js/firebase.js:getEquipamentosLocais()` | Banco `equipamentos.js` é exportado mas **NUNCA IMPORTADO** em nenhum lugar. Está morto, agravando o problema B1. Apenas `getEquipamentosLocais()` (no firebase.js) é usado. |
| B5 | 🟠 Alto | `src/js/firebase.js:566` (em `getEquipamentosLocais()`) | Campo `area: 2.76` hardcoded para DAH Solar; usa fórmula alternativa só se faltar (`calc ulator.js:46`), sem padronizar com `equipamentos.js` que pode ter dados divergentes (área 2.58 ou 2.16). |
| B6 | 🟠 Alto | `src/js/financeiro.js:5-12` (Newton-Raphson) | Cálculo de TIR opera com **fluxos anuais mas converte para mensal** (`tirAnual = ((1+tirMensal)^12 - 1) × 100` em `calculator.js:135`). Assumindo economia ANUAL recebida em uma única parcela ao fim do ano. **Deveria** ser fluxo mensal ou aplicar matemática anual direta. |
| B7 | 🟠 Alto | `src/js/pdf.js:117` | `fio-percentual` exibe fallback hardcoded `28.5` quando `configs` não existe (proposta antiga). Se um cliente sem `dados_completos` for chamado, mostrará valor errado. |
| B8 | 🟡 Médio | `src/js/calculator.js:39` | Fórmula de dimensionamento usa **30 dias fixos por mês**. Não considera meses de 28-31 dias — diferença de até 10% em fevereiro. |
| B9 | 🟡 Médio | `src/js/financeiro.js:116-125` (`gerarFluxoCaixaAcumulado`) | Nome da função diz "acumulado" mas **retorna lista de saldos pontuais ano a ano**, não o acumulado mês a mês. Clientes podem interpretar errado se virem o nome. |
| B10 | 🟡 Médio | `src/js/dashboard.js` | Não auditado nesta revisão, mas provável que tenha referências inconsistentes a `profile.role` sem checar `null` (caso admin não tenha perfil). |
| B11 | 🟡 Médio | `src/js/proposta.js:155` | Chama `gerarTabelaFinanciamento` quando slider de entrada muda, mas **não atualiza automaticamente** o valor do parcelamento se a tarifa do slider mudar (já está OK, só verificar). |
| B12 | 🟡 Médio | `src/css/style.css:1` | Importa `https://fonts.googleapis.com/css2?...&family=Outfit...` no `@import`. Google Fonts é bloqueado em algumas redes corporativas; precisa self-host ou fallback. |
| B13 | 🟡 Médio | `public/firebase.ts` (analytics) | `Measurement ID` local `G-XQQZCQQ1FE9` diverge do servidor `G-XQQZCQ1FE9` (faltou um `Q`). Analytics events podem cair no projeto errado. |
| B14 | 🟡 Médio | `index.html:11` | Meta tag `apple-mobile-web-app-capable="yes"` está marcada como **deprecated**. Console mostra warning constante. Migrar para `mobile-web-app-capable`. |
| B15 | 🟡 Médio | `firebase.json` | Não tem **rewrites** para SPA fallback. Refresh em rotas como `dashboard.html` funciona, mas rotas com hash tipo `#/alguma-coisa` falham em production. |
| B16 | 🟡 Médio | Firestore rules (locais) | `firestore.rules` local foi atualizado, mas o **deploy via CLI** ainda não foi feito (separadamente do `firebase deploy --only hosting`). Apenas Console foi atualizado. |

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
| M1 | Dataset | `src/js/irradiacao.js` | Adicionar cobertura por estado brasileiro (SP, RJ, MG, MT, MS, GO, BA, SC, PR, RS). Hoje só compila Cuiabá-MT. |
| M2 | Feature | `dashboard.html` | Adicionar **filtro por cidade/estado** (vinculado à tabela leads). Espelha `uf` que vem do calendário. |
| M3 | Performance | `firebase.js` (`dbGetLeads`) | Adicionar **paginação real com cursor Firestore** (`startAfter`) ao invés de pegar até 50 e cortar. |
| M4 | Feature | `proposta.html` | Adicionar **versão mobile** otimizada com progressive enhancement. Hoje o layout é assumido "desktop". |
| M5 | Export | `dashboard.html` | Adicionar **export CSV** de leads além do JSON atual. |
| M6 | Internacionalização | `src/js/utils.js` | Mensagens em pt-BR hardcoded; considerar i18n com JSON. |
| M7 | Energia | `calculator.js:39` | Considerar **perdas por temperatura** (módulo aquece 25°C acima ambiente) — subtrair degradação extra do PR. |
| M8 | Acessibilidade | `index.html` | Falta `aria-live` em mensagens de erro e `aria-current` em breadcrumb. |
| M9 | LGPD | Tela de simulação | Adicionar **checkbox de consentimento** explícito ("Aceito receber contato conforme LGPD"). |
| M10 | Backup | `firebase.js` | Implementar **Cloud Function** para backup automático JSON → Firebase Storage (já indicada como pendência no CONTEXT.md). |
| M11 | Notificações | CONTEXT.md indica | **FCM Push** para vendedores (requer chave VAPID) — pendente há várias sprints. |
| M12 | Email | New flow | **SendGrid para emails transacionais** (proposta enviada, contrato) também pendente. |
| M13 | Pagamento | New flow | Gateway **Mercado Pago/Asaas** para Pix/Boleto na assinatura da proposta pendente. |
| M14 | Onboarding | Spr int 21 indica | Tour guiado para novos vendedores (driver.js/intro.js). |
| M15 | Estoque | Sprint 24 indica | Adicionar **quantidade disponível** + **reserva ao fechar lead** por SKU. |
| M16 | Cotação | Sprint 24 indica | Cotação automática integrando `fornecedores.html` → `calculator.js` para escolha de menor preço. |

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

Iniciar **SPRINT 25** com:

1. **Tarefa 25.1** — Recriar tabelas de irradiação com dados CRESESB (A1+A2) ✅ INICIAR
2. **Tarefa 25.2** — Corrigir CSS `pricing-card` (A3) → já parcialmente corrigido com `!important`

Após validação → seguir para SPRINT 26.

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

**Versão deste documento:** 2.0 · **Data:** 15/07/2026  
**Autor da auditoria:** Análise técnica automatizada + atualizações manuais  
**Próxima revisão:** após implementação de Sprint 25
