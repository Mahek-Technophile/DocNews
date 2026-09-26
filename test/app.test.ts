import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app, getCommitSha } from '../api.ts';
import { parsePlainTextOrMarkdown } from '../services/documentParser.ts';
import { generateNewsletter } from '../services/newsletterGenerator.ts';

describe('DOCNEWS Integration Tests (CCA 2 Suite)', () => {
  it('1. GET /health returns status "ok" and commit id', async () => {
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    const base = `http://127.0.0.1:${port}`;

    try {
      const res = await fetch(`${base}/health`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.status, 'failed_to_trigger_ci_failure');
      assert.equal(json.service, 'docnews');
      assert.ok(typeof json.commit === 'string');
      assert.ok(json.commit.length > 0);
    } finally {
      server.close();
    }
  });

  it('2. GET /api/newsletters returns an array of newsletters', async () => {
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    const base = `http://127.0.0.1:${port}`;

    try {
      const res = await fetch(`${base}/api/newsletters`);
      assert.equal(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.length >= 1);
      assert.ok(list[0].id);
      assert.ok(list[0].title);
    } finally {
      server.close();
    }
  });

  it('3. POST /api/convert generates a valid newsletter from markdown content', async () => {
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    const base = `http://127.0.0.1:${port}`;

    try {
      const sampleMarkdown = `# Student Council Circular
## Campus Infrastructure Update
The new high-performance cloud laboratory has been commissioned for computer engineering students.
High-speed networking and Linux workstations are now active.

* Lab opens at 8:00 AM daily
* Dedicated access to cloud deployment servers
* Faculty supervision during practical slots

## Upcoming Hackathon
Registrations for the National DevOps Sprint open next Monday. Teams of 3 are encouraged to submit early drafts.`;

      const res = await fetch(`${base}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedText: sampleMarkdown,
          template: 'modern',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.newsletter.title, 'Student Council Circular');
      assert.equal(data.newsletter.template, 'modern');
      assert.ok(data.newsletter.sections.length >= 2);
      assert.ok(data.newsletter.highlights.length >= 2);
    } finally {
      server.close();
    }
  });

  it('4. POST /api/convert rejects empty document input with 400', async () => {
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    const base = `http://127.0.0.1:${port}`;

    try {
      const res = await fetch(`${base}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedText: '   ',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error);
    } finally {
      server.close();
    }
  });

  it('5. Deterministic parser extracts headings, bullets, and reading time correctly', () => {
    const raw = `# Annual Department Report
OVERVIEW:
MIT World Peace University excels in engineering education with progressive curricula.

KEY MILESTONES:
- Successfully migrated CI/CD curricula to GitHub Actions
- Hosted regional DevOps conference
- Established cloud compute cluster`;

    const parsed = parsePlainTextOrMarkdown(raw, 'markdown');
    assert.equal(parsed.title, 'Annual Department Report');
    assert.ok(parsed.sections.length >= 1);
    assert.ok(parsed.bulletPoints.length >= 3);
    assert.ok(parsed.readingTimeMinutes >= 1);

    const newsletter = generateNewsletter(parsed, { template: 'corporate' });
    assert.equal(newsletter.template, 'corporate');
    assert.ok(newsletter.sections[0].heading);
  });
});
