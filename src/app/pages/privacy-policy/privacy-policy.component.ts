import { Component, OnDestroy, OnInit } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface PrivacySection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface PrivacyContent {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  intro: string;
  homeCta: string;
  sections: PrivacySection[];
}

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css'],
  standalone: false,
})
export class PrivacyPolicyComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  currentLang: 'EN' | 'DE' = 'EN';

  private readonly contentByLang: Record<'EN' | 'DE', PrivacyContent> = {
    EN: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      updatedLabel: 'Last updated:',
      intro:
        'This Privacy Policy explains what personal data may be processed when you visit this website, contact me, download files, or use the admin area.',
      homeCta: 'Return home',
      sections: [
        {
          title: '1. Controller',
          paragraphs: [
            'Controller: Aleksandra Jevtovic',
            'Email: aleksandrajevtovic93@gmail.com',
            'No separate business address is published on this website.',
          ],
        },
        {
          title: '2. Data processed when you visit this website',
          paragraphs: [
            'When you access this website, technical connection data may be processed automatically by the hosting environment or server infrastructure to deliver the site securely and reliably.',
            'I do not currently provide a public dashboard that lets me manually inspect visitor-level traffic data through this website itself.',
          ],
          items: [
            'IP address',
            'Date and time of the request',
            'Browser and device information',
            'Requested pages and files',
            'Referrer URL, if provided by your browser',
          ],
        },
        {
          title: '3. Contact by email',
          paragraphs: [
            'If you contact me by email, the data you provide, such as your name, email address, and message content, will be processed to respond to your request.',
            'This data is processed only for communication related to your inquiry.',
          ],
        },
        {
          title: '4. Local storage and preferences',
          paragraphs: [
            'This website stores a language preference in your browser local storage so the selected site language can be remembered.',
            'If you use the admin area, an authentication token may also be stored in local storage to keep the session active after login.',
          ],
        },
        {
          title: '5. Third-party resources',
          paragraphs: [
            'This website currently loads certain resources from third-party providers, which may receive technical data such as your IP address when your browser requests those files.',
          ],
          items: [
            'Google Fonts via fonts.googleapis.com and fonts.gstatic.com',
            'Icon font files hosted on Amazon Web Services',
          ],
        },
        {
          title: '6. Purposes and legal bases',
          paragraphs: [
            'Data is processed to provide the website, maintain security, answer inquiries, remember your chosen language, and operate the admin area.',
            'Where applicable, processing is based on legitimate interests, pre-contractual communication, or consent where consent is legally required.',
          ],
        },
        {
          title: '7. Retention',
          paragraphs: [
            'Personal data is kept only for as long as necessary for the relevant purpose or to meet legal obligations.',
            'Browser local storage remains on your device until you clear it or it is overwritten.',
          ],
        },
        {
          title: '8. Your rights',
          paragraphs: [
            'Depending on the law that applies to you, you may have the right to access, rectify, erase, restrict processing of, or object to the processing of your personal data, as well as the right to data portability.',
            'You may also have the right to lodge a complaint with a supervisory authority.',
          ],
        },
        {
          title: '9. Security',
          paragraphs: [
            'Reasonable technical and organizational measures are used to protect personal data, but no internet transmission or storage system can be guaranteed to be completely secure.',
          ],
        },
        {
          title: '10. Changes to this policy',
          paragraphs: [
            'This Privacy Policy may be updated from time to time to reflect legal, technical, or operational changes. The version published on this page is the current version.',
          ],
        },
      ],
    },
    DE: {
      eyebrow: 'Rechtliches',
      title: 'Datenschutzerklärung',
      updatedLabel: 'Zuletzt aktualisiert:',
      intro:
        'Diese Datenschutzerklärung erklärt, welche personenbezogenen Daten verarbeitet werden können, wenn Sie diese Website besuchen, mich kontaktieren, Dateien herunterladen oder den Admin-Bereich nutzen.',
      homeCta: 'Zur Startseite',
      sections: [
        {
          title: '1. Verantwortliche Stelle',
          paragraphs: [
            'Verantwortliche Stelle: Aleksandra Jevtovic',
            'E-Mail: aleksandrajevtovic93@gmail.com',
            'Auf dieser Website wird keine separate Geschäfts- oder Wohnadresse veröffentlicht.',
          ],
        },
        {
          title: '2. Datenverarbeitung beim Besuch dieser Website',
          paragraphs: [
            'Beim Aufruf dieser Website können technische Verbindungsdaten automatisch durch die Hosting-Umgebung oder Server-Infrastruktur verarbeitet werden, um die Seite sicher und zuverlässig bereitzustellen.',
            'Diese Website selbst bietet mir derzeit kein eigenes Dashboard oder Admin-Tool, über das ich Besucherdaten auf Einzelebene manuell einsehen kann.',
          ],
          items: [
            'IP-Adresse',
            'Datum und Uhrzeit der Anfrage',
            'Browser- und Geräteinformationen',
            'Aufgerufene Seiten und Dateien',
            'Referrer-URL, sofern Ihr Browser diese übermittelt',
          ],
        },
        {
          title: '3. Kontakt per E-Mail',
          paragraphs: [
            'Wenn Sie mich per E-Mail kontaktieren, werden die von Ihnen übermittelten Daten, etwa Ihr Name, Ihre E-Mail-Adresse und der Inhalt Ihrer Nachricht, zur Bearbeitung Ihrer Anfrage verarbeitet.',
            'Diese Daten werden ausschließlich für die Kommunikation im Zusammenhang mit Ihrer Anfrage verwendet.',
          ],
        },
        {
          title: '4. Local Storage und Präferenzen',
          paragraphs: [
            'Diese Website speichert eine Spracheinstellung im Local Storage Ihres Browsers, damit die ausgewählte Sprache beim nächsten Besuch erhalten bleibt.',
            'Wenn Sie den Admin-Bereich nutzen, kann außerdem ein Authentifizierungs-Token im Local Storage gespeichert werden, damit die Sitzung nach dem Login aktiv bleibt.',
          ],
        },
        {
          title: '5. Drittanbieter-Ressourcen',
          paragraphs: [
            'Diese Website lädt derzeit bestimmte Ressourcen von Drittanbietern. Dabei können technische Daten wie Ihre IP-Adresse an diese Anbieter übermittelt werden, wenn Ihr Browser die Dateien anfordert.',
          ],
          items: [
            'Google Fonts über fonts.googleapis.com und fonts.gstatic.com',
            'Icon-Font-Dateien, die über Amazon Web Services bereitgestellt werden',
          ],
        },
        {
          title: '6. Zwecke und Rechtsgrundlagen',
          paragraphs: [
            'Die Datenverarbeitung erfolgt zur Bereitstellung der Website, zur Gewährleistung der Sicherheit, zur Beantwortung von Anfragen, zur Speicherung Ihrer Sprachwahl und zum Betrieb des Admin-Bereichs.',
            'Soweit einschlägig, erfolgt die Verarbeitung auf Grundlage berechtigter Interessen, vorvertraglicher Kommunikation oder einer Einwilligung, sofern diese rechtlich erforderlich ist.',
          ],
        },
        {
          title: '7. Speicherdauer',
          paragraphs: [
            'Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Zweck erforderlich ist oder gesetzliche Pflichten dies verlangen.',
            'Einträge im Local Storage bleiben auf Ihrem Gerät gespeichert, bis Sie diese löschen oder sie ersetzt werden.',
          ],
        },
        {
          title: '8. Ihre Rechte',
          paragraphs: [
            'Je nach anwendbarem Recht haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung oder Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten sowie auf Datenübertragbarkeit.',
            'Darüber hinaus können Sie das Recht haben, sich bei einer zuständigen Aufsichtsbehörde zu beschweren.',
          ],
        },
        {
          title: '9. Sicherheit',
          paragraphs: [
            'Es werden angemessene technische und organisatorische Maßnahmen eingesetzt, um personenbezogene Daten zu schützen. Dennoch kann keine Datenübertragung oder Speicherung im Internet vollständig sicher garantiert werden.',
          ],
        },
        {
          title: '10. Änderungen dieser Datenschutzerklärung',
          paragraphs: [
            'Diese Datenschutzerklärung kann von Zeit zu Zeit aktualisiert werden, um rechtliche, technische oder betriebliche Änderungen abzubilden. Maßgeblich ist die jeweils auf dieser Seite veröffentlichte aktuelle Version.',
          ],
        },
      ],
    },
  };

  constructor(private readonly translate: TranslateService) {}

  ngOnInit(): void {
    this.syncLanguage(this.translate.currentLang || localStorage.getItem('lang') || 'EN');
    this.langSubscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.syncLanguage(event.lang);
    });
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  get content(): PrivacyContent {
    return this.contentByLang[this.currentLang];
  }

  get updatedDate(): string {
    const locale = this.currentLang === 'DE' ? 'de-DE' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  changeLanguage(lang: 'EN' | 'DE'): void {
    localStorage.setItem('lang', lang);
    this.syncLanguage(lang);
  }

  private syncLanguage(lang: string): void {
    const normalized = lang?.toUpperCase() === 'DE' ? 'DE' : 'EN';
    this.currentLang = normalized;
    this.translate.use(normalized);
  }
}
