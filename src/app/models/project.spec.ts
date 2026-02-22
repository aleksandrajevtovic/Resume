import { Project } from './project';

describe('Project', () => {
  it('should type a project object', () => {
    const project: Project = {
      name: 'Sample',
      description: 'Sample description',
      imageUrl: 'sample.png',
      techStack: ['Angular', 'Spring Boot'],
      sortOrder: 1,
    };

    expect(project.name).toBe('Sample');
  });
});
