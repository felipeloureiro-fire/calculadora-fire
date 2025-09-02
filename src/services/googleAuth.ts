import { gapi } from 'gapi-script';
import credentialsData from '../../credentials.json';

const CLIENT_ID = credentialsData.installed.client_id;
const API_KEY = 'AIzaSyBvOhUNOqQoJzKzNOQiClqVOqN3rWHACkE'; // Generated API Key for Google Sheets access
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
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES
          });

          this.isInitialized = true;
          this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          resolve();
        } catch (error) {
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