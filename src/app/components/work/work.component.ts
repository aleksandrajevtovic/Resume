import { Component, OnDestroy, OnInit } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { TranslateService } from '@ngx-translate/core';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
  standalone: false,
})
export class WorkComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  loading = true;
  private revealTweens: gsap.core.Tween[] = [];
  private pinTimeline?: gsap.core.Timeline;

  constructor(
    private readonly projectService: ProjectService,
    public readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  trackByProject(index: number, project: Project): string {
    return project.id ?? `${project.name}-${index}`;
  }

  getProjectTitle(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.titleDe?.trim()) {
      return project.titleDe;
    }
    if (lang === 'EN' && project.titleEn?.trim()) {
      return project.titleEn;
    }

    if (project.name?.trim()) {
      return project.name;
    }

    if (project.titleKey) {
      const translated = this.translate.instant(project.titleKey);
      if (translated !== project.titleKey) {
        return translated;
      }
    }
    return '';
  }

  getProjectDescription(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.descriptionDe?.trim()) {
      return project.descriptionDe;
    }
    if (lang === 'EN' && project.descriptionEn?.trim()) {
      return project.descriptionEn;
    }

    if (project.description?.trim()) {
      return project.description;
    }

    if (project.descriptionKey) {
      const translated = this.translate.instant(project.descriptionKey);
      if (translated !== project.descriptionKey) {
        return translated;
      }
    }
    return '';
  }

  ngOnDestroy(): void {
    this.pinTimeline?.scrollTrigger?.kill();
    this.pinTimeline?.kill();
    this.revealTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    this.revealTweens = [];
  }

  private loadProjects(): void {
    this.projectService.getPublicProjects().subscribe({
      next: (projects) => {
        this.projects = projects.map((project) => ({
          ...project,
          imageUrl: this.projectService.resolveImageUrl(project.imageUrl),
        }));
        this.loading = false;
        setTimeout(() => {
          this.clearWorkScrollAnimations();
          this.scrollPinAnim();
          this.scrollRevealFromBottom();
          ScrollTrigger.refresh();
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private scrollPinAnim(): void {
    const width = window.innerWidth;
    let pinStart = '55%';

    if (width < 768) {
      pinStart = '85%';
    } else if (width < 1024) {
      pinStart = '72%';
    }

    this.pinTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#about',
        start: pinStart,
        end: '100%',
        pin: true,
        pinSpacing: false,
      },
    });

    this.pinTimeline.to('#projects', {
      backgroundColor: '#151527',
      position: 'relative',
      zIndex: '2',
    });
  }

  private scrollRevealFromBottom(): void {
    const sections = document.querySelectorAll('.flex-section');
    sections.forEach((section, index) => {
      const tween = gsap.fromTo(
        section,
        { y: 90, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 92%',
            end: 'top 58%',
            scrub: 0.6,
          },
          delay: index * 0.02,
        }
      );
      this.revealTweens.push(tween);
    });
  }

  private clearWorkScrollAnimations(): void {
    this.pinTimeline?.scrollTrigger?.kill();
    this.pinTimeline?.kill();
    this.pinTimeline = undefined;

    this.revealTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    this.revealTweens = [];
  }
}
