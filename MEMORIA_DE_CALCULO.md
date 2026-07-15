# 📋 Memória de Cálculo — Proposta Comercial Solar

> Documento técnico auditado em **15/07/2026** para validação do cliente.  
> Mostra **a origem de cada número** exibido na proposta comercial, garantindo transparência total sobre o cálculo.

---

## 1. Sobre a Spark CRM

A Spark é uma empresa de engenharia elétrica, especializada em **projetos de energia solar fotovoltaica** residenciais, comerciais e rurais. Possui uma equipe interna que realiza cada etapa, do **projeto de engenharia**, **ART** (Anotação de Responsabilidade Técnica), **homologação** junto à distribuidora local e **instalação completa** do sistema.

A memória de cálculo apresentada abaixo está escrita pensando no cliente — qualquer pessoa, com ou sem formação técnica, deve ser capaz de verificar o que está pagando e por que o investimento faz sentido financeiro.

---

## 2. Dados de Entrada do Sistema

O cliente informa os dados abaixo durante a simulação. Cada um deles impacta diretamente o dimensionamento e o preço final.

| Variável | Descrição | Origem |
|----------|-----------|--------|
| **Consumo médio mensal** (kWh) | Quanto de eletricidade o cliente consome por mês | Conta de luz |
| **CEP de instalação** | Localização geográfica, usada para cálculo de frete | Informado pelo cliente |
| **Tipo de telhado** | Cerâmica, metálica, fibrocimento, fibro_madeira ou laje | Informado pelo cliente |
| **Orientação** | Para onde o telhado está voltado (N, NE, E, SE, S, SO, O, NO) | Informado pelo cliente ou estimada |
| **Inclinação** | Ângulo do telhado em graus (5°, 10°, 15°, 20°, 25°) | Informado ou estimada |
| **Tipo de ligação** | Monofásico (220V), Bifásico (220V) ou Trifásico (380V) | Conta de luz |
| **Tipo de cliente** | Residencial, Comercial ou Rural | Informado |

---

## 3. Conceitos Fundamentais (em linguagem simples)

Antes de entrarmos nas fórmulas, três conceitos precisam estar claros:

### 3.1 HSP — Horas de Sol Pleno
> É o **número de horas por dia em que o sol brilha com intensidade suficiente** para o painel funcionar no máximo da capacidade.
>
> - **HSP 5,04** significa: o painel de 620W gera **5,04 horas × 620W = 3,12 kWh por dia**, nas condições ideais.

A tabela oficial usada (`src/js/irradiacao.js`) contém **480 valores únicos** de irradiação medidos:
- **8 orientações cardeais × 5 ângulos × 12 meses do ano**

Esses dados são tabelados e foram calibrados para Cuiabá-MT e o Centro-Oeste brasileiro. Variações sazonais (menos sol em junho/julho, mais em outubro/dezembro) já estão embutidas mês a mês.
Atualização 13/07/2026: Dados de inclinação 5° para orientação Norte foram adicionados e as tabelas de orientação S/SE e E/O corrigidas.
Atualização 15/07/2026: Adicionado fator de correção por estado (`ESTADO_ANOMALIA`) para todas as UFs brasileiras.

### 3.2 Performance Ratio (PR)
> É uma porcentagem que **corrige as perdas reais**.
>
> Tudo o que diminui a eficiência do sistema na vida real: poeira sobre os módulos, perdas nos cabos, eficiência do inversor, calor excessivo, sombras parciais.
>
> - Usamos **PR = 0,78 (78%)** — valor conservador e compatível com o padrão ANEEL/INPE para fins de simulação financeira.
> - Aplica-se também **perda por temperatura**: -0,4% por °C acima de 25°C no ambiente, refletindo a queda de eficiência dos módulos em temperaturas elevadas.

### 3.3 Lei 14.300 / Fio B
> Desde 2023, **toda energia injetada na rede paga pelo uso desta rede** (chamado "Fio B" — Uso do Sistema de Distribuição). O percentual aumenta progressivamente:
>
> - 2023: 15% → 2024: 30% → 2025: 45% → **2026: 60%** → 2027: 75% → 2028: 90% → 2029+: 100%
>
> A proposta já considera essa cobrança progressiva, mostrando **6 anos de projeção** com o Fio B real, ano a ano.

---

## 4. Fluxo Completo de Cálculo

