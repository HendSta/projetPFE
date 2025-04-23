import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  specialty: string = '';
  experience: number | null = null;
  clinicAddress: string = '';
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  phone: string = '';
  password: string = '';
  // RegExp to enforce Auth0‐style password rules
  passwordPattern: RegExp = /^(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/;
  currentUser: any = null;
  
  constructor(public auth: AuthService, private http: HttpClient, private profileService: ProfileService) {}
  
  getDefaultProfileImage(): string {
    return 'https://via.placeholder.com/80';
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(this.selectedFile);
  }

  ngOnInit(): void {
    // When Auth0 user is available, fetch stored profile from backend
    this.auth.user$.subscribe(authUser => {
      if (!authUser) return;
      const auth0Id = authUser.sub as string;
      this.http.get<any>(`http://localhost:8000/api/auth/profile/${auth0Id}`)
        .subscribe(
          dbUser => {
            // Use returned DB record as currentUser
            this.currentUser = dbUser;
            // Prefill form fields
            this.specialty = dbUser.specialty || '';
            this.experience = dbUser.experience || null;
            this.clinicAddress = dbUser.clinicAddress || '';
            this.phone = dbUser.phone || '';
            this.previewUrl = dbUser.picture || null;
            // Broadcast loaded profile
            this.profileService.setProfile(dbUser);
          },
          err => {
            console.error('Error fetching profile from DB:', err);
          }
        );
    });
  }

  saveProfile(): void {
    // Prevent update if password violates rules
    if (this.password && !this.passwordPattern.test(this.password)) {
      alert('Password must be at least 8 characters and include uppercase, lowercase, and number.');
      return;
    }
    if (!this.currentUser) return;
    const picture = typeof this.previewUrl === 'string' ? this.previewUrl : this.currentUser.picture;
    const payload = {
      auth0Id: this.currentUser.auth0Id,
      name: this.currentUser.name,
      email: this.currentUser.email,
      password: this.password,
      specialty: this.specialty,
      experience: this.experience,
      clinicAddress: this.clinicAddress,
      picture,
      phone: this.phone
    };
    this.http.put<any>(`http://localhost:8000/api/auth/profile/${payload.auth0Id}`, payload)
      .subscribe(
        (updated) => {
          console.log('Profile updated:', updated);
          // Reflect updated data in the component
          this.currentUser = updated;
          // Broadcast updated profile
          this.profileService.setProfile(updated);
          alert('Profile updated successfully!');
        },
        (error) => {
          console.error('Update profile error:', error);
          const detail = error.error?.detail || error.message || 'Unknown error';
          alert('Error updating profile: ' + detail);
        }
      );
  }
}
