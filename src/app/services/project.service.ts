import { Injectable } from '@angular/core';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects: Project[] = [
    new Project(
      1,
      'E-Mobilnost',
      'Unlike tutorials that only cover a few concepts and leave you with half-baked GitHub repositories, this course covers everything from explaining the principles of REST APIs to implementing Spotifys OAuth flow and fetching API data in a React app. By the end of the course, you’ll have an app deployed to the internet you can add to your portfolio.',
      './assets/images/emobilnost.png',
      'Spring Boot',
      'Bootstrap 4',
      'SCSS',
      'MySQL',
      '',
      '',
      '',
      'https://emobilnost.rs/'
    ),
    new Project(
      2,
      'Margotekstil',
      'Project 2 desc',
      './assets/images/margotekstil.png',
      'Spring Boot',
      'Bootstrap 4',
      'SCSS',
      'MySQL',
      '',
      '',
      '',
      'https://www.margotekstil.com/'
    ),
    new Project(
      3,
      'Nutritionist Mylah Bloom',
      'Project 3 desc',
      './assets/images/nutritionist.png',
      'React',
      'SCSS',
      '',
      '',
      '',
      '',
      'https://github.com/sanja048/Nutritionist',
      'https://mylahbloomfit.herokuapp.com/'

    ),
    new Project(
      4,
      'Fitness trainer',
      'Project 4 desc',
      './assets/images/5.png',
      'Spring Boot',
      'Bootstrap 5',
      'Bootstrap 5',
      'Bootstrap 4',
      'Bootstrap 4',
    ),
    new Project(
      5,
      'Studio Jablan',
      'Interior design studio',
      './assets/images/margotekstil.png',
      'Spring Boot',
      'Bootstrap 5',
      'SCSS',
      '',
      '',
      '',
      'https://github.com/sanja048/jablan',
      'https://studiojablan.herokuapp.com/'
    ),
  ];
  // {
  //   id: 1,
  //   imgUrl: './assets/images/emobilnost.png',
  //   title: 'E-Mobilnost',
  //   description:
  //     'Technology start-up on a mission to help build a carbon neutral economy by automating your carbon management.',
  //   tech: 'Spring Boot, Bootstrap 4, SCSS, jQuery',
  // },
  // {
  //   id: 2,
  //   imgUrl: './assets/images/margotekstil.png',
  //   title: 'Margotekstil',
  //   description:
  //     'Having struggled with understanding how the Spotify OAuth flow works, I made the course I wish I could have had.,        ',
  //   tech: 'Spring Boot, Bootstrap 4, SCSS, jQuery',
  // },

  constructor() {}

  getProjects(): Project[] {
    return this.projects;
  }
}
