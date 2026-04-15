import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('Health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('Get answer', async ({ request }) => {
    const response = await request.post('/api/answer', {
      data: { question: 'Will this test pass?' }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('answer');
    expect(data).toHaveProperty('entryId');
    expect(typeof data.answer).toBe('string');
    expect(typeof data.entryId).toBe('number');
  });

  test('Get answer with empty question', async ({ request }) => {
    const response = await request.post('/api/answer', {
      data: { question: '' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'A valid question is required.');
  });

  test('Get answer with whitespace question', async ({ request }) => {
    const response = await request.post('/api/answer', {
      data: { question: '   ' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'A valid question is required.');
  });

  test('Submit email with valid data', async ({ request }) => {
    // First get an answer
    const answerResponse = await request.post('/api/answer', {
      data: { question: 'Test question for email?' }
    });
    const answerData = await answerResponse.json();
    const entryId = answerData.entryId;

    const emailResponse = await request.post('/api/submit', {
      data: { entryId, email: 'test@example.com' }
    });
    expect(emailResponse.ok()).toBeTruthy();
    const emailData = await emailResponse.json();
    expect(emailData).toHaveProperty('message', 'Answer emailed successfully.');
  });

  test('Submit email with invalid email', async ({ request }) => {
    const response = await request.post('/api/submit', {
      data: { entryId: 1, email: 'invalid-email' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Invalid email address format.');
  });

  test('Submit email without entryId', async ({ request }) => {
    const response = await request.post('/api/submit', {
      data: { email: 'test@example.com' }
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'A valid entry id is required.');
  });

  test('Get recent history', async ({ request }) => {
    const response = await request.get('/api/history/recent');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('history');
    expect(Array.isArray(data.history)).toBeTruthy();
  });

  test('Get full history', async ({ request }) => {
    const response = await request.get('/api/history/all');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('history');
    expect(Array.isArray(data.history)).toBeTruthy();
  });

  test('Delete history entry', async ({ request }) => {
    // First get an answer to have an entry
    const answerResponse = await request.post('/api/answer', {
      data: { question: 'Question to delete?' }
    });
    const answerData = await answerResponse.json();
    const entryId = answerData.entryId;

    const deleteResponse = await request.delete(`/api/history/${entryId}`);
    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData).toHaveProperty('success', true);
  });
});

test.describe('UI Tests', () => {
  test('Page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Random Decision Maker/);
    await expect(page.locator('h1')).toContainText('Magic Crystal Ball');
  });

  test('Ask a question and get an answer', async ({ page }) => {
    await page.goto('/');
    await page.fill('#question', 'Will I have a great day?');
    await page.click('button:has-text("Get a Decision")');
    await expect(page.locator('.relative.z-10')).toContainText(/yes|no|it is|definitely|don't|my sources/);
  });

  test('Email submission', async ({ page }) => {
    await page.goto('/');
    await page.fill('#question', 'Should I send an email?');
    await page.click('button:has-text("Get a Decision")');
    await page.waitForSelector('#email');
    await page.fill('#email', 'test@example.com');
    await page.click('button:has-text("Send Email")');
    await expect(page.locator('.text-emerald-200')).toContainText('Email sent successfully');
  });

  test('Invalid email shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#question', 'Test invalid email?');
    await page.click('button:has-text("Get a Decision")');
    await page.fill('#email', 'invalid');
    await page.click('button:has-text("Send Email")');
    await expect(page.locator('.text-red-300')).toContainText('Please provide a valid email address');
  });

  test('Recent history displays', async ({ page }) => {
    // Ask a question first
    await page.goto('/');
    await page.fill('#question', 'History test question?');
    await page.click('button:has-text("Get a Decision")');
    await page.waitForTimeout(1000); // Wait for answer
    await page.reload(); // Reload to check history
    await expect(page.locator('h3:has-text("Recent Answers")')).toBeVisible();
  });

  test('Full history modal', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("View full history")');
    await expect(page.locator('h2:has-text("Full Answer History")')).toBeVisible();
    await page.click('button:has-text("✕")');
    await expect(page.locator('h2:has-text("Full Answer History")')).not.toBeVisible();
  });

  test('Delete history entry', async ({ page }) => {
    await page.goto('/');
    await page.fill('#question', 'Delete me?');
    await page.click('button:has-text("Get a Decision")');
    await page.click('button:has-text("View full history")');
    await page.click('button:has-text("Remove")');
    await expect(page.locator('text=Delete me?')).not.toBeVisible();
  });
});
