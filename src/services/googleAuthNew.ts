declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

if (!CLIENT_ID) {
  throw new Error('❌ VITE_GOOGLE_CLIENT_ID não está configurado no arquivo .env');
}

console.log('🔑 CLIENT_ID carregado:', CLIENT_ID);

export class GoogleAuthNewService {
  private accessToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 Inicializando Google Identity Services...');
    
    // Carregar Google Identity Services
    await this.loadGoogleIdentityServices();
    
    // Inicializar cliente OAuth2
    await this.initializeGapi();
    
    this.isInitialized = true;
    console.log('✅ Google Identity Services inicializado');
  }

  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google && window.gapi) {
        resolve();
        return;
      }

      // Carregar Google Identity Services
      const script1 = document.createElement('script');
      script1.src = 'https://accounts.google.com/gsi/client';
      script1.onload = () => {
        // Carregar GAPI
        const script2 = document.createElement('script');
        script2.src = 'https://apis.google.com/js/api.js';
        script2.onload = () => resolve();
        script2.onerror = () => reject(new Error('Falha ao carregar GAPI'));
        document.head.appendChild(script2);
      };
      script1.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
      document.head.appendChild(script1);
    });
  }

  private initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signIn(): Promise<boolean> {
    console.log('🔐 Iniciando processo de autenticação...');
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            console.log('📞 Callback OAuth recebido:', response);
            
            if (response.error) {
              console.error('❌ Erro no OAuth callback:', response.error);
              resolve(false);
              return;
            }

            if (response.access_token) {
              console.log('✅ Token de acesso recebido');
              this.accessToken = response.access_token;
              
              // Configurar token no GAPI client
              window.gapi.client.setToken({
                access_token: response.access_token
              });
              
              resolve(true);
            } else {
              console.error('❌ Nenhum token de acesso recebido');
              resolve(false);
            }
          },
        });

        console.log('🚀 Solicitando token...');
        tokenClient.requestAccessToken();
        
      } catch (error) {
        console.error('❌ Erro ao inicializar token client:', error);
        resolve(false);
      }
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!window.gapi.client.getToken();
  }

  async signOut(): Promise<void> {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken);
    }
    
    this.accessToken = null;
    
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
    
    console.log('👋 Logout realizado');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}