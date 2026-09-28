import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FAQItemData {
  title: string;
  description: string;
  points?: string[];
}

export const FAQ_DATA: FAQItemData[] = [
  {
    title: 'What is the Theme Project?',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    title: 'Who can register on the Theme Project?',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    title: 'How can an Ex-Agniveer update personal information on the portal?',
    description:
      'Ex-Agniveers, after login can update some basic details by using their Service Number, registered mobile number and other authentication credentials provided by the concerned Service Headquarters. Following verification, users can update address, qualifications, certifications etc.',
  },
  {
    title: 'What services are available through the portal?',
    description: 'The portal provides several services, including:',
    points: [
      'Employment opportunities in CAPFs and Assam Rifles.',
      'State and Central Government recruitment notifications.',
      'Skill mapping and career counselling.',
      'Access to training, reskilling and certification programs.',
      'Job opportunities in private sector organizations registered under PSARA.',
      'Document repository and verification services.',
      'Notifications regarding reserved vacancies and special recruitment drives.',
    ],
  },
  {
    title: 'How will employers benefit from the portal?',
    description:
      'Employers can access a verified pool of disciplined, trained and skilled Ex-Agniveers. The portal allows employers to post vacancies, search candidate profiles based on qualifications and skills, conduct recruitment drives and communicate directly with eligible candidates while ensuring data security and transparency.',
  },
  {
    title: 'Can Ex-Agniveers apply for vacancies in CAPFs and Assam Rifles through the portal?',
    description:
      'Yes. Eligible vacancies notified by CAPFs and Assam Rifles will be published on the portal. Ex-Agniveers may view eligibility criteria, submit applications through integrated recruitment systems where available and track the status of their applications.',
  },
  {
    title: 'Will the portal provide information about reservations or relaxations available to Ex-Agniveers?',
    description:
      'Yes. The portal will display updated information regarding age relaxations, reservation benefits, priority categories and other policy provisions announced by the MoD, MHA, State Governments, CAPFs, Assam Rifles and other participating organizations.',
  },
  {
    title: 'What kind of skill and certification information will be available on the portal?',
    description:
      'The portal will maintain a digital record of training received during service, military-acquired skills, educational qualifications and certifications earned by Agniveers. It may also recommend suitable upskilling courses and certification programs aligned with industry requirements and career aspirations.',
  },
  {
    title: 'How will personal information and service records be protected?',
    description:
      'The portal will implement robust security measures, including role-based access controls, encryption, secure authentication mechanisms and strict compliance with applicable Government data protection and cybersecurity guidelines. Personal information will only be shared with authorized agencies and employers based on approved user consent and access policies.',
  },
  {
    title: 'Whom should I contact if I face issues while using the portal?',
    description:
      'Users can access the Helpdesk section available on the portal for technical assistance, account-related queries and grievance redressal. Support may be provided through email, telephone helplines, ticket-based support systems and designated nodal officers from the concerned Ministries, Services, CAPFs, or State/UT Governments.',
  },
  {
    title: 'Will the portal continue to support Ex-Agniveers after they secure employment?',
    description:
      'Yes. Subject to policy provisions, the portal will provide continued access to career development resources, advanced training opportunities and notifications of higher employment opportunities to support long-term career progression and successful reintegration into civilian life.',
  },
];

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class FaqComponent {
  readonly openFaqIndex = signal<number | null>(0);
  readonly faqList = signal<FAQItemData[]>(FAQ_DATA);

  toggleFaq(index: number): void {
    this.openFaqIndex.update((cur) => (cur === index ? null : index));
  }
}
