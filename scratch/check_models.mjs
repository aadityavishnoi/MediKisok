import fs from 'fs';

const schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

function showModel(name) {
  const reg = new RegExp(`model\\s+${name}\\s+\\{([^\\}]+)\\}`, 'm');
  const match = schema.match(reg);
  console.log(`=== ${name} ===`);
  console.log(match ? match[0] : 'NOT FOUND');
}

showModel('DeviceHeartbeat');
showModel('RFIDDevice');
showModel('AIAssistance');
showModel('PatientSession');
showModel('Consultation');
showModel('AIModel');
showModel('AIModelVersion');
showModel('AIModelDeployment');
