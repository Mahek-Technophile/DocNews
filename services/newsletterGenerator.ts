/**
 * Deterministic Newsletter Generator for DOCNEWS
 * Assembles extracted document components into a styled newsletter structure.
 */

import { ParsedDocument } from './documentParser.ts';

export type NewsletterTemplate = 'modern' | 'corporate' | 'campus' | 'minimal';

export interface NewsletterArticleSection {
  id: string;
  heading: string;
  content: string;
  tag?: string;
}

export interface NewsletterModel {
  id: string;
  title: string;
  subtitle: string;
  issueNumber: string;
  template: NewsletterTemplate;
  publishDate: string;
  sourceDocName: string;
  highlights: string[];
  sections: NewsletterArticleSection[];
  footerNote: string;
  stats: {
    wordCount: number;
    estimatedReadTime: string;
    sectionCount: number;
  };
  createdAt: string;
}

export interface GenerateOptions {
  template?: NewsletterTemplate;
  sourceDocName?: string;
  issueNumber?: string;
}

export function generateNewsletter(
  parsed: ParsedDocument,
  options: GenerateOptions = {}
): NewsletterModel {
  const template: NewsletterTemplate = options.template || 'campus';
  const sourceDocName = options.sourceDocName || 'Direct Input';
  const issueNumber = options.issueNumber || `Vol. ${new Date().getFullYear()} - Iss. 01`;

  const sections: NewsletterArticleSection[] = parsed.sections.map((sec, idx) => ({
    id: `sec-${idx + 1}`,
    heading: sec.heading,
    content: sec.paragraphs.join('\n\n'),
    tag: idx === 0 ? 'Lead Story' : `Section 0${idx + 1}`,
  }));

  const highlights = parsed.bulletPoints.length > 0
    ? parsed.bulletPoints
    : [
        'Curated campus insights derived directly from document source.',
        'Structured automated digests ready for email circulars or noticeboards.',
      ];

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    id: `nl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: parsed.title || 'Campus Newsletter Digest',
    subtitle: `Synthesized from ${sourceDocName} • Comprehensive edition`,
    issueNumber,
    template,
    publishDate: formattedDate,
    sourceDocName,
    highlights,
    sections,
    footerNote: `Published via DOCNEWS • Department of Computer Engineering and Technology • MIT-WPU`,
    stats: {
      wordCount: parsed.wordCount,
      estimatedReadTime: `${parsed.readingTimeMinutes} min read`,
      sectionCount: sections.length,
    },
    createdAt: now.toISOString(),
  };
}
