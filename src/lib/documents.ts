/**
 * PDF documents (donation receipts, event / volunteering certificates) and
 * calendar files. The website prints these with window.print(); on mobile we
 * render the same layout to a PDF with expo-print and open the share sheet so
 * the user can save it to Files, send it, or print it.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { Brand } from '@/constants/theme';
import { apiGetMyVolunteerCertificate } from '@/services/api';

const escapeHtml = (value: string) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, Helvetica, Arial, sans-serif; color: #3F3328; background: #FFFDF8; }
  h1, h2, h3, .serif { font-family: 'Playfair Display', Georgia, serif; }
  .brand { text-align: center; }
  .brand-name { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; }
  .brand-tag { font-size: 10px; letter-spacing: 4px; color: #A67F1C; font-weight: 600; margin-top: 2px; }
  .eyebrow { font-size: 11px; letter-spacing: 2px; color: #A67F1C; font-weight: 700; text-transform: uppercase; }
`;

async function renderAndShare(html: string, fileName: string, dialogTitle: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  // Give the PDF a readable file name before sharing.
  let shareUri = uri;
  if (FileSystem.cacheDirectory) {
    const target = `${FileSystem.cacheDirectory}${fileName.replace(/[^\w.-]+/g, '-')}`;
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => undefined);
    await FileSystem.copyAsync({ from: uri, to: target });
    shareUri = target;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
  } else {
    await Print.printAsync({ uri: shareUri });
  }
}

// ── Donation receipt (matches the website's automated donation receipt) ──────

export type ReceiptData = {
  receiptNumber: string;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: number;
  purpose: string;
  date: string; // ISO
};

export function receiptHtml(r: ReceiptData) {
  const date = new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows: [string, string][] = [
    ['Donor name', r.donorName],
    ...(r.donorEmail ? [['Email', r.donorEmail] as [string, string]] : []),
    ...(r.donorPhone ? [['Phone', r.donorPhone] as [string, string]] : []),
    ['Amount', money(r.amount)],
    ['Purpose', r.purpose],
    ['Date', date],
    ['Receipt number', r.receiptNumber],
  ];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    ${BASE_CSS}
    .page { padding: 48px 44px; }
    .card { border: 1px solid #E9DFCD; border-radius: 18px; padding: 36px; margin-top: 28px; }
    .title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid #E9DFCD; padding-bottom: 20px; }
    h1 { font-size: 26px; margin-top: 6px; }
    .number { background: #EFE4CF; color: #A67F1C; font-weight: 700; padding: 8px 14px; border-radius: 999px; font-size: 13px; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    td { padding: 12px 0; border-bottom: 1px solid #F0E9D8; font-size: 14px; }
    td:first-child { color: #6B5A48; width: 40%; }
    td:last-child { font-weight: 600; text-align: right; }
    .amount td:last-child { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #A67F1C; }
    .foot { margin-top: 24px; font-size: 12px; color: #8A8175; text-align: center; line-height: 1.6; }
  </style></head><body><div class="page">
    <div class="brand"><div class="brand-name">${escapeHtml(Brand.name)}</div><div class="brand-tag">${escapeHtml(Brand.tagline)}</div></div>
    <div class="card">
      <div class="title-row">
        <div><div class="eyebrow">Automated donation receipt</div><h1>Thank you for your contribution</h1></div>
        <div class="number">${escapeHtml(r.receiptNumber)}</div>
      </div>
      <table>${rows.map(([k, v]) => `<tr class="${k === 'Amount' ? 'amount' : ''}"><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
      <p class="foot">This is an automated receipt. No signature is required.<br/>Thank you for supporting the work of ${escapeHtml(Brand.name)}.</p>
    </div>
  </div></body></html>`;
}

export const shareDonationReceipt = (r: ReceiptData) =>
  renderAndShare(receiptHtml(r), `${r.receiptNumber}-receipt.pdf`, 'Save donation receipt');

// ── Certificates (same content as the website's CertificateDocument) ─────────

export type CertificateData = {
  title: string;              // e.g. "Certificate of Participation"
  participantName: string;
  activityName: string;
  dateLabel: string;          // e.g. "Event date"
  activityDate: string;
  certificateNumber: string;
  issuedDate?: string;
};

export function certificateHtml(c: CertificateData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    @page { size: A4 landscape; margin: 0; }
    body { background: #F7F1E6; }
    .sheet { margin: 24px; padding: 18px; background: #FFFDF8; border: 2px solid #C99A24; border-radius: 6px; }
    .frame { border: 1px solid #E9DFCD; padding: 44px 56px; text-align: center; min-height: 480px; }
    .mark { font-size: 22px; color: #C99A24; }
    h1 { font-size: 34px; margin: 18px 0 14px; }
    .presented { color: #6B5A48; font-size: 14px; }
    h2 { font-size: 40px; color: #A67F1C; margin: 10px 0 14px; }
    .desc { color: #6B5A48; font-size: 14px; }
    h3 { font-size: 22px; margin: 10px 0 26px; }
    .details { display: flex; justify-content: center; gap: 60px; font-size: 13px; }
    .details span { display: block; color: #8A8175; margin-bottom: 4px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-size: 12px; color: #6B5A48; }
    .sig { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #3F3328; }
    .rule { display: block; width: 200px; border-top: 1px solid #3F3328; margin: 6px 0; }
  </style></head><body><div class="sheet"><div class="frame">
    <div class="brand"><span class="mark">✦</span><div class="brand-name">${escapeHtml(Brand.name)}</div><div class="brand-tag">${escapeHtml(Brand.tagline)}</div></div>
    <p class="eyebrow" style="margin-top:22px">Certificate</p>
    <h1>${escapeHtml(c.title)}</h1>
    <p class="presented">This is presented to</p>
    <h2>${escapeHtml(c.participantName)}</h2>
    <p class="desc">In recognition of their participation and sincere engagement in</p>
    <h3>${escapeHtml(c.activityName)}</h3>
    <div class="details">
      <p><span>${escapeHtml(c.dateLabel)}</span><strong>${escapeHtml(c.activityDate)}</strong></p>
      <p><span>Certificate number</span><strong>${escapeHtml(c.certificateNumber)}</strong></p>
    </div>
    <div class="footer">
      <div style="text-align:left"><span class="sig">${escapeHtml(Brand.name)}</span><span class="rule"></span>Issuing organization</div>
      ${c.issuedDate ? `<div>Issued ${escapeHtml(c.issuedDate)}</div>` : ''}
    </div>
  </div></div></body></html>`;
}

export const shareCertificate = (c: CertificateData) =>
  renderAndShare(certificateHtml(c), `${c.certificateNumber}-certificate.pdf`, 'Save certificate');

// ── Calendar (.ics) ──────────────────────────────────────────────────────────

export async function shareCalendarFile(ics: string, title: string) {
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return false;
  const target = `${FileSystem.cacheDirectory}${(title || 'event').replace(/[^\w-]+/g, '-').slice(0, 60)}.ics`;
  await FileSystem.writeAsStringAsync(target, ics);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(target, { mimeType: 'text/calendar', UTI: 'public.calendar-event', dialogTitle: 'Add to calendar' });
  return true;
}

/** Fetch the volunteer certificate and open it as a PDF. Returns an error message or null. */
export async function shareVolunteerCertificate(token: string, applicationId: number): Promise<string | null> {
  const res = await apiGetMyVolunteerCertificate(token, applicationId);
  if (res.error || !res.data) return res.error ?? 'Certificate is not available yet.';
  const fmt = (d: string) => {
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  try {
    await shareCertificate({
      title: 'Certificate of Volunteering',
      participantName: res.data.participant_name,
      activityName: res.data.opportunity_title,
      dateLabel: 'Volunteering date',
      activityDate: fmt(String(res.data.opportunity_date).slice(0, 10)),
      certificateNumber: res.data.certificate_number,
      issuedDate: res.data.issued_at ? fmt(res.data.issued_at) : undefined,
    });
    return null;
  } catch {
    return 'Could not create the certificate PDF.';
  }
}
