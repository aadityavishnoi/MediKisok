import { execSync } from 'child_process';

const envVars = [
  { key: 'IMAGEKIT_PRIVATE_KEY', value: 'private_uFRBrN9V/PDJWEVQV0Cs0wsVLO4=' },
  { key: 'IMAGEKIT_URL_ENDPOINT', value: 'https://ik.imagekit.io/aadityavishnoi' },
  { key: 'TEXTBEE_API_KEY', value: 'txb_9LK7dSkLAKsxSHUPtlDkQ3HLYLS7fDR7' },
  { key: 'TEXTBEE_DEVICE_ID', value: '6aa07fb6ccb6c7270942b550' },
  { key: 'GEMINI_API_KEY', value: 'AQ.Ab8RN6JFDbb6gvsL275LT3bLV2eud3eEmjqJZZCtEey6DtMubQ' },
  { key: 'AI_PROVIDER', value: 'LOCAL' },
  { key: 'RFID_SERIAL_ENABLED', value: 'true' },
];

for (const { key, value } of envVars) {
  try {
    console.log(`Setting ${key}...`);
    // Try removing first if exists
    try {
      execSync(`npx vercel env rm ${key} production --yes --scope aaditya-vishnois-projects`, { stdio: 'ignore' });
    } catch {}
    execSync(`npx vercel env add ${key} production --value "${value}" --yes --scope aaditya-vishnois-projects`, {
      stdio: 'inherit',
    });
    console.log(`✓ ${key} uploaded successfully.`);
  } catch (err) {
    console.error(`Failed to set ${key}:`, err.message);
  }
}

console.log('All environment variables uploaded to Vercel!');
