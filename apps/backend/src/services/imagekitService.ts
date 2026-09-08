/**
 * MediKiosk - ImageKit Cloud Storage Service
 * 
 * Provides automated, secure cloud upload for physical medical documents,
 * prescription scans, lab investigation reports, and patient paper records.
 */

import { env } from '../lib/env.js';

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  fileType: string;
  size: number;
}

export interface ImageKitUploadOptions {
  file: Buffer | string; // Binary Buffer, Base64 string, or remote URL
  fileName: string;
  folder?: string;
  tags?: string[];
  isPrivateFile?: boolean;
}

export class ImageKitService {
  private static uploadEndpoint = 'https://upload.imagekit.io/api/v1/files/upload';

  /**
   * Uploads a file buffer or base64 string to ImageKit CDN.
   */
  static async uploadFile(options: ImageKitUploadOptions): Promise<ImageKitUploadResult> {
    const authHeader = `Basic ${Buffer.from(env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`;

    const formData = new FormData();

    if (Buffer.isBuffer(options.file)) {
      // Node Buffer converted to Uint8Array Blob
      const uint8 = new Uint8Array(options.file);
      const blob = new Blob([uint8], { type: 'application/octet-stream' });
      formData.append('file', blob, options.fileName);
    } else {
      // Base64 or remote URL string
      formData.append('file', options.file);
    }

    formData.append('fileName', options.fileName);

    if (options.folder) {
      formData.append('folder', options.folder);
    } else {
      formData.append('folder', '/medikiosk/documents');
    }

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await fetch(this.uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageKit] Upload failed with status:', response.status, errorText);
      throw new Error(`ImageKit upload failed: ${response.statusText} (${errorText})`);
    }

    const data = (await response.json()) as any;

    return {
      fileId: data.fileId,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || data.url,
      fileType: data.fileType || 'image',
      size: data.size || 0,
    };
  }

  /**
   * Generates a sample high-resolution prescription image as a fallback
   * or demonstration asset if hardware scanner produces synthetic camera frames.
   */
  static getSamplePrescriptionBase64(): string {
    // 1x1 placeholder SVG/data or realistic clinical prescription base64
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100" fill="#ffffff">
        <rect width="800" height="1100" fill="#fcfdfd"/>
        <rect x="30" y="30" width="740" height="1040" fill="none" stroke="#2563eb" stroke-width="2" rx="12"/>
        <rect x="30" y="30" width="740" height="140" fill="#1e293b"/>
        <text x="60" y="85" fill="#ffffff" font-family="Arial, sans-serif" font-size="26" font-weight="bold">MEDIKIOSK HEALTH SYSTEM</text>
        <text x="60" y="115" fill="#93c5fd" font-family="Arial, sans-serif" font-size="14">AI-Assisted Outpatient Department · Clinical Unit 04</text>
        <text x="60" y="140" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12">Registration No: OPD-2026-9042 · ABDM Facility ID: IN-DL-MED-0091</text>
        
        <!-- Doctor Info -->
        <text x="500" y="85" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Dr. Rohan Mehta</text>
        <text x="500" y="105" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="12">MD (Medicine), Cardiology</text>
        <text x="500" y="125" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11">Reg: MCI-89210-A</text>

        <!-- Patient Demographics Box -->
        <rect x="50" y="195" width="700" height="85" fill="#f1f5f9" rx="8" stroke="#e2e8f0"/>
        <text x="70" y="225" fill="#334155" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Patient: <tspan fill="#0f172a">Prakhar Rai</tspan></text>
        <text x="350" y="225" fill="#334155" font-family="Arial, sans-serif" font-size="14">Age / Sex: <tspan font-weight="bold">32 Y / Male</tspan></text>
        <text x="550" y="225" fill="#334155" font-family="Arial, sans-serif" font-size="14">Date: <tspan font-weight="bold">07-Sep-2026</tspan></text>
        <text x="70" y="255" fill="#334155" font-family="Arial, sans-serif" font-size="13">ABHA ID: <tspan font-mono="true">91-4820-9102-3819</tspan></text>
        <text x="350" y="255" fill="#334155" font-family="Arial, sans-serif" font-size="13">Card UID: <tspan font-mono="true">24:33:F0:06</tspan></text>

        <!-- Rx Symbol -->
        <text x="60" y="340" fill="#2563eb" font-family="Georgia, serif" font-size="48" font-weight="bold">℞</text>
        
        <!-- Medications -->
        <rect x="50" y="370" width="700" height="320" fill="#ffffff" stroke="#cbd5e1" stroke-dasharray="4" rx="8"/>
        
        <text x="80" y="415" fill="#0f172a" font-family="Arial, sans-serif" font-size="16" font-weight="bold">1. Tab. Paracetamol 650 mg</text>
        <text x="100" y="440" fill="#475569" font-family="Arial, sans-serif" font-size="13">Dosage: 1 tablet TDS (after food) x 3 days</text>
        <text x="100" y="460" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Indication: Acute febrile illness & bodyache</text>

        <text x="80" y="505" fill="#0f172a" font-family="Arial, sans-serif" font-size="16" font-weight="bold">2. Tab. Pantoprazole 40 mg</text>
        <text x="100" y="530" fill="#475569" font-family="Arial, sans-serif" font-size="13">Dosage: 1 tablet OD (empty stomach in morning) x 5 days</text>
        <text x="100" y="550" fill="#64748b" font-family="Arial, sans-serif" font-size="12">Indication: Gastroprotection</text>

        <text x="80" y="595" fill="#0f172a" font-family="Arial, sans-serif" font-size="16" font-weight="bold">3. Tab. Cetirizine 10 mg</text>
        <text x="100" y="620" fill="#475569" font-family="Arial, sans-serif" font-size="13">Dosage: 1 tablet HS (bedtime) x 5 days</text>

        <!-- Clinical Advice -->
        <rect x="50" y="710" width="700" height="150" fill="#f8fafc" rx="8" stroke="#e2e8f0"/>
        <text x="70" y="740" fill="#1e293b" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Investigations & Clinical Advice:</text>
        <text x="90" y="770" fill="#334155" font-family="Arial, sans-serif" font-size="13">• Complete Blood Count (CBC) with Platelet count</text>
        <text x="90" y="795" fill="#334155" font-family="Arial, sans-serif" font-size="13">• Serum Electrolytes (Na+, K+)</text>
        <text x="90" y="820" fill="#334155" font-family="Arial, sans-serif" font-size="13">• Maintain hydration; review in OPD after 3 days or SOS</text>

        <!-- Signature & Stamp -->
        <line x1="520" y1="960" x2="720" y2="960" stroke="#475569" stroke-width="1.5"/>
        <text x="540" y="985" fill="#334155" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Authorized Signatory</text>
        <text x="550" y="1005" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Digitally Verified via MediKiosk</text>
        <circle cx="620" cy="920" r="30" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="3"/>
        <text x="600" y="925" fill="#2563eb" font-family="Arial, sans-serif" font-size="10" font-weight="bold">VERIFIED</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}`;
  }
}
