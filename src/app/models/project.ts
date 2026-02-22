export interface Project {
  id?: string;
  name?: string;
  description?: string;
  titleEn?: string;
  titleDe?: string;
  descriptionEn?: string;
  descriptionDe?: string;
  titleKey?: string;
  descriptionKey?: string;
  imageUrl: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  sortOrder: number;
}
