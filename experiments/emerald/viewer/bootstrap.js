// Keep the static poster and a usable retry path even if a module fails to load.
import('./viewer.js?v=film-final-5').catch(error => {
  console.error('Could not start the beetle viewer:', error);
  document.getElementById('loading').hidden = true;
  document.getElementById('error').hidden = false;
  document.getElementById('error-detail').textContent = 'The 3D viewer could not start. Check your connection or try a current browser.';
  document.getElementById('retry').onclick = () => location.reload();
});
