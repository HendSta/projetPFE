import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  constructor(@Inject(DOCUMENT) public document: Document,public auth: AuthService) {}

 // Méthode pour rediriger l'utilisateur après la connexion
 login() {
  // Auth0 gère la redirection après la connexion
  this.auth.loginWithRedirect();
}
}
