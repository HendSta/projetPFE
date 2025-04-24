import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-analyzing',
  templateUrl: './analyzing.component.html',
  styleUrls: ['./analyzing.component.css']
})
export class AnalyzingComponent {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  analysisResult: any[] = [];
  tableColumns: string[] = [];

  constructor(private http: HttpClient) {}

  // Handle file selection from input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Trigger analysis for the selected file
  onAnalyzeFile(): void {
    if (!this.selectedFile) {
      console.log('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isLoading = true;

    this.http.post<any[]>('http://127.0.0.1:8000/upload-pdf', formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.analysisResult = response;
          // Define table columns in fixed order: input fields then prediction fields
          this.tableColumns = [
            'CodeParametre',
            'ValeurActuelle',
            'Unite',
            'ValeursUsuelles',
            'ValeurUsuelleMin',
            'ValeurUsuelleMax',
            'CodParametre',
            'LIBMEDWINabrege',
            'LibParametre',
            'FAMILLE'
          ];
          console.log('Analysis result:', this.analysisResult);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error uploading file:', error);
        }
      });
  }
}
