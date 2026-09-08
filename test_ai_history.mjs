import http from 'node:http';

async function main() {
  const { app } = await import('./apps/backend/dist/app.js');
  
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Testing against server on', baseUrl);

  // 1. Start history with chest pain
  const startRes = await fetch(`${baseUrl}/api/history/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'test-session-ai-' + Date.now(),
      chiefComplaint: 'chest_pain',
      mode: 'KIOSK'
    })
  });

  const startData = await startRes.json();
  console.log('Start History Status:', startRes.status);
  console.log('Returned Question:', JSON.stringify(startData.question, null, 2));

  // 2. Answer question
  if (startData.question) {
    const answerRes = await fetch(`${baseUrl}/api/history/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: startData.sessionId,
        nodeId: startData.question.nodeId,
        answer: 'severe',
        mode: 'KIOSK'
      })
    });
    const answerData = await answerRes.json();
    console.log('Answer Status:', answerRes.status);
    console.log('Next Question:', JSON.stringify(answerData.nextQuestion, null, 2));
  }

  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
