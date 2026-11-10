<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Órdenes</ion-title>
        <ion-buttons slot="end" v-if="token">
          <ion-button color="light" @click="cerrarSesion">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- FORMULARIO DE LOGIN -->
      <div v-if="!token" class="login-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Iniciar Sesión</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Correo Electrónico</ion-label>
              <ion-input v-model="email" type="email" placeholder="usuario@ejemplo.com" />
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Contraseña</ion-label>
              <ion-input v-model="password" type="password" placeholder="••••••••" />
            </ion-item>

            <ion-button expand="block" class="ion-margin-top" @click="hacerLogin" :disabled="cargando">
              {{ cargando ? 'Ingresando...' : 'Ingresar' }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- LISTA DE ÓRDENES -->
      <div v-else>
        <ion-list>
          <ion-item v-for="order in ordenes" :key="order.id">
            <ion-label>
              <h2>Código: <strong>{{ order.code }}</strong></h2>
              <p v-if="order.customer">Cliente: {{ order.customer.name }}</p>
              <p>Estado: <ion-badge :color="getBadgeColor(order.status)">{{ order.status }}</ion-badge></p>
            </ion-label>
            <ion-note slot="end" color="primary">
              ${{ order.total }}
            </ion-note>
          </ion-item>
        </ion-list>

        <p v-if="!cargando && ordenes.length === 0" class="ion-text-center">
          No hay órdenes registradas.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonBadge, IonNote, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonInput, IonButton, IonButtons 
} from '@ionic/vue';
import { Order } from '@/interfaces/ordert';

const API_BASE_URL = 'https://ds4-demo-5w8lmtds.on-forge.com';

const token = ref<string | null>(localStorage.getItem('auth_token'));
const email = ref('');
const password = ref('');
const cargando = ref(false);
const ordenes = ref<Order[]>([]);

// Login consumiendo /sanctum/token
async function hacerLogin() {
  if (!email.value || !password.value) {
    alert('Ingresa correo y contraseña');
    return;
  }

  cargando.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/sanctum/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Credenciales inválidas');
    }

    // Guardar token obtenido de Sanctum
    const authToken = data.token || data.access_token;
    localStorage.setItem('auth_token', authToken);
    token.value = authToken;

    email.value = '';
    password.value = '';
    await cargarOrdenes();

  } catch (error: any) {
    alert(error.message || 'Error al iniciar sesión');
  } finally {
    cargando.value = false;
  }
}

// Cargar órdenes usando /api/orders con el Bearer Token
async function cargarOrdenes() {
  if (!token.value) return;

  cargando.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (res.status === 401) {
      cerrarSesion();
      return;
    }

    const json = await res.json();
    ordenes.value = Array.isArray(json) ? json : (json.data || []);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
  } finally {
    cargando.value = false;
  }
}

function cerrarSesion() {
  localStorage.removeItem('auth_token');
  token.value = null;
  ordenes.value = [];
}

function getBadgeColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'medium';
  }
}

onMounted(() => {
  if (token.value) {
    cargarOrdenes();
  }
});
</script>