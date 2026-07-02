const $ = (id) => document.getElementById(id);

const fields = [
  'resumoColado',
  'prestadorNome', 'prestadorCpf', 'prestadorTelefone', 'prestadorEmail',
  'clienteNome', 'clienteDoc', 'clienteTelefone', 'clienteEmail',
  'tipoProjeto', 'paginas', 'prazo', 'dataContrato', 'itens',
  'valorCheio', 'descontoValor', 'totalFinal',
  'formaPagamento', 'pagamentoObs', 'parcela1Percent', 'parcela2Percent', 'parcela3Percent',
  'observacoes'
];

function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function formatDateBR(value) {
  if (!value) return '____/____/________';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function parseNumero(value) {
  if (value === null || value === undefined) return 0;
  let text = String(value)
    .replace(/\u00A0/g, ' ')
    .replace(/R\$\s?/gi, '')
    .replace(/−/g, '-')
    .replace(/[^0-9,.-]/g, '')
    .trim();

  if (!text) return 0;
  if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.');
  else if (text.includes(',')) text = text.replace(',', '.');

  return Number(text) || 0;
}

function money(value) {
  const num = Number(value || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHTML(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeItem(item) {
  return item
    .replace(/^[-•]\s*/, '')
    .replace(/Google Maps/i, 'Integração com Google Maps')
    .replace(/Botão de WhatsApp/i, 'Botão de contato via WhatsApp')
    .replace(/Configuração de domínio\/hospedagem/i, 'Configuração de domínio e hospedagem')
    .trim();
}

function cleanPrazo(prazo) {
  return String(prazo || '').replace(/–/g, ' a ').replace(/-/g, ' a ').replace(/\s+/g, ' ').trim();
}

function getItensArray() {
  return $('itens').value.split('\n').map(i => i.trim()).filter(Boolean);
}

function getInstallments(total) {
  const p1 = parseNumero($('parcela1Percent').value);
  const p2 = parseNumero($('parcela2Percent').value);
  const p3 = parseNumero($('parcela3Percent').value);
  return [
    { label: '1ª parcela', percent: p1, value: (total * p1) / 100, moment: 'para iniciar o design/projeto' },
    { label: '2ª parcela', percent: p2, value: (total * p2) / 100, moment: 'após aprovação do design' },
    { label: '3ª parcela', percent: p3, value: (total * p3) / 100, moment: 'na entrega final do site publicado' }
  ];
}

function paymentMethodText() {
  const value = $('formaPagamento').value;
  if (value === 'credito') return 'Cartão de crédito';
  if (value === 'debito') return 'Cartão de débito';
  return 'Pix';
}

function getPaymentText() {
  const total = parseNumero($('totalFinal').value);
  const obs = $('pagamentoObs').value.trim();
  const installments = getInstallments(total);
  const soma = installments.reduce((acc, item) => acc + item.percent, 0);
  const parcelasText = installments
    .map(item => `${item.label}: ${item.percent.toFixed(2).replace('.', ',')}% (${money(item.value)}) ${item.moment}`)
    .join('; ');

  let text = `Forma escolhida: ${paymentMethodText()}.\nDivisão padrão:\n${parcelasText}.`;
  if (Math.round(soma * 100) / 100 !== 100) {
    text += `\nAtenção: os percentuais somam ${soma.toFixed(2).replace('.', ',')}%, revise antes de fechar.`;
  }
  if (obs) text += `\n${obs}`;
  return text;
}

function updatePaymentPreview() {
  const total = parseNumero($('totalFinal').value);
  const installments = getInstallments(total);
  const soma = installments.reduce((acc, item) => acc + item.percent, 0);
  const rows = installments.map(item => `<div><strong>${item.label}:</strong> ${item.percent.toFixed(2).replace('.', ',')}% — ${money(item.value)} — ${escapeHTML(item.moment)}</div>`).join('');
  $('paymentPreview').innerHTML = `
    <div><strong>Forma:</strong> ${escapeHTML(paymentMethodText())}</div>
    ${rows}
    <div><strong>Soma dos percentuais:</strong> ${soma.toFixed(2).replace('.', ',')}%</div>
  `;
}

function gerarObservacoesPorItens() {
  const itensText = getItensArray().join(' ').toLowerCase();
  const obs = [];

  if (itensText.includes('treinamento do cliente')) {
    obs.push('Treinamento do cliente: inclui uma orientação básica para o cliente entender o funcionamento geral do site, uso das informações entregues e cuidados simples após a publicação. Não inclui aulas avançadas, gestão completa de marketing ou treinamento de ferramentas externas não combinadas previamente.');
  }

  if (itensText.includes('manutenção mensal')) {
    obs.push('Manutenção mensal: caso contratada, inclui suporte e ajustes simples durante o período mensal combinado, como pequenas correções, alterações leves de texto/imagem e acompanhamento básico do funcionamento do site. Mudanças grandes de estrutura, novas páginas, novas funcionalidades ou redesign completo podem gerar orçamento adicional.');
  }

  if (itensText.includes('atualizações futuras')) {
    obs.push('Atualizações futuras: inclui alterações simples durante o período combinado, como troca de textos, imagens, horários, dados de contato e pequenos ajustes visuais. Não inclui criação de novas páginas completas, novas funcionalidades complexas ou mudança total do layout.');
  }

  if (!obs.length) {
    obs.push('Alterações futuras simples serão realizadas durante o período de suporte combinado, desde que não alterem completamente a estrutura do projeto. Mudanças maiores podem ser avaliadas em orçamento separado.');
  }

  return obs.join('\n\n');
}

function preencherObservacoesPorItens() {
  $('observacoes').value = gerarObservacoesPorItens();
  renderPreview();
}

function getData() {
  const valorCheio = parseNumero($('valorCheio').value);
  const descontoValor = parseNumero($('descontoValor').value);
  const totalFinalInput = parseNumero($('totalFinal').value);
  const totalFinal = totalFinalInput || Math.max(valorCheio - descontoValor, 0);
  const descontoPercent = valorCheio > 0 ? (descontoValor / valorCheio) * 100 : 0;

  return {
    prestadorNome: $('prestadorNome').value.trim(),
    prestadorCpf: $('prestadorCpf').value.trim(),
    prestadorTelefone: $('prestadorTelefone').value.trim(),
    prestadorEmail: $('prestadorEmail').value.trim(),
    clienteNome: $('clienteNome').value.trim(),
    clienteDoc: $('clienteDoc').value.trim(),
    clienteTelefone: $('clienteTelefone').value.trim(),
    clienteEmail: $('clienteEmail').value.trim(),
    tipoProjeto: $('tipoProjeto').value.trim(),
    paginas: $('paginas').value,
    prazo: $('prazo').value.trim(),
    dataContrato: $('dataContrato').value,
    itens: getItensArray(),
    valorCheio,
    descontoValor,
    totalFinal,
    descontoPercent,
    pagamento: getPaymentText(),
    entrada: getInstallments(totalFinal)[0].value,
    observacoes: $('observacoes').value.trim()
  };
}

function getValueAfterLabel(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*:\\s*(.+)`, 'i');
  const found = text.match(re);
  return found ? found[1].trim() : '';
}

function parseResumoOrcamento() {
  const raw = $('resumoColado').value.trim();
  if (!raw) {
    alert('Cole o resumo do orçamento primeiro.');
    return;
  }

  const text = raw.replace(/\u00A0/g, ' ');
  const tipo = getValueAfterLabel(text, 'Tipo');
  const paginas = getValueAfterLabel(text, 'Páginas');
  const prazo = getValueAfterLabel(text, 'Prazo de entrega');

  const valorCheioMatch = text.match(/Valor cheio\s*:\s*R\$?\s*([\d.,]+)/i);
  const descontoMatch = text.match(/Desconto aplicado\s*:\s*R\$?\s*([\d.,]+)/i);
  const totalMatch = text.match(/Total final\s*:\s*R\$?\s*([\d.,]+)/i);

  const itens = [];
  const lines = text.split(/\r?\n/);
  let lendoItens = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Itens inclusos\s*:/i.test(trimmed)) {
      lendoItens = true;
      continue;
    }
    if (/^(Valor cheio|Desconto aplicado|Total final)\s*:/i.test(trimmed)) lendoItens = false;
    if (lendoItens && /^[-•]\s*/.test(trimmed)) itens.push(normalizeItem(trimmed));
  }

  if (tipo) $('tipoProjeto').value = tipo;
  if (paginas) $('paginas').value = parseInt(paginas, 10) || $('paginas').value;
  if (prazo) $('prazo').value = cleanPrazo(prazo);
  if (itens.length) $('itens').value = itens.join('\n');
  if (valorCheioMatch) $('valorCheio').value = parseNumero(valorCheioMatch[1]).toFixed(2);
  if (descontoMatch) $('descontoValor').value = parseNumero(descontoMatch[1]).toFixed(2);
  if (totalMatch) $('totalFinal').value = parseNumero(totalMatch[1]).toFixed(2);

  $('observacoes').value = gerarObservacoesPorItens();
  renderPreview();
  alert('Resumo lido e contrato preenchido automaticamente.');
}

function renderPreview() {
  const d = getData();
  updatePaymentPreview();
  const itensHTML = d.itens.map(item => `<li>${escapeHTML(item)}</li>`).join('');
  const cliente = d.clienteNome || 'Nome do cliente/empresa';
  const prestador = d.prestadorNome || 'Nome do contratado';

  $('preview').innerHTML = `
    <h3>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO WEB</h3>

    <h4>1. Partes</h4>
    <p><strong>Contratado:</strong> ${escapeHTML(prestador)}, CPF nº ${escapeHTML(d.prestadorCpf || '__________')}, telefone ${escapeHTML(d.prestadorTelefone || '__________')}, e-mail ${escapeHTML(d.prestadorEmail || '__________')}.</p>
    <p><strong>Contratante:</strong> ${escapeHTML(cliente)}, CPF/CNPJ nº ${escapeHTML(d.clienteDoc || '__________')}, telefone ${escapeHTML(d.clienteTelefone || '__________')}, e-mail ${escapeHTML(d.clienteEmail || '__________')}.</p>

    <h4>2. Objeto do contrato</h4>
    <p>O presente contrato tem como objeto a prestação de serviço de desenvolvimento de <strong>${escapeHTML(d.tipoProjeto || 'site')}</strong>, com <strong>${escapeHTML(d.paginas || '___')} página(s)</strong>, conforme informações fornecidas pelo contratante.</p>

    <h4>3. Itens inclusos</h4>
    <ul>${itensHTML}</ul>

    <h4>4. Prazo</h4>
    <p>O prazo estimado para entrega do projeto é de <strong>${escapeHTML(d.prazo || '___ dias')}</strong>, contado a partir da confirmação do pagamento inicial e envio dos materiais necessários pelo contratante.</p>

    <h4>5. Valores e pagamento</h4>
    <p><strong>Valor cheio:</strong> ${money(d.valorCheio)}</p>
    <p><strong>Desconto aplicado:</strong> ${money(d.descontoValor)} (${d.descontoPercent.toFixed(2).replace('.', ',')}%)</p>
    <p><strong>Valor total final:</strong> ${money(d.totalFinal)}</p>
    <p><strong>Forma de pagamento:</strong><br>${escapeHTML(d.pagamento || 'A combinar').replaceAll('\n', '<br/>')}</p>
    <p><strong>Entrada inicial:</strong> ${money(d.entrada)}</p>

    <h4>6. Revisões e alterações</h4>
    <p>Antes do desenvolvimento final, será apresentada uma prévia visual do design para avaliação. Ajustes simples de texto, cores, imagens e informações da empresa poderão ser solicitados nessa etapa.</p>

    <h4>7. Observações</h4>
    <p>${escapeHTML(d.observacoes || 'Sem observações adicionais.').replaceAll('\n', '<br/>')}</p>

    <p class="notice"><strong>Observação:</strong> este documento é um contrato/recibo de prestação de serviço e não substitui nota fiscal eletrônica emitida por órgão competente.</p>

    <p style="margin-top: 22px;">Data: ${formatDateBR(d.dataContrato)}</p>

    <div class="signature-grid">
      <div class="signature-line">${escapeHTML(prestador)}<br/>Contratado</div>
      <div class="signature-line">${escapeHTML(cliente)}<br/>Contratante</div>
    </div>
  `;
}

function getContractText() {
  const d = getData();
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO WEB

1. PARTES
Contratado: ${d.prestadorNome || '__________'}, CPF nº ${d.prestadorCpf || '__________'}, telefone ${d.prestadorTelefone || '__________'}, e-mail ${d.prestadorEmail || '__________'}.
Contratante: ${d.clienteNome || '__________'}, CPF/CNPJ nº ${d.clienteDoc || '__________'}, telefone ${d.clienteTelefone || '__________'}, e-mail ${d.clienteEmail || '__________'}.

2. OBJETO DO CONTRATO
Desenvolvimento de ${d.tipoProjeto || 'site'}, com ${d.paginas || '___'} página(s), conforme informações fornecidas pelo contratante.

3. ITENS INCLUSOS
${d.itens.map(i => `- ${i}`).join('\n')}

4. PRAZO
Prazo estimado: ${d.prazo || '___ dias'}, contado a partir da confirmação do pagamento inicial e envio dos materiais necessários pelo contratante.

5. VALORES E PAGAMENTO
Valor cheio: ${money(d.valorCheio)}
Desconto aplicado: ${money(d.descontoValor)} (${d.descontoPercent.toFixed(2).replace('.', ',')}%)
Valor total final: ${money(d.totalFinal)}
Forma de pagamento: ${d.pagamento || 'A combinar'}
Entrada inicial: ${money(d.entrada)}

6. REVISÕES E ALTERAÇÕES
Antes do desenvolvimento final, será apresentada uma prévia visual do design para avaliação. Ajustes simples de texto, cores, imagens e informações da empresa poderão ser solicitados nessa etapa.

7. OBSERVAÇÕES
${d.observacoes || 'Sem observações adicionais.'}

Observação: este documento é um contrato/recibo de prestação de serviço e não substitui nota fiscal eletrônica emitida por órgão competente.

Data: ${formatDateBR(d.dataContrato)}

____________________________________
${d.prestadorNome || 'Contratado'}
Contratado

____________________________________
${d.clienteNome || 'Contratante'}
Contratante`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const blocks = String(text || '').split(/\n/);

  blocks.forEach((block, blockIndex) => {
    const lines = doc.splitTextToSize(block || ' ', maxWidth);

    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    }

    if (blockIndex < blocks.length - 1) {
      y += 1.5;
    }
  });

  return y;
}

async function imageToBase64(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function generatePDF() {
  if (!window.jspdf) {
    alert('A biblioteca de PDF não carregou. Verifique a internet ou use a opção de imprimir/salvar como PDF pelo navegador.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const d = getData();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const width = 210 - margin * 2;
  let y = 18;

  try {
    const logo = await imageToBase64('assets/WN.png');
    doc.addImage(logo, 'PNG', margin, y - 5, 24, 24);
  } catch (e) {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', margin + 30, y + 5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Desenvolvimento Web', margin + 30, y + 11);
  y += 28;

  doc.setDrawColor(123, 63, 36);
  doc.line(margin, y, 210 - margin, y);
  y += 9;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARTES', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, `Contratado: ${d.prestadorNome || '__________'}, CPF nº ${d.prestadorCpf || '__________'}, telefone ${d.prestadorTelefone || '__________'}, e-mail ${d.prestadorEmail || '__________'}.`, margin, y, width, 6);
  y = addWrappedText(doc, `Contratante: ${d.clienteNome || '__________'}, CPF/CNPJ nº ${d.clienteDoc || '__________'}, telefone ${d.clienteTelefone || '__________'}, e-mail ${d.clienteEmail || '__________'}.`, margin, y, width, 6);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('2. OBJETO DO CONTRATO', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, `O presente contrato tem como objeto a prestação de serviço de desenvolvimento de ${d.tipoProjeto || 'site'}, com ${d.paginas || '___'} página(s), conforme informações fornecidas pelo contratante.`, margin, y, width, 6);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('3. ITENS INCLUSOS', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  for (const item of d.itens) {
    y = addWrappedText(doc, `- ${item}`, margin, y, width, 6);
  }
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('4. PRAZO', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, `O prazo estimado para entrega do projeto é de ${d.prazo || '___ dias'}, contado a partir da confirmação do pagamento inicial e envio dos materiais necessários pelo contratante.`, margin, y, width, 6);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('5. VALORES E PAGAMENTO', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, `Valor cheio: ${money(d.valorCheio)}`, margin, y, width, 6);
  y = addWrappedText(doc, `Desconto aplicado: ${money(d.descontoValor)} (${d.descontoPercent.toFixed(2).replace('.', ',')}%)`, margin, y, width, 6);
  y = addWrappedText(doc, `Valor total final: ${money(d.totalFinal)}`, margin, y, width, 6);
  y = addWrappedText(doc, `Forma de pagamento: ${d.pagamento || 'A combinar'}`, margin, y, width, 6);
  y = addWrappedText(doc, `Entrada inicial: ${money(d.entrada)}`, margin, y, width, 6);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('6. REVISÕES E ALTERAÇÕES', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, 'Antes do desenvolvimento final, será apresentada uma prévia visual do design para avaliação. Ajustes simples de texto, cores, imagens e informações da empresa poderão ser solicitados nessa etapa.', margin, y, width, 6);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('7. OBSERVAÇÕES', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, d.observacoes || 'Sem observações adicionais.', margin, y, width, 6);
  y += 4;
  y = addWrappedText(doc, 'Observação: este documento é um contrato/recibo de prestação de serviço e não substitui nota fiscal eletrônica emitida por órgão competente.', margin, y, width, 6);
  y += 7;
  y = addWrappedText(doc, `Data: ${formatDateBR(d.dataContrato)}`, margin, y, width, 6);

  if (y > 235) {
    doc.addPage();
    y = 35;
  } else {
    y = 245;
  }
  doc.line(margin, y, margin + 75, y);
  doc.line(210 - margin - 75, y, 210 - margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(d.prestadorNome || 'Contratado', margin + 37.5, y, { align: 'center' });
  doc.text(d.clienteNome || 'Contratante', 210 - margin - 37.5, y, { align: 'center' });
  y += 5;
  doc.text('Contratado', margin + 37.5, y, { align: 'center' });
  doc.text('Contratante', 210 - margin - 37.5, y, { align: 'center' });

  const filename = `contrato-${(d.clienteNome || 'cliente').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.pdf`;
  doc.save(filename);
}

function autoCalculateTotals(changedField) {
  const valorCheio = parseNumero($('valorCheio').value);
  const descontoValor = parseNumero($('descontoValor').value);
  const totalFinal = parseNumero($('totalFinal').value);

  if (changedField === 'totalFinal') {
    const novoDesconto = Math.max(valorCheio - totalFinal, 0);
    $('descontoValor').value = novoDesconto.toFixed(2);
  } else if (changedField === 'descontoValor') {
    const novoTotal = Math.max(valorCheio - descontoValor, 0);
    $('totalFinal').value = novoTotal.toFixed(2);
  } else if (changedField === 'valorCheio') {
    const novoTotal = Math.max(valorCheio - descontoValor, 0);
    $('totalFinal').value = novoTotal.toFixed(2);
  }
  renderPreview();
}

$('dataContrato').value = todayISO();
fields.forEach(id => {
  $(id).addEventListener('input', () => {
    if (['valorCheio', 'descontoValor', 'totalFinal'].includes(id)) autoCalculateTotals(id);
    else renderPreview();
  });
});

$('btnPreview').addEventListener('click', renderPreview);
$('btnPdf').addEventListener('click', generatePDF);
$('btnLerResumo').addEventListener('click', parseResumoOrcamento);
$('btnLimparResumo').addEventListener('click', () => { $('resumoColado').value = ''; renderPreview(); });
$('btnGerarObs').addEventListener('click', preencherObservacoesPorItens);
$('btnCopy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(getContractText());
  $('btnCopy').textContent = 'Copiado!';
  setTimeout(() => $('btnCopy').textContent = 'Copiar texto', 1200);
});

renderPreview();
