/**
 * In-memory / Persistent Storage for DOCNEWS
 * Stores newsletters, handles queries, updates, and deletes.
 */

import { NewsletterModel } from './newsletterGenerator.ts';

// Default initial newsletter for immediate demonstration
const defaultInitialNewsletters: NewsletterModel[] = [
  {
    id: 'nl_demo_mitwpu_01',
    title: 'MIT-WPU Tech Digest: Cloud & DevOps Edition',
    subtitle: 'Synthesized from Cloud & DevOps Circular • Department Briefing',
    issueNumber: 'Vol. 2026 - Iss. 04',
    template: 'campus',
    publishDate: 'Sep 26, 2026',
    sourceDocName: 'syllabus_brief.md',
    highlights: [
      'CCA 2 assessment criteria focused on practical CI/CD and Containerisation.',
      'Docker images must adhere to non-root execution and health-check monitoring.',
      'Deployment on Render triggered automatically via verified GitHub Actions workflow.',
    ],
    sections: [
      {
        id: 'sec-1',
        heading: 'Executive Overview of DevOps Lab Workflows',
        content:
          'The Cloud Computing and DevOps curriculum (CSE30040) emphasizes real-world deployment pipelines over purely theoretical testing. Students are expected to package dynamic web applications into reproducible Docker containers and deploy automatically upon passing comprehensive quality gates.',
        tag: 'Lead Story',
      },
      {
        id: 'sec-2',
        heading: 'Continuous Integration Guarantees Quality',
        content:
          'Continuous Integration ensures every code commit undergoes automated linting and unit testing prior to any build phase. This prevents regression errors from leaking to production environments and ensures reproducible release standards.',
        tag: 'DevOps Track',
      },
      {
        id: 'sec-3',
        heading: 'Containerisation with Docker Alpine',
        content:
          'By leveraging lightweight Alpine Linux images and non-root execution practices, student applications achieve faster cold-start times and enhanced runtime security across distributed cloud platforms.',
        tag: 'Architecture',
      },
    ],
    footerNote: 'Published via DOCNEWS • Department of Computer Engineering and Technology • MIT-WPU',
    stats: {
      wordCount: 380,
      estimatedReadTime: '2 min read',
      sectionCount: 3,
    },
    createdAt: new Date().toISOString(),
  },
];

class NewsletterStore {
  private newsletters: Map<string, NewsletterModel> = new Map();

  constructor() {
    for (const nl of defaultInitialNewsletters) {
      this.newsletters.set(nl.id, nl);
    }
  }

  getAll(): NewsletterModel[] {
    return Array.from(this.newsletters.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getById(id: string): NewsletterModel | undefined {
    return this.newsletters.get(id);
  }

  save(newsletter: NewsletterModel): NewsletterModel {
    this.newsletters.set(newsletter.id, newsletter);
    return newsletter;
  }

  update(id: string, updates: Partial<NewsletterModel>): NewsletterModel | undefined {
    const existing = this.newsletters.get(id);
    if (!existing) return undefined;

    const updated: NewsletterModel = {
      ...existing,
      ...updates,
      id: existing.id, // prevent id overwrite
    };
    this.newsletters.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.newsletters.delete(id);
  }

  count(): number {
    return this.newsletters.size;
  }
}

export const newsletterStore = new NewsletterStore();
