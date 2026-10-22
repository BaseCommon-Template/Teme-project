import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FAQItemData {
  title: string;
  description: string;
  points?: string[];
}

export const FAQ_DATA: FAQItemData[] = [
  {
    title: 'What is this portal?',
    description:
      'This is a demo portal designed to provide users with easy access to information, services and important updates.',
  },
  {
    title: 'Who can use this portal?',
    description:
      'The portal can be used by registered users who have valid login credentials and access permissions.',
  },
  {
    title: 'How can I create an account?',
    description:
      'Click on the registration option, enter the required details and complete the verification process to create your account.',
  },
  {
    title: 'How can I update my profile?',
    description:
      'After logging in, open the profile section and select the edit option to update your personal information.',
  },
  {
    title: 'How can I search for available opportunities?',
    description:
      'Users can use the search and filter options available on the portal to find opportunities based on their preferences.',
  },
  {
    title: 'Can I apply for an opportunity through the portal?',
    description:
      'Yes, eligible users can view available opportunities and submit their applications through the portal.',
  },
  {
    title: 'How can I check my application status?',
    description:
      'Go to the application section of your dashboard to view the current status and details of your submitted applications.',
  },
  {
    title: 'What should I do if I forget my password?',
    description:
      'Use the Forgot Password option available on the login page and follow the instructions to reset your password.',
  },
  {
    title: 'How can I contact the support team?',
    description:
      'You can contact the support team through the Helpdesk section for assistance with account, application or technical issues.',
  },
  {
    title: 'Is my information secure?',
    description:
      'The portal uses appropriate security mechanisms to protect user information and restrict access to authorized users.',
  },
  {
    title: 'What documents can I upload?',
    description:
      'Depending on the service or application, users may be required to upload identification, qualification and other supporting documents.',
  },
  {
    title: 'Can I update my submitted information?',
    description:
      'Some information can be updated after submission, depending on the application status and permissions available to the user.',
  },
  {
    title: 'How can I view notifications?',
    description:
      'All important announcements and updates can be viewed from the Notifications section available in the user dashboard.',
  },
  {
    title: 'Can I use the portal on a mobile device?',
    description:
      'Yes, the portal is designed to provide a responsive experience across desktops, tablets and mobile devices.',
  },
  {
    title: 'What should I do if a page is not loading?',
    description:
      'Please check your internet connection, refresh the page and try again. If the issue continues, contact the support team.',
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
