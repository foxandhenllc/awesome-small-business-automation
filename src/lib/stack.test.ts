import { describe, expect, it } from 'vitest';
import { resources } from '../data/resources';
import { buildStackPlan, createShortlistMarkdown, filterResources } from './stack';

describe('automation resource helpers', () => {
  it('filters resources by search text, category, cost, setup, and persona', () => {
    const results = filterResources(resources, {
      query: 'intake',
      category: 'Lead capture',
      cost: 'Free plan',
      setup: 'No-code',
      persona: 'Local service',
    });

    expect(results.map((resource) => resource.name)).toContain('Tally');
    expect(results.every((resource) => resource.category === 'Lead capture')).toBe(true);
    expect(results.every((resource) => resource.cost === 'Free plan')).toBe(true);
  });

  it('creates a grouped markdown shortlist with links and implementation notes', () => {
    const shortlist = resources.filter((resource) =>
      ['tally', 'cal-com', 'stripe-payment-links'].includes(resource.id)
    );

    const markdown = createShortlistMarkdown(shortlist, '2026-05-20');

    expect(markdown).toContain('# Small Business Automation Shortlist');
    expect(markdown).toContain('Generated: 2026-05-20');
    expect(markdown).toContain('## Lead capture');
    expect(markdown).toContain('- [Tally](https://tally.so)');
    expect(markdown).toContain('Implementation notes');
  });

  it('summarizes stack coverage and missing essentials from a shortlist', () => {
    const shortlist = resources.filter((resource) =>
      ['tally', 'cal-com', 'hubspot-crm'].includes(resource.id)
    );

    const plan = buildStackPlan(shortlist);

    expect(plan.coveredCategories).toEqual(['Booking', 'CRM', 'Lead capture']);
    expect(plan.missingEssentials).toContain('Invoices and payments');
    expect(plan.nextSteps[0]).toMatch(/Choose an owner/i);
  });
});
