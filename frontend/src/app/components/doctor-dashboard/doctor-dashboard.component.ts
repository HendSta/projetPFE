import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  userProfile: any;
  auth0Id: string = '';
  showWebmailMenu = false;
  webmailMenuTimeout: any;

  constructor(public auth: AuthService, private http: HttpClient, private profileService: ProfileService) {}

  ngOnInit(): void {
    // Subscribe to profile changes for live updates
    this.profileService.profile$.subscribe(profile => {
      if (profile) {
        this.userProfile = profile;
      }
    });
    // Fetch DB profile after Auth0 login
    this.auth.user$.subscribe(authUser => {
      if (!authUser) return;
      this.auth0Id = authUser.sub as string;
      this.http.get<any>(`http://localhost:8000/api/auth/profile/${this.auth0Id}`)
        .subscribe(
          dbUser => {
            // Set and broadcast loaded profile
            this.profileService.setProfile(dbUser);
          },
          err => console.error('Error loading DB profile:', err)
        );
    });
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  openGmail() {
    window.open('https://mail.google.com/', '_blank');
  }

  openOutlook() {
    window.open('https://outlook.live.com/mail/', '_blank');
  }

  copyEmail(email: string) {
    navigator.clipboard.writeText(email);
  }

  toggleWebmailMenu() {
    this.showWebmailMenu = !this.showWebmailMenu;
    if (this.showWebmailMenu) {
      clearTimeout(this.webmailMenuTimeout);
    }
  }

  hideWebmailMenuWithDelay() {
    this.webmailMenuTimeout = setTimeout(() => {
      this.showWebmailMenu = false;
    }, 300);
  }
}
