import express from 'express';
import multer from 'multer';
import { parsePlainTextOrMarkdown, parseDocxBuffer } from './services/documentParser.ts';
import { generateNewsletter, NewsletterTemplate } from './services/newsletterGenerator.ts';
import { newsletterStore } from './services/newsletterStore.ts';

export const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer memory storage for direct buffer extraction without disk clutter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.originalname.endsWith('.docx');
    const isMarkdown = file.originalname.endsWith('.md') || file.mimetype === 'text/markdown';
    const isText = file.mimetype === 'text/plain' || file.originalname.endsWith('.txt');

    if (isDocx || isMarkdown || isText) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported format. Please upload a .docx, .md, or .txt document.'));
    }
  },
});

// Commit ID handling as required by CCA 2 specification
export function getCommitSha(): string {
  const sha = process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || 'local';
  return sha.slice(0, 7);
}

// 1. Health Route: Required for Docker smoke test and Render health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'docnews',
    commit: getCommitSha(),
    timestamp: new Date().toISOString(),
  });
});

// 2. JSON API Routes
app.get('/api/newsletters', (_req, res) => {
  const newsletters = newsletterStore.getAll();
  res.status(200).json(newsletters);
});

app.get('/api/newsletters/:id', (req, res) => {
  const nl = newsletterStore.getById(req.params.id);
  if (!nl) {
    return res.status(404).json({ error: 'Newsletter not found' });
  }
  return res.status(200).json(nl);
});

app.delete('/api/newsletters/:id', (req, res) => {
  const success = newsletterStore.delete(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Newsletter not found' });
  }
  return res.status(200).json({ message: 'Newsletter deleted successfully', id: req.params.id });
});

// 3. Document Processing Endpoint
app.post('/api/convert', upload.single('documentFile'), async (req, res) => {
  try {
    const template: NewsletterTemplate = (req.body.template as NewsletterTemplate) || 'campus';
    const pastedText = req.body.pastedText ? String(req.body.pastedText).trim() : '';

    let parsed;
    let sourceName = 'Pasted Text';

    if (req.file) {
      sourceName = req.file.originalname;
      if (req.file.originalname.endsWith('.docx')) {
        parsed = await parseDocxBuffer(req.file.buffer);
      } else {
        const textContent = req.file.buffer.toString('utf-8');
        parsed = parsePlainTextOrMarkdown(textContent, req.file.originalname.endsWith('.md') ? 'markdown' : 'text');
      }
    } else if (pastedText) {
      parsed = parsePlainTextOrMarkdown(pastedText, 'text');
    } else {
      return res.status(400).json({ error: 'Please upload a document (.docx / .md) or paste document text.' });
    }

    if (!parsed.sections || parsed.sections.length === 0 || (parsed.wordCount === 0 && !parsed.title)) {
      return res.status(400).json({ error: 'The submitted document contained no readable content or paragraphs.' });
    }

    const newsletter = generateNewsletter(parsed, {
      template,
      sourceDocName: sourceName,
    });

    // Save newly generated draft to store
    newsletterStore.save(newsletter);

    return res.status(201).json({
      success: true,
      newsletter,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to parse document';
    return res.status(400).json({ error: errorMsg });
  }
});

// 4. Update / Save Edited Newsletter
app.put('/api/newsletters/:id', (req, res) => {
  const { title, subtitle, template, highlights, sections, footerNote } = req.body;
  if (!title || !sections || !Array.isArray(sections)) {
    return res.status(400).json({ error: 'Invalid newsletter data. Title and sections are required.' });
  }

  const updated = newsletterStore.update(req.params.id, {
    title,
    subtitle,
    template,
    highlights: Array.isArray(highlights) ? highlights : [],
    sections,
    footerNote,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Newsletter not found' });
  }

  return res.status(200).json({ success: true, newsletter: updated });
});

// Export helper for pure HTML download
app.get('/api/newsletters/:id/export-html', (req, res) => {
  const nl = newsletterStore.getById(req.params.id);
  if (!nl) {
    return res.status(404).send('Newsletter not found');
  }

  const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${nl.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 48px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #1d4ed8; font-weight: 600; font-size: 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 32px; font-weight: 800; line-height: 1.2; margin: 0 0 8px; color: #0f172a; }
    .subtitle { font-size: 16px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
    .meta { font-size: 13px; color: #94a3b8; display: flex; justify-content: space-between; margin-bottom: 24px; }
    .highlights-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 24px; border-radius: 6px; margin-bottom: 36px; }
    .highlights-box h3 { margin: 0 0 10px; font-size: 16px; color: #166534; font-weight: 700; }
    .highlights-box ul { margin: 0; padding-left: 20px; }
    .highlights-box li { margin-bottom: 6px; color: #14532d; }
    .section-block { margin-bottom: 32px; }
    .section-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
    h2 { font-size: 20px; font-weight: 700; margin: 4px 0 12px; color: #1e293b; }
    p { margin: 0 0 16px; color: #334155; white-space: pre-line; }
    footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">${nl.template.toUpperCase()} THEME • ${nl.issueNumber}</span>
    <h1>${nl.title}</h1>
    <div class="subtitle">${nl.subtitle}</div>
    <div class="meta">
      <span>Published: ${nl.publishDate}</span>
      <span>Source: ${nl.sourceDocName}</span>
      <span>Read time: ${nl.stats.estimatedReadTime}</span>
    </div>

    ${nl.highlights.length > 0 ? `
    <div class="highlights-box">
      <h3>Key Bullet Highlights</h3>
      <ul>
        ${nl.highlights.map((h) => `<li>${h}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${nl.sections.map((s) => `
    <div class="section-block">
      <div class="section-tag">${s.tag || 'Story'}</div>
      <h2>${s.heading}</h2>
      <p>${s.content}</p>
    </div>`).join('')}

    <footer>
      ${nl.footerNote}
      <br>Generated by DOCNEWS Engine • Commit ${getCommitSha()}
    </footer>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="docnews-${nl.id}.html"`);
  res.send(htmlOutput);
});
