import fs from 'fs';

const schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

// Parse models and their fields
const modelRegex = /model\s+(\w+)\s+{([^}]+)}/gs;
let match;
const models = new Map();

while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];
  const fields = [];
  
  body.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('//') || line.startsWith('@@')) return;
    const tokens = line.split(/\s+/);
    if (tokens.length >= 2) {
      fields.push({
        name: tokens[0],
        type: tokens[1],
        isList: tokens[1].endsWith('[]'),
        cleanType: tokens[1].replace('[]', '').replace('?', ''),
        isOptional: tokens[1].endsWith('?'),
        raw: line
      });
    }
  });
  models.set(modelName, fields);
}

// Check relations
const report = [];
for (const [modelName, fields] of models.entries()) {
  for (const f of fields) {
    if (models.has(f.cleanType)) {
      const targetModel = models.get(f.cleanType);
      
      let relName = null;
      const relMatch = f.raw.match(/@relation\(\s*"([^"]+)"/);
      if (relMatch) relName = relMatch[1];
      
      const oppositeFields = targetModel.filter(tf => {
        if (tf.cleanType !== modelName) return false;
        if (relName) {
          return tf.raw.includes('"' + relName + '"');
        } else {
          return !tf.raw.includes('@relation(') || !tf.raw.match(/@relation\(\s*"/);
        }
      });
      
      if (oppositeFields.length === 0) {
        report.push({ issue: 'MISSING_OPPOSITE', model: modelName, field: f.name, target: f.cleanType, relName });
      } else if (oppositeFields.length > 1) {
        report.push({ issue: 'AMBIGUOUS_OPPOSITE', model: modelName, field: f.name, target: f.cleanType, oppositeCount: oppositeFields.length });
      }
    }
  }
}

console.log('--- Total models:', models.size);
console.log('--- Total relation issues:', report.length);
console.log(JSON.stringify(report, null, 2));
