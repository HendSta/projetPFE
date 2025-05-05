import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MedicalReportService {
  private apiUrl = 'http://localhost:8000/api/medical-reports';

  constructor(private http: HttpClient, private auth: AuthService) { }

  // Récupérer tous les rapports de l'utilisateur connecté
  getUserReports(): Observable<any[]> {
    return this.auth.user$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('User not authenticated');
        }
        const auth0Id = user.sub;
        return this.http.get<any[]>(`${this.apiUrl}/user/${auth0Id}`);
      })
    );
  }

  // Récupérer un rapport spécifique par ID
  getReportById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Supprimer un rapport
  deleteReport(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau rapport médical
  createReport(reportData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, reportData);
  }

  // Mettre à jour un rapport existant
  updateReport(id: string, reportData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reportData);
  }

  // Télécharger un rapport au format PDF
  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${id}`, {
      responseType: 'blob'
    });
  }
} 