A Spark CRM utiliza um **fluxo de cálculo em 16 etapas**, executado em `src/js/calculator.js`. A sequência é:

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 1: Ler tarifas, HSP, Fio B, PR, margem atual       │
│  (config.js → getSettings)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 2: Consultar irradiacao.js para obter HSP/          │
│  irradiação mensal da orientação+inclinação escolhidas     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 3: Dimensionar potência e número de painéis         │
│  Fórmula: Potência kWp = Consumo ÷ (HSP × 30 × PR)        │
│  → Arredondar para cima (nº inteiro de painéis)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 4: Selecionar inversor adequado                     │
│  (compatível com a tensão do cliente + potência ≥ 70%)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 5: Calcular Valor do Kit (custo dos equipamentos)   │
│  Painéis + Inversor + Estrutura + Kit Elétrico             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 6: Calcular Custos Adicionais                       │
│  Serviços (engenharia + instalação) + Frete                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 7: Aplicar Margem de Lucro (fator preço)            │
│  Preço calculado = Custo total × (1 + Margem%)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 8: Aplicar Imposto sobre lucro (8,5% Simples)      │
│  Apenas a parte do lucro paga imposto                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 9: Calcular Preço Final                             │
│  Preço Final = Preço Calculado − Imposto                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 10: Margem de Lucro Efetiva                         │
│  Mostrar o lucro REAL depois de impostos                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 11: Calcular Geração Estimada (kWh/mês)             │
│  Potência × HSP × 30 × PR                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 12: Calcular Conta com Sistema vs Sem Sistema       │
│  Considerando consumo faturado mínimo, autoconsumo, Fio B│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 13: Gerar Projeção de 6 anos (por ano)              │
│  Considera inflação de tarifa + progressão do Fio B       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 14: Calcular TIR e Payback                          │
│  TIR via Newton-Raphson / Payback via fluxo acumulado       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 15: Simular Financiamento (8 bancos)                │
│  Tabela Price com taxas reais de mercado                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 16: Calcular Impacto Ecológico                      │
│  CO₂ evitado + árvores equivalentes                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Fórmulas Detalhadas (um número de cada vez)

### 5.1 Dimensionamento do Sistema

**Fórmula:**
```
Potência necessária (kWp)     = Consumo mensal ÷ (HSP × 30,44 × PR)
                                           500 ÷ (5,04 × 30,44 × 0,78)
                                           500 ÷ 119,79
                                        =  4,17 kWp
```

**Número de painéis:**
```
Nº painéis                  = Arredondar para cima ( Potência necessária ÷ Potência por painel )
                            = Ceil ( 4,24 ÷ 0,620 )
                            = 7 painéis  (potência real 7 × 620W = 4,34 kWp)
```

**Por que arredondar para cima?**
> Porque a Spark prefere **sistema ligeiramente maior do que o necessário**. Isso garante que o cliente produza **um pouco mais do que consome**, garantindo créditos energéticos para cobrir meses de menor geração (época de chuvas).

### 5.2 Área Necessária

**Fórmula:**
```
Área (m²)                   = Nº painéis × Área de cada painel
                            = 7 × 2,76 m²
                            = 19,32 m²
```

> É a área de telhado que será ocupada pelos módulos fotovoltaicos. Espaçamento entre fileiras já é considerado pelos especialistas durante o projeto executivo.

### 5.3 Seleção do Inversor

O software escolhe o inversor compatível com o tipo de ligação e cuja potência nominal esteja entre **70% e 130%** da potência do gerador solar.

**Fórmula:**
```
Potência alvo               = kWp do sistema × 1000 (W)
                            = 4,34 × 1000 = 4.340 W
                              (procuramos inversor com potenciaMaxW entre 3.038 W e 6.462 W)
```

> O inversor Sofar 6KTLM-G2 (6000W) é compatível com a tensão bifásica 220V e atende esse requisito com folga. **Inversor dimensionado corretamente**.

### 5.4 Valor do Kit (Custo dos Equipamentos)

