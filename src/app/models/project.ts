export class Project {
  id: number;
  name: string;
  description: string;
  imgUrl: string;
  tech1: string;
  tech2: string;
  tech3: string;
  tech4: string;
  tech5: string;
  tech6: string;
  link: string;
  git:string;

  constructor(id = 0, name = '', description = '', imgUrl = '', tech1 = '', tech2 = '', tech3 = '', tech4 = '', tech5 = '', tech6 = '', link='', git='') {
    this.id = id;
    this.name = name;
    this.description = description;
    this.imgUrl = imgUrl;
    this.tech1 = tech1;
    this.tech2 = tech2;
    this.tech3 = tech3;
    this.tech4 = tech4;
    this.tech5 = tech5;
    this.tech6 = tech6;
    this.link=link;
    this.git=git;
  }
}
