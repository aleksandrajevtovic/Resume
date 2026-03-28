package com.portfolio.backend.config;

import com.portfolio.backend.model.AdminUser;
import com.portfolio.backend.model.Project;
import com.portfolio.backend.repository.AdminUserRepository;
import com.portfolio.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Component
public class DataBootstrap implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.username}")
    private String defaultAdminUsername;

    @Value("${app.default-admin.password}")
    private String defaultAdminPassword;

    public DataBootstrap(
            AdminUserRepository adminUserRepository,
            ProjectRepository projectRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.adminUserRepository = adminUserRepository;
        this.projectRepository = projectRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedProjects();
    }

    private void seedAdminUser() {
        if (!StringUtils.hasText(defaultAdminUsername) || !StringUtils.hasText(defaultAdminPassword)) {
            return;
        }

        adminUserRepository.findByUsername(defaultAdminUsername).ifPresentOrElse(
                existing -> {
                    existing.setPasswordHash(passwordEncoder.encode(defaultAdminPassword));
                    existing.setRoles(Set.of("ADMIN"));
                    adminUserRepository.save(existing);
                },
                () -> {
                    AdminUser admin = new AdminUser();
                    admin.setUsername(defaultAdminUsername);
                    admin.setPasswordHash(passwordEncoder.encode(defaultAdminPassword));
                    admin.setRoles(Set.of("ADMIN"));
                    adminUserRepository.save(admin);
                }
        );
    }

    private void seedProjects() {
        List<Project> defaults = List.of(
                createProject("SIUVS", "SIUVS",
                        "The SIUVS application (System for Integrated Emergency Management) was developed to improve disaster management and response across various municipalities.",
                        "Die SIUVS-Anwendung (System fur integriertes Management von Notfallsituationen) wurde entwickelt, um das Katastrophenmanagement und die Reaktion in verschiedenen Gemeinden zu verbessern.",
                        "PROJECTS.TITLEО", "PROJECTS.DESC0", "./assets/images/siuvs.png",
                        List.of("Java", "Spring Boot", "Bootstrap 4", "SCSS", "MySQL", "Thymeleaf"),
                        "https://siuvs.gov.rs/", "", 0),
                createProject("E-Mobilnost", "E-Mobilnost",
                        "E-Mobilnost, the association of electric vehicle drivers in Serbia, raises awareness of electric mobility as part of everyday life.",
                        "E-Mobilnost, der Verband der Fahrer von Elektrofahrzeugen in Serbien, fordert das Bewusstsein fur Elektromobilitat als Teil des Alltags.",
                        "PROJECTS.TITLE1", "PROJECTS.DESC1", "./assets/images/emobb.png",
                        List.of("Java", "Spring Boot", "Bootstrap 4", "SCSS", "MySQL"),
                        "https://emobilnost.rs/", "", 1),
                createProject("Margotekstil", "Margotekstil",
                        "Margotekstil is a team with more than 20 years of practical sewing experience, offering professional custom tailoring services.",
                        "Margotekstil ist ein Team mit mehr als 20 Jahren praktischer Erfahrung im Nahen und bietet professionelle Massschneiderei.",
                        "PROJECTS.TITLE2", "PROJECTS.DESC2", "./assets/images/margot.png",
                        List.of("Java", "Spring Boot", "Bootstrap 4", "SCSS", "MySQL"),
                        "https://www.margotekstil.com/", "", 2),
                createProject("Mylah Bloom", "Mylah Bloom",
                        "Mylah is a healthy lifestyle, nutrition and mindfulness platform with tailored plans and education.",
                        "Mylah ist eine Plattform fur gesunde Lebensweise, Ernahrung und Achtsamkeit mit individuellen Planen und Wissenstransfer.",
                        "PROJECTS.TITLE3", "PROJECTS.DESC3", "./assets/images/nutri.png",
                        List.of("React", "Node.js", "SCSS", "Spoonacular API", "Framer Motion"),
                        "https://mylahbloomfit.netlify.app/", "https://github.com/aleksandrajevtovic/Nutritionist", 3),
                createProject("Studio Jablan", "Studio Jablan",
                        "Studio Jablan is an interior design studio focused on creativity, collaboration and personalized service.",
                        "Studio Jablan ist ein Innenarchitektur-Studio mit Fokus auf Kreativitat, Zusammenarbeit und personalisierten Service.",
                        "PROJECTS.TITLE5", "PROJECTS.DESC5", "./assets/images/jablan.png",
                        List.of("Spring Boot", "Thymeleaf", "SCSS", "GSAP"),
                        "https://studiojablan.onrender.com", "https://github.com/aleksandrajevtovic/jablan", 4)
        );

        defaults.forEach(project -> projectRepository.findByTitleKey(project.getTitleKey()).ifPresentOrElse(
                existing -> {
                    existing.setName(project.getName());
                    existing.setTitleKey(project.getTitleKey());
                    existing.setDescriptionKey(project.getDescriptionKey());
                    existing.setDescription(project.getDescription());
                    existing.setTitleEn(project.getTitleEn());
                    existing.setTitleDe(project.getTitleDe());
                    existing.setDescriptionEn(project.getDescriptionEn());
                    existing.setDescriptionDe(project.getDescriptionDe());
                    existing.setImageUrl(project.getImageUrl());
                    existing.setTechStack(project.getTechStack());
                    existing.setLiveUrl(project.getLiveUrl());
                    existing.setGithubUrl(project.getGithubUrl());
                    if (existing.getSortOrder() == null) {
                        existing.setSortOrder(project.getSortOrder());
                    }
                    projectRepository.save(existing);
                },
                () -> projectRepository.save(project)
        ));
    }

    private Project createProject(
            String name,
            String titleEn,
            String descriptionEn,
            String descriptionDe,
            String titleKey,
            String descriptionKey,
            String imageUrl,
            List<String> techStack,
            String liveUrl,
            String githubUrl,
            int sortOrder
    ) {
        Project project = new Project();
        project.setName(name);
        project.setTitleEn(titleEn);
        project.setTitleDe(name);
        project.setDescriptionEn(descriptionEn);
        project.setDescriptionDe(descriptionDe);
        project.setTitleKey(titleKey);
        project.setDescriptionKey(descriptionKey);
        project.setDescription("");
        project.setImageUrl(imageUrl);
        project.setTechStack(techStack);
        project.setLiveUrl(liveUrl);
        project.setGithubUrl(githubUrl);
        project.setSortOrder(sortOrder);
        return project;
    }
}