**Fórmula:**
```
Painéis                     = Nº painéis × Preço unitário painel
                            = 7 × R$ 410,00 = R$ 2.870,00

Inversor                    = 1 × Preço do inversor
                            = 1 × R$ 2.500,00 = R$ 2.500,00

Estrutura                   = Nº painéis × Preço estrutura por painel
                            = 7 × R$ 110,00 = R$ 770,00

Kit elétrico                = Preço base + (Preço kW adicional × Potência real)
                            = R$ 1.100 + (R$ 120 × 4,34)
                            = R$ 1.100 + R$ 520,80 = R$ 1.620,80

Valor do Kit                = Painéis + Inversor + Estrutura + Kit elétrico
                            = R$ 2.870 + R$ 2.500 + R$ 770 + R$ 1.620,80
                            = R$ 7.760,80
```

### 5.5 Custos Adicionais (Serviços + Frete)

**Fórmula:**
```
Custo Serviços              = Custo fixo + (Custo por kWp × Potência real) + Taxa Localidade
                            = R$ 2.200 + (R$ 350 × 4,34) + R$ 0
                            = R$ 2.200 + R$ 1.519 + R$ 0
                            = R$ 3.719,00
```

> A **taxa de localidade** é cobrada quando a distância entre a Spark e o local da instalação é superior a 15 km:
> - Até 15 km: R$ 0
> - De 15 a 25 km: R$ 250,00 adicionais ao serviço
> - Acima de 25 km: R$ 450,00 adicionais ao serviço

**Frete (3 faixasbaseado na distância):**
```
Até 15 km    → R$ 350,00 (mínimo)
15 a 25 km   → R$ 650,00 (médio)
Acima de 25km→ R$ 1.100,00 (máximo)
```

> A distância é calculada em tempo real via **Nominatim (OpenStreetMap)**, **ViaCEP** e **BrasilAPI**. A coordenada do CEP do cliente é comparada com o centro de sua cidade para definir a faixa.

```
Custos adicionais totais    = Custo serviços + Frete
                            = R$ 3.719,00 + R$ 350,00
                            = R$ 4.069,00
```

### 5.6 Fator de Preço (Margem de Lucro)

**Fórmula:**
```
Fator de preço              = 1 + (Margem / 100)
                            = 1 + (45 / 100)
                            = 1,45
```

**Preço Calculado (com margem):**
```
Valor do Kit com markup     = Valor do Kit × Fator
                            = R$ 7.760,80 × 1,45 = R$ 11.253,16

Custos adicionais com markup
                            = R$ 4.069,00 × 1,45 = R$ 5.899,05

Preço calculado             = R$ 11.253,16 + R$ 5.899,05
                            = R$ 17.152,21
```

### 5.7 Imposto (Simples Nacional)

A empresa Spark é optante do **Simples Nacional** com tributação sobre o **lucro bruto** (receita menos deduções), com alíquota configurada em **8,5%**.

**Fórmula:**
```
Custo direto total          = Valor do Kit + Custos adicionais
                            = R$ 7.760,80 + R$ 4.069,00
                            = R$ 11.829,80

Lucro bruto                 = Preço calculado − Custo direto
                            = R$ 17.152,21 − R$ 11.829,80
                            = R$ 5.322,41

Imposto                     = Lucro bruto × Alíquota
                            = R$ 5.322,41 × 0,085
                            = R$ 452,40
```

### 5.8 Preço de Venda Final

**Fórmula:**
```
Preço Final                 = Preço calculado − Imposto
                            = R$ 17.152,21 − R$ 452,40
                            = R$ 16.699,81
```

### 5.9 Margem de Lucro Efetiva

> A margem **bruta** exibida na proposta como "Fator Preço" é de 45%, mas a margem **efetiva** que a Spark lucra é menor, porque paga 8,5% de imposto sobre o lucro.

**Fórmula:**
```
Margem efetiva (%)          = (Preço Final − Custo direto) ÷ Preço Final × 100
                            = (R$ 16.699,81 − R$ 11.829,80) ÷ R$ 16.699,81 × 100
                            = R$ 4.870,01 ÷ R$ 16.699,81 × 100
                            ≈ 29,16%
```

> **Transparência**: o cliente vê os dois números:
> - **Fator Preço / Margem Nominal: 45%** (aplicada sobre cada item)
> - **Margem de Lucro Efetiva: 29,16%** (quanto sobra REALMENTE após impostos)
>
> A diferença de ~16% representa a carga tributária aplicada.

### 5.10 Geração de Energia Estimada

**Fórmula:**
```
Geração estimada (kWh/mês)  = Potência real × HSP × 30,44 × PR
                             = 4,34 kWp × 5,04 × 30,44 × 0,78
                             = 517 kWh/mês
```

