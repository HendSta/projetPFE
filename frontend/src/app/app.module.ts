import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LucideAngularModule } from 'lucide-angular';
import { 
  Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus, 
  Users, Trophy, Mail, Linkedin, Facebook, Twitter, Instagram,
  MapPin, Phone, Clock, CreditCard, Landmark, CircleDollarSign, ChevronRight,
  Check, CheckCircle, FileText, Download, Headphones, HelpCircle
} from 'lucide-angular';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { AuthButtonComponent } from './auth-button/auth-button.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthModule } from '@auth0/auth0-angular';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    SigninComponent,
    SignupComponent,
    AuthButtonComponent,
    UserProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule.forRoot({
      domain: 'dev-3z4wx78gwy1inwps.us.auth0.com',
      clientId: '2CTMPHhvwVZ2OK8LK9mQM6GoitUSgIVe',
      authorizationParams: {
        redirect_uri: window.location.origin //redirect after l auth
      }
    }),
    LucideAngularModule.pick({ 
      Moon, Sun, LogIn, Activity, Stethoscope, Menu, UserPlus,
      Users, Trophy, Mail, Linkedin, Facebook, Twitter, Instagram,
      MapPin, Phone, Clock, CreditCard, Landmark, CircleDollarSign, ChevronRight,
      Check, CheckCircle, FileText, Download, Headphones, HelpCircle
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
