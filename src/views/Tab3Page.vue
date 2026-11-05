<template>
  <ion-page>
    <ion-header v-show="!isScanning">
      <ion-toolbar>
        <ion-title>Guardar un post</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" :class="{ 'scanner-hide': isScanning }">
      <ion-header v-show="!isScanning" collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Guardar</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Vista normal del formulario -->
      <div v-show="!isScanning" class="ion-padding">
        <!-- Botón para iniciar escaneo QR -->
        <ion-button expand="block" color="secondary" @click="escanearQR">
          Escanear Código QR
        </ion-button>

        <form @submit.prevent="submitForm">
          <ion-item>
            <ion-input
              v-model="postData.title"
              label="Título"
              label-placement="floating"
              type="text"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-textarea
              v-model="postData.body"
              label="Contenido (Body)"
              label-placement="floating"
              required
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-select
              v-model="postData.userId"
              label="Usuario"
              label-placement="floating"
              interface="popover"
            >
              <ion-select-option 
                v-for="usuario in usuarios" 
                :key="usuario.id" 
                :value="usuario.id"
              >
                {{ usuario.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-button expand="block" type="submit" class="ion-margin-top">
            Enviar Post
          </ion-button>

          <ion-alert
            :is-open="showAlert"
            header="Creado con éxito"
            :message="alertMessage"
            :buttons="alertButtons"
            @didDismiss="showAlert = false"
          ></ion-alert>
        </form>
      </div>

      <!-- Botón flotante para cancelar el escaneo -->
      <div v-show="isScanning" class="scanner-controls">
        <ion-button color="danger" @click="detenerEscaneo">
          Cancelar Escaneo
        </ion-button>
      </div>

      <ExploreContainer v-show="!isScanning" name="Tab 3 page" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Usuarios } from '@/interfaces/usuarios';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonAlert, IonInput, IonTextarea, IonButton,
  IonSelect, IonSelectOption 
} from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { 
  CapacitorBarcodeScanner, 
  CapacitorBarcodeScannerTypeHint 
} from '@capacitor/barcode-scanner';

interface PostForm {
  title: string;
  body: string;
  userId: number | string;
}

const usuarios = ref<Usuarios[]>([]);
const alertButtons = ['OK'];
const showAlert = ref(false);
const alertMessage = ref('');
const isScanning = ref(false);

const postData = reactive<PostForm>({
  title: '',
  body: '',
  userId: ''
});

function cargarUsuarios() {
  fetch('https://jsonplaceholder.typicode.com/users')
    .then(response => response.json())
    .then(json => {
      usuarios.value = json;
    })
    .catch(error => console.error('Error cargando usuarios:', error));
}

onMounted(() => {
  cargarUsuarios();
});

onUnmounted(() => {
  if (isScanning.value) {
    detenerEscaneo();
  }
});

const escanearQR = async () => {
  // 1. Validar ejecución en plataforma nativa
  if (!Capacitor.isNativePlatform()) {
    alert('El escáner de cámara solo funciona en un dispositivo móvil.');
    return;
  }

  try {
    // 2. Disparar el escáner nativo
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL,
    });

    // 3. Rellenar los campos si se obtuvo un resultado
    if (result && result.ScanResult) {
      try {
        const datosQR = JSON.parse(result.ScanResult);
        if (datosQR.title) postData.title = datosQR.title;
        if (datosQR.body) postData.body = datosQR.body;
        if (datosQR.userId) postData.userId = Number(datosQR.userId);
      } catch {
        postData.title = result.ScanResult;
      }
    }
  } catch (error) {
    console.error('Error al escanear QR:', error);
  }
};

const detenerEscaneo = async () => {
  await CapacitorBarcodeScanner.showBackground();
  await CapacitorBarcodeScanner.stopScan();
  document.body.classList.remove('scanner-active');
  isScanning.value = false;
};

const submitForm = async () => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: postData.title,
        body: postData.body,
        userId: Number(postData.userId), 
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    
    const json = await response.json();

    const usuarioSeleccionado = usuarios.value.find(u => u.id === Number(postData.userId));
    const nombreUsuario = usuarioSeleccionado ? usuarioSeleccionado.name : 'Desconocido';

    alertMessage.value = `Post ${json.id} creado por ${nombreUsuario}.`;
    showAlert.value = true;

    postData.title = '';
    postData.body = '';
  } catch (error) {
    console.error('Error en la petición POST:', error);
  }
};
</script>
