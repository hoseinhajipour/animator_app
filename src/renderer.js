const { ipcRenderer } = require('electron');

document.getElementById('runButton').addEventListener('click', () => {
  ipcRenderer.send('run-command');
});
ipcRenderer.on('command-done', (event, code, result) => {
    const resultDiv = document.getElementById('result');
    if (code === 0) {
      // Command executed successfully
      resultDiv.textContent = 'Command executed successfully. Result: ' + result;
    } else {
      // Command execution failed
      resultDiv.textContent = 'Error occurred while executing the command. Exit code: ' + code;
    }
  });


