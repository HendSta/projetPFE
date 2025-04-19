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

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
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
