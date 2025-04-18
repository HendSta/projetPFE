import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private themeKey = 'theme';

  constructor() {
    this.loadSavedTheme();
  }

  toggleTheme(): void {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem(this.themeKey, 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem(this.themeKey, 'dark');
    }
  }

  loadSavedTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }
}
