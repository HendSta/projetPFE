import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService,User } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.auth.user$.subscribe((user: User | null | undefined) => {
      if (user) {
        // 👇 Appel backend pour enregistrer/utiliser l’utilisateur
        this.http.post('http://localhost:8000/api/auth/register', {
          auth0Id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture
        }).subscribe(
          (res) => console.log('Utilisateur enregistré :', res),
          (err) => console.error('Erreur lors de l’enregistrement :', err)
        );
      }
    });

    // Rediriger vers le profil
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/user-profile']);
      }
    });
  }
}