> **Como interpretar:** um sistema que gera **512 kWh/mês** cobre **102,4%** do consumo de 500 kWh. A sobra de 12 kWh vira crédito acumulado para compensar meses futuros (inverno com menos sol).

**Geração anual** = 512 × 12 = **6.144 kWh/ano**

**Geração por mês (detalhada)**
> Não é constante! A tabela de irradiação mensal mostra variação de ~75% no pior mês (junho) até ~120% no melhor mês (setembro/outubro).

```
Jan:  491 kWh     Mai:  580 kWh     Set:  472 kWh
Fev:  492 kWh     Jun:  492 kWh     Out:  555 kWh
Mar:  523 kWh     Jul:  600 kWh     Nov:  495 kWh
Abr:  559 kWh     Ago:  520 kWh     Dez:  534 kWh
```

---

## 6. Análise Financeira

### 6.1 Conta de Luz Sem Sistema

**Fórmula:**
```
Conta sem sistema           = Consumo × Tarifa
                            = 500 kWh × R$ 1,08/kWh
                            = R$ 540,00/mês
                            = R$ 6.480,00/ano
```

### 6.2 Conta de Luz Com Sistema (Lei 14.300)

A conta **com sistema** considera **autoconsumo** (uso direto da energia gerada pelo telhado) e o resto é injetado na rede para gerar créditos.

**Premissas:**
- **Autoconsumo residencial = 25%** (cliente está em casa durante o dia, consome direto da geração)
- **Autoconsumo comercial = 70%** (commerce tem consumo alto em horário solar)
- **Autoconsumo rural = 30%**
- Esses valores são carregados de `getTipoClienteConfig()` em `config.js` e podem ser ajustados por configuração.

**Cálculo (exemplo residencial, ano 2026, Fio B = 60%):**
```
Energia gerada              = 512 kWh
Autoconsumo (25%)           = 512 × 0,25 = 128 kWh (consumo local)
Energia injetada            = 512 × 0,75 = 384 kWh (vai para a rede)

TUSD Fio B no ano 2026      = Tarifa Fio B (28,5%) × 60% (progressivo)
                            = R$ 0,285 × 0,60 = R$ 0,171/kWh

Crédito de injeção          = Energia injetada × (Tarifa total − TUSD Fio B)
                            = 384 × (1,08 − 0,171)
                            = 384 × 0,909 = R$ 349,06 em créditos

Consumo mínimo (Bifásico)   = 50 kWh (= R$ 50 × 1,08 = R$ 54,00)

Conta com sistema           = [(128 kWh × 1,08) − R$ 349,06 créditos]
                              + R$ 54,00 (custo disponibilidade)
                              (limitado a mínimo de R$ 54,00)
                            = R$ 54,00/mês
```

> **Interpretação:** o cliente **não paga conta de luz** porque seus créditos cobrem a fatura, ficando apenas com o **custo mínimo de disponibilidade** (taxa cobrada pela distribuidora por estar conectado à rede).

**Economia mensal = R$ 540 − R$ 54 = R$ 536/mês**

### 6.3 Projeção de 6 Anos (Fio B progressivo + inflação)

> A proposta mostra **uma tabela com 6 anos consecutivos**, considerando a Lei 14.300/22 e a inflação tarifária projetada em 8% ao ano.

**Premissa:**
```
Inflação tarifária          = 8% ao ano (configurável)
Progressão Fio B            = 15% → 30% → 45% → 60% → 75% → 90% ao longo de 2023-2028
```

| Ano | Sem Solar | Com Solar | Caixa Acumulado |
|------|-----------|-----------|-----------------|
| 2026 | R$ 6.480 | R$ 648 | −R$ 16.052 |
| 2027 | R$ 6.998 | R$ 904 | −R$ 9.957 |
| 2028 | R$ 7.558 | R$ 1.252 | −R$ 3.652 |
| 2029 | R$ 8.163 | R$ 1.679 | +R$ 1.890 ✓ |
| 2030 | R$ 8.816 | R$ 2.149 | +R$ 9.058 ✓ |
| 2031 | R$ 9.521 | R$ 2.658 | +R$ 16.638 ✓ |

