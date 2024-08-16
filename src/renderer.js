// Variable global para almacenar los paths de los volúmenes
let volumePaths = [];

// Recibe datos del proceso principal
window.api.readDockerComposeFile().then(data => {
  console.log('Docker Compose data on load:', data);

  if (data && data.services && data.services['code-server']) {
    const environment = data.services['code-server'].environment || [];
    const volumes = data.services['code-server'].volumes || [];

    const passwordEnv = environment.find(env => env.startsWith('PASSWORD='));
    const password = passwordEnv ? passwordEnv.split('=')[1] : '';

    document.getElementById('password').value = password || '';

    const volumeList = document.getElementById('volume-list');
    volumeList.innerHTML = ''; // Limpiar lista antes de agregar

    volumes.forEach((volume, index) => {
      const div = document.createElement('div');
      div.className = 'volume-item'; // Agrega una clase para identificar los elementos de volumen
      div.textContent = volume;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'btn btn-danger';
      deleteButton.addEventListener('click', () => deleteVolume(index));

      div.appendChild(deleteButton);
      volumeList.appendChild(div);
    });

    // Actualiza la variable global con los volúmenes
    volumePaths = volumes;
  } else {
    console.error('No se pudo leer la configuración del archivo docker-compose.yml');
  }
});

function saveDockerConfiguration() {
  const port = document.getElementById('port').value;
  const password = document.getElementById('password').value;

  window.api.saveDockerConfig({ port, password, volumes: volumePaths })
    .then(() => window.api.readDockerComposeFile()) // Relee la configuración para actualizar la lista
    .catch(error => console.error('Error saving configuration:', error));
}

function deleteVolume(index) {
  // Elimina el volumen de la variable global
  volumePaths.splice(index, 1);

  // Actualiza la interfaz de usuario
  const volumeList = document.getElementById('volume-list');
  volumeList.innerHTML = ''; // Limpiar lista antes de agregar
  volumePaths.forEach((volume, idx) => {
    const div = document.createElement('div');
    div.className = 'volume-item';
    div.textContent = volume;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'btn btn-danger';
    deleteButton.addEventListener('click', () => deleteVolume(idx));

    div.appendChild(deleteButton);
    volumeList.appendChild(div);
  });

}


window.api.on('docker-config-saved', (event, message) => {
  alert(message);
});

document.getElementById('add-volume').addEventListener('click', addVolume);

function addVolume() {
  window.api.selectFolder()
    .then((newVolumes) => {
      // Actualiza la variable global con los nuevos volúmenes
      volumePaths = [...volumePaths, ...newVolumes];

      // Actualiza la lista de volúmenes en la interfaz
      const volumeList = document.getElementById('volume-list');
      volumeList.innerHTML = ''; // Limpiar lista antes de agregar
      volumePaths.forEach((volume, index) => {
        const div = document.createElement('div');
        div.className = 'volume-item';
        div.textContent = volume;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger';
        deleteButton.addEventListener('click', () => deleteVolume(index));

        div.appendChild(deleteButton);
        volumeList.appendChild(div);
      });
    })
    .catch(error => console.error('Error adding volume:', error));
}


document.getElementById('mount-docker').addEventListener('click', () => {
  window.api.mountDockerContainer()
    .then(() => alert('Docker container mounted successfully'))
    .catch(error => console.error('Error mounting Docker container:', error));
});

document.getElementById('update-docker').addEventListener('click', () => {
  window.api.updateDockerContainer()
    .then(() => alert('Docker container updated successfully'))
    .catch(error => console.error('Error updating Docker container:', error));
});

document.getElementById('delete-docker').addEventListener('click', () => {
  window.api.deleteDockerContainer()
    .then(() => alert('Docker container deleted successfully'))
    .catch(error => console.error('Error deleting Docker container:', error));
});
