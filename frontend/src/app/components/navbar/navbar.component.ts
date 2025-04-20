import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isDarkMode = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }
}