> **Conclusão:** o sistema **se paga em ~3 anos e 10 meses**. Após o payback, o cliente continua economizando **R$ 9.521 − R$ 2.658 = R$ 6.863 por ano** durante o resto da vida útil do sistema (estimada em 25-30 anos).

### 6.4 Payback Detalhado

**Fórmula:**
```
Saldo inicial               = −Investimento
Para cada mês:
   Saldo += Economia mensal aplicada com inflação
Quando saldo ≥ 0:
   Payback = meses ÷ 12 anos
```

Quando o payback excede 25 anos, é mostrado como **25 anos** com aviso de que o sistema leva mais tempo para se pagar (cenário conservador para a empresa).

### 6.5 TIR (Taxa Interna de Retorno)

A TIR é calculada via método **Newton-Raphson** numérico. Representa a taxa de retorno anual que faz o VPL (Valor Presente Líquido) dos fluxos futuros ser igual a zero. A partir da TIR anual, deriva-se a TIR mensal por `(1 + TIR_anual)^(1/12) - 1`.

```
Fluxos de caixa:
Período 0: −R$ 16.699,81 (investimento inicial)
Período 1: +R$ 6.480 (economia ano 1)
Período 2: +R$ 6.998 (ano 2, com inflação 8%)
Período 3: +R$ 7.558 (ano 3)
Período 4: +R$ 8.163 (ano 4)
Período 5: +R$ 8.816 (ano 5)
Período 6: +R$ 9.521 (ano 6)

Resultado (exemplo): TIR anual ≈ 29,6% a.a.
TIR mensal ≈ 2,2% a.m.
```

**Interpretação:**
- Se o cliente investir R$ 16.700 num CDB render 1% a.m., recebe R$ 168 de rendimento.
- O sistema solar gera R$ 540/mês de economia (**3,2% a.m. sobre o investimento**).
- Considerando que após o payback o sistema continua gerando energia **por mais 20-25 anos**, o retorno écompativelmente alto.

### 6.6 Financiamento — Tabela Price por Banco

A ferramenta mostra uma **simulação de financiamento** com **8 bancos diferentes** e **8 prazos**, usando **Tabela Price** (parcelas fixas):

| Banco | Prazos | Taxa a.m. |
|-------|--------|-----------|
| BV / Santander | 12x a 36x | 1,49% |
| Bradesco / Banco do Brasil | 48x a 60x | 1,50% |
| Sicoob / Sicredi | 72x a 96x | 1,55% |
| BTG Pactual | 120x | 1,75% |

**Fórmula (Tabela Price):**
```
Parcela fixa                = Valor financiado × [ i × (1 + i)^n ] ÷ [ (1 + i)^n − 1 ]
Total pago                   = Parcela × n
Juros totais                = Total pago − Valor financiado
```

**Exemplo (R$ 16.700 financiados em 60x):**
```
i = 1,50% a.m., n = 60 parcelas
Parcela       = R$ 492,30/mês
Total pago    = R$ 29.538,00
Juros totais  = R$ 12.838,00
```

> O cliente pode usar o **slider de entrada** (0% a 50%) no simulador para ajustar:
> - 0% = Valor integral financiável em até 120x
> - 50% = Entrada de R$ 8.349 + saldo financiado

---

## 7. Desmembramento do Preço — Onde Vai Cada Real

Para total transparência, o PDF mostra **cada item cobrado e seu preço de venda separado**:

```
┌────────────────────────────────────────────────────────────────┐
│  ITEM                       │  Custo     │  Venda    │  Lucro  │
├────────────────────────────────────────────────────────────────┤
│  Módulos Fotovoltaicos (7x) │ R$ 2.870   │ R$ 4.161  │ 45%    │
│  Inversor (Sofar 6kW)       │ R$ 2.500   │ R$ 3.625  │ 45%    │
│  Estrutura metálica (cerâm.)│ R$   770   │ R$ 1.116  │ 45%    │
│  Mão de obra (Eng+ART)      │ R$ 3.719   │ R$ 5.393  │ 45%    │
│  Frete (R$ 350)             │ R$   350   │ R$   508  │ 45%    │
│  Kit elétrico + String Box  │ R$ 1.621   │ R$ 2.350  │ 45%    │
├────────────────────────────────────────────────────────────────┤
│  SUBTOTAL DOS EQUIPAMENTOS  │ R$ 7.761   │ R$ 11.253 │        │
│  SERVIÇOS + FRETE + Kits   │ R$ 4.069   │ R$ 5.899  │        │
│  TOTAL COM MARGEM           │            │ R$ 17.152 │        │
│  (-) Imposto (8,5%)         │            │ −R$   452 │        │
│  = PREÇO DE VENDA FINAL     │            │ R$ 16.700 │        │
└────────────────────────────────────────────────────────────────┘
```

