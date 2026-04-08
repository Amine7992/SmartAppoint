const escapePdfText = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdfBuffer = (report) => {
  const lines = [
    'SmartAppoint - Rapport administrateur',
    `Genere le: ${new Date(report.generatedAt).toLocaleString('fr-FR')}`,
    '',
    `Utilisateurs total: ${report.stats.total_users}`,
    `Clients: ${report.stats.clients_count}`,
    `Professionnels: ${report.stats.pros_count}`,
    `Admins: ${report.stats.admins_count}`,
    `Professionnels actifs: ${report.stats.active_pros}`,
    `Professionnels en attente: ${report.stats.pending_pros}`,
    `Rendez-vous ce mois: ${report.stats.monthly_appts}`,
    `Croissance mensuelle: ${report.stats.monthly_growth_pct}%`,
    `No-show global: ${report.stats.noshow_rate}%`,
    '',
    `Total utilisateurs listes: ${report.usersCount}`,
    `Total professionnels listes: ${report.professionalsCount}`,
    `Total rendez-vous listes: ${report.appointmentsCount}`,
  ];

  const content = [
    'BT',
    '/F1 18 Tf',
    '50 780 Td',
    ...lines.flatMap((line, index) => {
      const safeLine = escapePdfText(line);
      if (index === 0) return [`(${safeLine}) Tj`];
      return ['0 -24 Td', `(${safeLine}) Tj`];
    }),
    'ET',
  ].join('\n');

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

module.exports = { buildPdfBuffer };
