import { ipcRenderer } from 'electron';

ipcRenderer.on('focus-change', (e, state) => {
  document.getElementById('text1').textContent = (state) ? ' (overlay is clickable) ' : 'clicks go through overlay'
});

ipcRenderer.on('visibility-change', (e, state) => {
  if (document.body.style.display) {
    document.body.style.display = null
  } else {
    document.body.style.display = 'none'
  }
});
