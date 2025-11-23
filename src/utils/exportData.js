export function exportLocalStorage(keys, filename = 'backup.json') {
  const data = {};
  keys.forEach(key => {
    data[key] = JSON.parse(localStorage.getItem(key) || '[]');
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
