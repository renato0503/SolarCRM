export function calcularTIR(fluxos) {
  if (!fluxos || fluxos.length < 2) return 0;
  let irr = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < fluxos.length; t++) {
      const denom = Math.pow(1 + irr, t);
      npv += fluxos[t] / denom;
      if (t > 0) dnpv += (-t * fluxos[t]) / Math.pow(1 + irr, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newIrr = irr - npv / dnpv;
    if (Math.abs(newIrr - irr) < 1e-8) break;
    irr = newIrr;
  }
  return irr;
}

export function calcularPaybackDetalhado(investimentoInicial, economiaAnual, inflacao = 0.08) {
  const economiaMensal = economiaAnual / 12;
  let saldo = -investimentoInicial;
  let meses = 0;
  let economizou = 0;

  for (let ano = 1; ano <= 25; ano++) {
    const fatorInflacao = Math.pow(1 + inflacao, ano - 1);
    for (let mes = 1; mes <= 12; mes++) {
      meses++;
      saldo += economiaMensal * fatorInflacao;
      economizou += economiaMensal * fatorInflacao;
      if (saldo >= 0) {
        const paybackAnos = Number((meses / 12).toFixed(1));
        const paybackMesesTotal = Math.round(meses);
        return { paybackAnos, paybackMesesTotal, meses: paybackMesesTotal, saldoAcumulado: Number(saldo.toFixed(2)) };
      }
    }
  }

  return { paybackAnos: 25, paybackMesesTotal: 300, meses: 300, saldoAcumulado: Number(saldo.toFixed(2)) };
}

export function gerarProjecao6Anos(investimento, economiaAnualBase, fioB, tarifaEnergia, autoconsumo, custoDispKwh, inflacao = 0.08) {
  const projecao = [];
  const consumoRef = 100;

  for (let ano = 1; ano <= 6; ano++) {
    const anoCorrente = 2025 + ano;
    const fatorFioB = obterFioBAno(anoCorrente);
    const fatorInflacao = Math.pow(1 + inflacao, ano - 1);

    const contaSemSistema = tarifaEnergia * consumoRef * 12 * fatorInflacao;

    const tusdG = fioB * fatorFioB;
    const custoDisp = (custoDispKwh / consumoRef) * fioB * fatorFioB;
    const excedenteInjetado = consumoRef * (1 - autoconsumo);
    const credito = excedenteInjetado * (tarifaEnergia - tusdG);
    const consumoFaturado = consumoRef * autoconsumo + custoDisp;
    const contaComSistema = (consumoFaturado * tarifaEnergia - credito) * 12 * fatorInflacao;
    const contaComSistemaMin = Math.max(contaComSistema, custoDispKwh * (tarifaEnergia - tusdG) * 12 * fatorInflacao);

    const economiaAnual = Math.max(0, contaSemSistema - contaComSistemaMin);

    projecao.push({
      ano: anoCorrente,
      contaSemSistema: Number(contaSemSistema.toFixed(2)),
      contaComSistema: Number(contaComSistemaMin.toFixed(2)),
      economiaAnual: Number(economiaAnual.toFixed(2))
    });
  }

  return projecao;
}

function obterFioBAno(ano) {
  const tabela = {
    2023: 0.15, 2024: 0.30, 2025: 0.45, 2026: 0.60,
    2027: 0.75, 2028: 0.90, 2029: 1.00, 2030: 1.00, 2031: 1.00
  };
  return tabela[ano] || 1.00;
}

export function gerarTabelaFinanciamento(valorTotal, entrada = 0) {
  const valorFinanciado = valorTotal - entrada;
  if (valorFinanciado <= 0) return [];

  const opcoes = [
    { parcelas: 12, taxa: 0.0149, banco: 'BV/Santander' },
    { parcelas: 24, taxa: 0.0149, banco: 'BV/Santander' },
    { parcelas: 36, taxa: 0.0149, banco: 'BV/Santander' },
    { parcelas: 48, taxa: 0.0150, banco: 'Bradesco/BB' },
    { parcelas: 60, taxa: 0.0150, banco: 'Bradesco/BB' },
    { parcelas: 72, taxa: 0.0155, banco: 'Sicoob/Sicredi' },
    { parcelas: 96, taxa: 0.0155, banco: 'Sicoob/Sicredi' },
    { parcelas: 120, taxa: 0.0175, banco: 'BTG Pactual' }
  ];

  return opcoes.map(op => {
    const tx = op.taxa;
    const n = op.parcelas;
    const parcela = valorFinanciado * (tx * Math.pow(1 + tx, n)) / (Math.pow(1 + tx, n) - 1);
    const total = parcela * n;
    const juros = total - valorFinanciado;

    return {
      parcelas: n,
      valorParcela: Number(parcela.toFixed(2)),
      valorTotal: Number(total.toFixed(2)),
      jurosTotal: Number(juros.toFixed(2)),
      banco: op.banco,
      entrada: entrada
    };
  });
}

export function gerarFluxoCaixaAcumulado(investimento, projecao) {
  let acumulado = -investimento;
  const fluxos = [acumulado];

  projecao.forEach(ano => {
    acumulado += ano.economiaAnual;
    fluxos.push(Number(acumulado.toFixed(2)));
  });

  return fluxos;
}
