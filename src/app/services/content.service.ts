import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContentBlock } from '../models/content-block';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getPublicContentBlocks(): Observable<ContentBlock[]> {
    return this.http.get<ContentBlock[]>(`${this.baseUrl}/public/content`);
  }

  getPublicContentMap(): Observable<Record<string, string>> {
    return this.getPublicContentBlocks().pipe(
      map((blocks) =>
        blocks.reduce((acc, block) => {
          acc[block.key] = block.value;
          return acc;
        }, {} as Record<string, string>)
      )
    );
  }

  getAdminContentBlocks(): Observable<ContentBlock[]> {
    return this.http.get<ContentBlock[]>(`${this.baseUrl}/admin/content`);
  }

  createContentBlock(block: ContentBlock): Observable<ContentBlock> {
    return this.http.post<ContentBlock>(`${this.baseUrl}/admin/content`, block);
  }

  updateContentBlock(id: string, block: ContentBlock): Observable<ContentBlock> {
    return this.http.put<ContentBlock>(`${this.baseUrl}/admin/content/${id}`, block);
  }

  deleteContentBlock(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/content/${id}`);
  }
}
