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
      'E-Mobilnost, the association of electric vehicle drivers in Serbia, was founded with the aim of raising awareness, not only among drivers and owners, but also the entire society. To show and prove that electric vehicles are not a distant future but are very much a part of the present. They are a smart choice for every individual, better quality, more efficient and much healthier life.',
      './assets/images/emobb.png',
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
      'Margotekstil is a team with more than 20 years of proven practical experience in sewing. They have professional knowledge and all the necessary production capacities to fulfill all the needs of our clients. They offer the services of professional custom tailoring in the field of HoReCa textiles, decorative textiles and a unique domestic PET MANIA program for pets.',
      './assets/images/margot.png',
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
      'Mylah is a healthy lifestyle, nutrition, and mindfulness platform established by Mylah Bloom - a certified nutritionist, sharing her knowledge and expertise in her innovative exercise and dietary plans. MylahFit is empowering its clients to attain their body goals while being kind and gentle to their bodies and minds.',
      './assets/images/nutri.png',
      'React',
      'Node.js',
      'SCSS',
      'Spoonacular API',
      '',
      '',
      'https://github.com/aleksandrajevtovic/Nutritionist',
      'https://mylahbloomfit.netlify.app/'

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
      'As an interior design studio built on creativity, collaboration and unparalleled service, established in 2013, Studio Jablan experience is focused on crafting the ideal environment for each client.',
      './assets/images/jablan.png',
      'Spring Boot',
      'Thymeleaf',
      'SCSS',
      'GSAP',
      '',
      '',
      'https://github.com/aleksandrajevtovic/jablan',
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
