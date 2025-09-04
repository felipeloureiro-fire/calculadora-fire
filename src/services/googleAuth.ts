import { gapi } from 'gapi-script';

console.log('📚 googleAuth.ts sendo carregado...');

// OAuth-only configuration (no API key needed)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('🔑 CLIENT_ID carregado do .env:', CLIENT_ID);

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

if (!CLIENT_ID) {
  console.error('❌ VITE_GOOGLE_CLIENT_ID está undefined');
  throw new Error('❌ VITE_GOOGLE_CLIENT_ID não está configurado no arquivo .env');
}

console.log('✅ googleAuth.ts configuração OK');

export class GoogleAuthService {
  private isInitialized = false;
  private isSignedIn = false;

  constructor() {
    console.log('🏗️ GoogleAuthService construtor chamado');
    console.log('📋 CLIENT_ID no construtor:', CLIENT_ID);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔧 Inicializando Google Auth Service...');
    console.log('📋 CLIENT_ID:', CLIENT_ID);
    console.log('📋 SCOPES:', SCOPES);

    return new Promise((resolve, reject) => {
      gapi.load('auth2:client', async () => {
        try {
          console.log('📚 Carregando Google APIs...');
          await gapi.client.init({
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES
          });

          console.log('✅ Google API inicializada com sucesso');
          this.isInitialized = true;
          this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          console.log('🔍 Status inicial de autenticação:', this.isSignedIn);
          resolve();
        } catch (error) {
          console.error('❌ Erro na inicialização do Google API:', error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          reject(error);
        }
      });
    });
  }

  async signIn(): Promise<boolean> {
    console.log('🔐 Iniciando processo de autenticação...');
    
    if (!this.isInitialized) {
      console.log('🔧 Inicializando Google API...');
      await this.initialize();
    }

    const authInstance = gapi.auth2.getAuthInstance();
    console.log('🔍 Verificando status de autenticação atual...');
    
    if (authInstance.isSignedIn.get()) {
      console.log('✅ Usuário já autenticado');
      this.isSignedIn = true;
      return true;
    }

    try {
      console.log('🚀 Iniciando fluxo de login OAuth...');
      
      // Usar signIn com opções específicas
      const user = await authInstance.signIn({
        scope: SCOPES
      });
      
      if (user && authInstance.isSignedIn.get()) {
        console.log('✅ Autenticação bem-sucedida');
        console.log('👤 Usuário autenticado:', user.getBasicProfile().getEmail());
        this.isSignedIn = true;
        return true;
      } else {
        console.error('❌ Falha na autenticação - usuário não foi autenticado');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      
      // Tentar método alternativo se o primeiro falhar
      try {
        console.log('🔄 Tentando método alternativo...');
        window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:5173')}&response_type=code&scope=${encodeURIComponent(SCOPES)}`, '_blank');
        return false; // Por enquanto retorna false, implementar callback depois
      } catch (altError) {
        console.error('❌ Método alternativo também falhou:', altError);
        return false;
      }
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
      await authInstance.signOut();
      this.isSignedIn = false;
    }
  }

  isAuthenticated(): boolean {
    return this.isSignedIn && gapi.auth2?.getAuthInstance()?.isSignedIn.get();
  }

  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    return gapi.auth2.getAuthInstance().currentUser.get();
  }
}