> Todos os preços estão com **markup de 45%** (configurável em `config.js`). O imposto é deduzido apenas no final.

---

## 8. Resumo dos Resultados Técnicos

| Item | Valor | Como foi calculado |
|------|-------|---------------------|
| **Potência Instalada** | 4,34 kWp | 7 painéis × 620W |
| **Número de Módulos** | 7 módulos | Arredondamento para cima de 4,24 kWp necessários |
| **Marca do Módulo** | DAH Solar 620W Bifacial | 1º painel do banco de equipamentos (compatível) |
| **Inversor** | Sofar 6KTLM-G2 Bifásico | Match automático (bifásico + potencia 6000W) |
| **Área ocupada** | 19,32 m² | 7 painéis × 2,76 m² |
| **Eficiência Painel** | 22,6% | Especificação DAH Solar |
| **HSP médio diário** | 5,04 kWh/m²/dia | Média anual para N/10° em Cuiabá |
| **Performance Ratio** | 78% | Conservador / padrão ANEEL |
| **Geração estimada** | 512 kWh/mês | 4,34 × 5,04 × 30 × 0,78 |
| **Geração máxima mensal** | ~600 kWh (julho) | Pico da curva sazonal |
| **Geração mínima mensal** | ~480 kWh (junho) | Vale da curva sazonal |
| **Custo disponibilidade** | R$ 54,00 (bifásico 50 kWh) | Mínimo legal por tipo de ligação |
| **TUSD Fio B aplicado** | R$ 0,171/kWh em 2026 | 28,5% × 60% (progressivo) |

---

## 9. Considerações Finais

### ✅ O que a Spark GARANTE na proposta:

1. **Transparência total nos custos:** cada item que compõe o preço final está aberto no PDF, sem "taxas escondidas".
2. **Margem de lucro divulgada:** o cliente fica sabendo que a margem nominal é de 45%, e a efetiva após impostos é ~29%.
3. **Projeção conservadora:** consideramos inflação tarifária (8% a.a.) + progressão completa do Fio B. Estimativas mais otimistas não estariam de acordo com a legislação vigente.
4. **Dimensionamento sob medida:** o sistema é sempre ligeiramente maior que o consumo para garantir créditos em meses chuvosos.
5. **Equipamentos com garantia:**
   - Módulos: 15 anos (DAH, Ronma) ou 12 anos (outras marcas) para materiais + 25-30 anos para produtividade.
   - Inversores: 5 anos (padrão) + extensível para 10 anos (algumas marcas).

### ⚠️ Pontos de Atenção (Fatores que Podem Influenciar o Resultado Real)

1. **Tarifa de energia pode variar:** se a distribuidora aplicar reajuste tarifário acima de 8% a.a., a economia será MAIOR que o projetado.
2. **Geração pode variar:** condições climáticas excepcionais (acima de seca), sombreamento real e performance real dos módulos podem fazer a geração ficar 5-10% abaixo do projetado.
3. **Fio B após 2029:** A partir de 2029, o percentual atinge 100% — pode haver revisão futura da legislação que altere o cálculo (Spark atualiza a fórmula assim que houver mudanças).
4. **Comportamento de consumo:** se o cliente MUDAR padrão (passar a trabalhar em casa, por exemplo), o autoconsumo aumenta, melhorando a economia.
5. **Créditos acumulados:** os primeiros 2-3 meses podem acumular créditos por superdimensionamento — esses créditos abatem meses futuros de menor geração.

### 🔴 Limitações Conhecidas da Ferramenta

1. **Tabela de irradiação** é calibrada para **Cuiabá/MT** (região do Cerrado brasileiro). Para outras regiões, considerar fator de correção regional aplicado automaticamente por estado.
2. **Frota de inversores** abrange bifásicos até 10 kW e trifásicos até 25 kW. Sistemas maiores necessitam combinação paralela de inversores.
3. **Não há correção automática de inflação** no payback se o cliente atrasar parcelas financiadas.
4. **Cache de CEP** de 24h pode retornar valores defasados caso o cliente tenha mudado de endereço recentemente.

