/**
 * Document Parser Service for DOCNEWS
 * Extracts plain text, structural headers, and paragraphs from:
 * 1. Plain text / Pasted input
 * 2. Markdown (.md)
 * 3. Microsoft Word (.docx) via Mammoth
 */

import mammoth from 'mammoth';

export interface ParsedDocument {
  title: string;
  sourceType: 'text' | 'markdown' | 'docx';
  rawText: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  bulletPoints: string[];
  wordCount: number;
  readingTimeMinutes: number;
}

/**
 * Clean up text line
 */
function cleanLine(line: string): string {
  return line.replace(/\r/g, '').trim();
}

/**
 * Core deterministic extraction logic for text / markdown
 */
export function parsePlainTextOrMarkdown(
  rawContent: string, 
  sourceType: 'text' | 'markdown' | 'docx' = 'text'
): ParsedDocument {
  const lines = rawContent.split('\n').map(cleanLine);
  const nonEmptyLines = lines.filter((l) => l.length > 0);

  const wordCount = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  let derivedTitle = 'Campus Dispatch & Updates';
  const bulletPoints: string[] = [];
  const sections: Array<{ heading: string; paragraphs: string[] }> = [];

  let currentHeading = 'Executive Summary';
  let currentParagraphs: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    // Check for title in markdown: # Title or first substantial line
    if (line.startsWith('# ') && derivedTitle === 'Campus Dispatch & Updates') {
      derivedTitle = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Markdown H2 or H3
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentParagraphs.length > 0) {
        sections.push({ heading: currentHeading, paragraphs: [...currentParagraphs] });
        currentParagraphs = [];
      }
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
      continue;
    }

    // Check for bullet list item: -, *, or number.
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const cleanBullet = line.replace(/^[-*•\d.]+\s+/, '').trim();
      if (cleanBullet.length > 3) {
        bulletPoints.push(cleanBullet);
      }
      continue;
    }

    // Detect heading if all uppercase or ends with colon or short capitalized line
    const isUppercaseHeading = line.length < 60 && line === line.toUpperCase() && /[A-Z]/.test(line);
    const isColonHeading = line.length < 50 && line.endsWith(':') && !line.includes('.');

    if (isUppercaseHeading || isColonHeading) {
      if (currentParagraphs.length > 0) {
        sections.push({ heading: currentHeading, paragraphs: [...currentParagraphs] });
        currentParagraphs = [];
      }
      currentHeading = line.replace(/:$/, '').trim();
      continue;
    }

    // If we haven't found a title yet and this is the very first line of a plain document
    if (derivedTitle === 'Campus Dispatch & Updates' && sections.length === 0 && currentParagraphs.length === 0 && line.length < 80) {
      derivedTitle = line;
      continue;
    }

    // Regular paragraph
    currentParagraphs.push(line);
  }

  // Push remaining buffer
  if (currentParagraphs.length > 0) {
    sections.push({ heading: currentHeading, paragraphs: [...currentParagraphs] });
  }

  // If no sections formed, group paragraphs together
  if (sections.length === 0 && nonEmptyLines.length > 0) {
    sections.push({
      heading: 'Main Overview',
      paragraphs: nonEmptyLines.slice(0, 5),
    });
  }

  // Extract key bullet points if none found
  if (bulletPoints.length === 0) {
    for (const sec of sections) {
      for (const p of sec.paragraphs) {
        const sentences = p.split(/(?<=[.!?])\s+/);
        for (const s of sentences) {
          if (s.length > 25 && s.length < 140 && bulletPoints.length < 4) {
            bulletPoints.push(s.trim());
          }
        }
      }
    }
  }

  return {
    title: derivedTitle,
    sourceType,
    rawText: rawContent,
    sections,
    bulletPoints: bulletPoints.slice(0, 5),
    wordCount,
    readingTimeMinutes,
  };
}

/**
 * Parse a Word docx buffer using Mammoth
 */
export async function parseDocxBuffer(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value || '';
  const parsed = parsePlainTextOrMarkdown(rawText, 'docx');
  return parsed;
}
