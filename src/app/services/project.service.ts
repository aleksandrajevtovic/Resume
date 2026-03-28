import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly baseUrl = environment.apiUrl;
  private readonly backendBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  constructor(private readonly http: HttpClient) {}

  getPublicProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/public/projects`);
  }

  getAdminProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/admin/projects`);
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/admin/projects`, project);
  }

  updateProject(id: string, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/admin/projects/${id}`, project);
  }

  reorderProjects(projectIds: string[]): Observable<Project[]> {
    return this.http.put<Project[]>(`${this.baseUrl}/admin/projects/reorder`, { projectIds });
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/projects/${id}`);
  }

  uploadProjectImage(file: File): Observable<{ imagePath: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imagePath: string; imageUrl: string }>(
      `${this.baseUrl}/admin/uploads/image`,
      formData
    );
  }

  uploadCv(lang: 'EN' | 'DE', file: File): Observable<{ filePath: string; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filePath: string; fileUrl: string }>(
      `${this.baseUrl}/admin/uploads/cv/${lang.toLowerCase()}`,
      formData
    );
  }

  deleteCv(lang: 'EN' | 'DE'): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/uploads/cv/${lang.toLowerCase()}`);
  }

  resolveImageUrl(pathOrUrl: string): string {
    if (!pathOrUrl) {
      return '';
    }
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    if (pathOrUrl.startsWith('/uploads/')) {
      return `${this.backendBaseUrl}${pathOrUrl}`;
    }
    return pathOrUrl;
  }
}
