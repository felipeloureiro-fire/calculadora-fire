import { gapi } from 'gapi-script';

// OAuth-only configuration (no API key needed)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '952367386931-l0o2sscuf6c135guhv22cut7739p6o6s.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

export class GoogleAuthService {
  private isInitialized = false;
  private isSignedIn = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      gapi.load('auth2:client', async () => {
        try {
          await gapi.client.init({
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES
          });

          this.isInitialized = true;
          this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          resolve();
        } catch (error) {
          console.error('Erro na inicialização do Google API:', error);
          reject(error);
        }
      });
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = gapi.auth2.getAuthInstance();
    
    if (authInstance.isSignedIn.get()) {
      this.isSignedIn = true;
      return true;
    }

    try {
      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return false;
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