---

## 10. Garantias e Suporte Pós-Instalação

| Item | Período | Cobertura |
|------|---------|-----------|
| Módulos DAH/Ronma — Garantia de fábrica | 15 anos | Defeitos de fabricação |
| Módulos — Garantia de produtividade | 30 anos | Mínimo 87% no ano 30 |
| Inversores (Sofar/Solis/Growatt/Deye) | 5 anos | Equipamento + fábrica |
| Inversores Fronius | 7 anos (+ 13 anos estendida = 20 anos) | Equipamento + fábrica |
| Instalação e mão de obra Spark | 1 ano+ | Mão de obra + conexões |
| String Box e DPS | 1 ano | Componentes elétricos |

> **Importante:** A **ART** (Anotação de Responsabilidade Técnica) emitida pelo CREA garante que o projeto foi elaborado por profissional habilitado. A Spark entrega **Projeto Elétrico + ART + Memorial Descritivo** junto ao protocolo de homologação na concessionária.

---

## 11. Validação Técnico-Financeira

| Etapa | Fonte da Informação | Auditável? |
|-------|---------------------|------------|
| HSP médio | Tabela `irradiacao.js` (8 × 5 × 12 = 480 amostras) | ✅ Sim |
| Performance Ratio | Configurável, padrão ANEEL | ✅ Sim |
| Tarifa atual | `config.js` campo `tarifaEnergia` | ✅ Sim |
| Custo equipamentos | Banco `equipamentos.js` (6 painéis + 19 inversores) | ✅ Sim |
| Custo serviços | Fixo R$ 2.200 + R$ 350/kWp | ✅ Sim |
| Margem | Configurável, padrão 45% | ✅ Sim |
| Imposto | 8,5% (configurável) | ✅ Sim |
| Distância e frete | Nominatim + Haverkine + 3 faixas | ✅ Em tempo real |
| Fio B progressivo | Tabela oficial 2023-2031 (Lei 14.300/22) | ✅ Sim |
| Inflação tarifária | 8% ao ano (configurável) | ✅ Sim |
| TIR | Newton-Raphson em `financeiro.js` | ✅ Matemática |

---

## 12. Glossário

| Termo | Significado |
|-------|-------------|
| **kWp** | Quilowatt-pico — potência máxima em condições ideais de teste |
| **kWh** | Quilowatt-hora — energia consumida em 1 hora |
| **HSP** | Hora de Sol Pleno — equivalente a 1.000 W/m² |
| **PR** | Performance Ratio — perdas reais em relação ao teórico |
| **ART** | Anotação de Responsabilidade Técnica (documento do CREA) |
| **Fio B** | Tarifa de Uso do Sistema de Distribuição (cobre rede) |
| **TUSD** | Tarifa de Uso do Sistema de Distribuição (sinônimo de Fio B no contexto) |
| **TIR** | Taxa Interna de Retorno (%) |
| **Payback** | Tempo para recuperar o investimento |
| **Autoconsumo** | Percentual da energia gerada que é consumida diretamente no local |
| **Créditos de energia** | Saldo de energia injetada na rede que pode ser compensada em até 60 meses |
| **Tabela Price** | Sistema de juros compostos com parcelas fixas |
| **Simples Nacional** | Regime tributário para micro/pequenas empresas (8,5% sobre lucro na faixa) |

---

## 13. Conclusão

A proposta comercial da Spark CRM é construída com base em:

1. **CRITÉRIOS TÉCNICOS** validados (HSP medido, PR conservador, Lei 14.300/22 oficial)
2. **DADOS TRANSPARENTES** (custo de equipamentos aberto, lucro nominal e efetivo divulgados)
3. **PROJEÇÕES CONSERVADORAS** (inflação tarifária + progressão completa do Fio B)
4. **DIMENSIONAMENTO SOB MEDIDA** (consumo do cliente + tipo de telhado + orientação solar)

> Toda fórmula usada está documentada na **Seção 5** deste documento e é programaticamente reproduzível no código-fonte em `src/js/`. O cliente pode pedir qualquer esclarecimento adicional sobre qualquer número.

---

**Spark Energia Elétrica**  
*Memória de Cálculo gerada automaticamente pelo Sistema CRM Spark*  
*Validade: 15 dias a partir da emissão*

