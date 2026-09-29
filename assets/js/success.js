const kind = document.querySelector('[data-success]')?.dataset.success;
const key = `aixsd:submitted:${kind}`;
const saved = (() => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } })();
const timestamp = Number(saved?.timestamp);
const received = timestamp && Date.now() - timestamp < 30 * 60 * 1000;
if (!received) {
  document.querySelector('#success-message').hidden = true;
  document.querySelector('#missing-submission').hidden = false;
}
const reference = document.querySelector('#submission-reference');
if (reference && received && /^[0-9a-f-]{36}$/i.test(saved?.reference || '')) reference.textContent = saved.reference;
else reference?.closest('.reference-note')?.remove();
