const kind = document.querySelector('[data-success]')?.dataset.success;
const key = `aixsd:submitted:${kind}`;
const timestamp = Number(sessionStorage.getItem(key));
const received = timestamp && Date.now() - timestamp < 30 * 60 * 1000;
if (!received) {
  document.querySelector('#success-message').hidden = true;
  document.querySelector('#missing-submission').hidden = false;
}
