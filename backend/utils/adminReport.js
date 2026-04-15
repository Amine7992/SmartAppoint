const fs = require('fs');
const path = require('path');

const escapePdfText = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const loadPngImage = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);

  if (fileBuffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Unsupported logo format: ${filePath}`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 2;
  const idatChunks = [];

  while (offset < fileBuffer.length) {
    const length = fileBuffer.readUInt32BE(offset);
    offset += 4;

    const chunkType = fileBuffer.toString('ascii', offset, offset + 4);
    offset += 4;

    const chunkData = fileBuffer.slice(offset, offset + length);
    offset += length + 4;

    if (chunkType === 'IHDR') {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      bitDepth = chunkData[8];
      colorType = chunkData[9];
    }

    if (chunkType === 'IDAT') {
      idatChunks.push(chunkData);
    }

    if (chunkType === 'IEND') {
      break;
    }
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    data: Buffer.concat(idatChunks).toString('binary'),
  };
};

const hexToRgb = (hex) => {
  const value = String(hex || '').replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value.padEnd(6, '0').slice(0, 6);

  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;

  return [red, green, blue];
};

const formatFrDate = (value) => new Date(value).toLocaleString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const buildReportCards = (report) => ([
  { label: 'Utilisateurs', value: report.stats.total_users, accent: '#042C53' },
  { label: 'Clients', value: report.stats.clients_count, accent: '#0D8C7A' },
  { label: 'Professionnels', value: report.stats.pros_count, accent: '#2B6CB0' },
  { label: 'Admins', value: report.stats.admins_count, accent: '#6656C9' },
  { label: 'Actifs', value: report.stats.active_pros, accent: '#18A957' },
  { label: 'En attente', value: report.stats.pending_pros, accent: '#D97706' },
  { label: 'RDV ce mois', value: report.stats.monthly_appts, accent: '#0F766E' },
  { label: 'No-show', value: `${report.stats.noshow_rate}%`, accent: '#B42318' },
]);

const buildLine = (text, x, y, size = 11, font = '/F2', color = '#1F2937') => {
  const [red, green, blue] = hexToRgb(color);
  return [
    'BT',
    `${font} ${size} Tf`,
    `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} rg`,
    `${x} ${y} Td`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
  ].join('\n');
};

const logoImage = loadPngImage(path.join(__dirname, '..', '..', 'frontend', 'public', 'logo2.png'));

const buildPdfBuffer = (report) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 38;
  const headerHeight = 148;
  const cards = buildReportCards(report);

  const topCards = cards.slice(0, 4);

  const cardWidth = 247;
  const cardHeight = 66;
  const cardGap = 14;
  const leftX = margin;
  const rightX = margin + cardWidth + cardGap;
  const firstRowY = 612;
  const secondRowY = 534;

  const content = [
    // Page background
    'q',
    '0.95 0.97 0.99 rg',
    `0 0 ${pageWidth} ${pageHeight} re`,
    'f',
    'Q',

    // Header band
    'q',
    '0.02 0.17 0.33 rg',
    `0 ${pageHeight - headerHeight} ${pageWidth} ${headerHeight} re`,
    'f',
    'Q',

    // Logo card
    'q',
    '1 1 1 rg',
    '38 726 64 64 re',
    'f',
    'Q',

    // Logo image
    'q',
    '56 0 0 56 42 730 cm',
    '/Im1 Do',
    'Q',

    // Accent pill
    'q',
    '0.07 0.55 0.48 rg',
    '446 790 112 26 re',
    'f',
    'Q',

    buildLine('SMARTAPPOINT', 463, 806, 9, '/F2', '#FFFFFF'),
    buildLine('Rapport administrateur', 118, 790, 24, '/F1', '#FFFFFF'),
    buildLine(`Genere le ${formatFrDate(report.generatedAt)}`, 118, 764, 10, '/F2', '#D7E6F3'),
    buildLine('Vue d ensemble de la plateforme et des activites recentes.', 118, 746, 11, '/F2', '#D7E6F3'),

    // Section title
    buildLine('Apercu rapide', 38, 650, 14, '/F1', '#042C53'),

    // KPI cards
    ...topCards.map((card, index) => {
      const x = index % 2 === 0 ? leftX : rightX;
      const y = index < 2 ? firstRowY : secondRowY;
      const [red, green, blue] = hexToRgb(card.accent);
      const [darkRed, darkGreen, darkBlue] = hexToRgb('#F8FAFC');
      return [
        'q',
        `${darkRed.toFixed(3)} ${darkGreen.toFixed(3)} ${darkBlue.toFixed(3)} rg`,
        `${x} ${y} ${cardWidth} ${cardHeight} re`,
        'f',
        'Q',
        'q',
        `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} rg`,
        `${x} ${y + cardHeight - 8} ${cardWidth} 8 re`,
        'f',
        'Q',
        buildLine(card.label, x + 16, y + 40, 10, '/F2', '#64748B'),
        buildLine(String(card.value), x + 16, y + 16, 18, '/F1', '#0F172A'),
      ].join('\n');
    }),

    // Detailed summary section
    buildLine('Indicateurs detailles', 38, 480, 14, '/F1', '#042C53'),
    'q',
    '1 1 1 rg',
    '38 260 519 206 re',
    'f',
    'Q',

    'q',
    '0.85 0.89 0.94 RG',
    '38 260 519 206 re',
    'S',
    'Q',

    buildLine(`Professionnels actifs: ${report.stats.active_pros}`, 58, 432, 12, '/F2', '#0F172A'),
    buildLine(`Professionnels en attente: ${report.stats.pending_pros}`, 58, 406, 12, '/F2', '#0F172A'),
    buildLine(`Croissance mensuelle: ${report.stats.monthly_growth_pct}%`, 58, 380, 12, '/F2', '#0F172A'),
    buildLine(`No-show global: ${report.stats.noshow_rate}%`, 58, 354, 12, '/F2', '#0F172A'),
    buildLine(`Utilisateurs listes: ${report.usersCount}`, 58, 328, 12, '/F2', '#0F172A'),
    buildLine(`Professionnels listes: ${report.professionalsCount}`, 58, 302, 12, '/F2', '#0F172A'),

    // Right summary box
    'q',
    '0.96 0.98 0.99 rg',
    '340 292 200 154 re',
    'f',
    'Q',
    'q',
    '0.02 0.17 0.33 RG',
    '340 292 200 154 re',
    'S',
    'Q',
    buildLine('Volume du rapport', 360, 422, 12, '/F1', '#042C53'),
    buildLine(`Rendez-vous listes: ${report.appointmentsCount}`, 360, 394, 11, '/F2', '#0F172A'),
    buildLine(`Total utilisateurs: ${report.stats.total_users}`, 360, 370, 11, '/F2', '#0F172A'),
    buildLine(`Total professionnels: ${report.stats.pros_count}`, 360, 346, 11, '/F2', '#0F172A'),
    buildLine(`Total admins: ${report.stats.admins_count}`, 360, 322, 11, '/F2', '#0F172A'),

    // Footer band
    'q',
    '0.02 0.17 0.33 rg',
    '0 0 595 42 re',
    'f',
    'Q',
    buildLine('SmartAppoint - Administration', 38, 20, 9, '/F2', '#D7E6F3'),
    buildLine('Document genere automatiquement depuis le tableau de bord admin.', 314, 20, 9, '/F2', '#D7E6F3'),
  ].join('\n');

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 6 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent ${logoImage.bitDepth} /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors ${logoImage.colorType === 2 ? 3 : 1} /BitsPerComponent ${logoImage.bitDepth} /Columns ${logoImage.width} >> /Length ${Buffer.byteLength(logoImage.data, 'binary')} >>\nstream\n${logoImage.data}\nendstream`);
  addObject(`<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
};

module.exports = { buildPdfBuffer };
