import type { AutomationResource, CostLevel, Persona, ResourceCategory, SetupLevel } from '../data/resources';

export interface ResourceFilters {
  query?: string;
  category?: ResourceCategory | 'All';
  cost?: CostLevel | 'All';
  setup?: SetupLevel | 'All';
  persona?: Persona | 'All';
}

export interface StackPlan {
  coveredCategories: ResourceCategory[];
  missingEssentials: ResourceCategory[];
  nextSteps: string[];
}

const essentialCategories: ResourceCategory[] = [
  'Lead capture',
  'Booking',
  'CRM',
  'Invoices and payments',
  'Dashboards',
  'Website QA',
];

export function filterResources(
  resources: AutomationResource[],
  filters: ResourceFilters
): AutomationResource[] {
  const query = filters.query?.trim().toLowerCase() ?? '';

  return resources
    .filter((resource) => {
      const searchableText = [
        resource.name,
        resource.category,
        resource.summary,
        resource.cost,
        resource.setup,
        resource.friction,
        resource.bestStackRole,
        ...resource.personas,
        ...resource.tags,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = query.length === 0 || searchableText.includes(query);
      const matchesCategory =
        !filters.category || filters.category === 'All' || resource.category === filters.category;
      const matchesCost = !filters.cost || filters.cost === 'All' || resource.cost === filters.cost;
      const matchesSetup =
        !filters.setup || filters.setup === 'All' || resource.setup === filters.setup;
      const matchesPersona =
        !filters.persona || filters.persona === 'All' || resource.personas.includes(filters.persona);

      return matchesQuery && matchesCategory && matchesCost && matchesSetup && matchesPersona;
    })
    .sort((first, second) =>
      first.category === second.category
        ? first.name.localeCompare(second.name)
        : first.category.localeCompare(second.category)
    );
}

export function buildStackPlan(shortlist: AutomationResource[]): StackPlan {
  const coveredCategories = Array.from(new Set(shortlist.map((resource) => resource.category))).sort(
    (first, second) => first.localeCompare(second)
  );
  const missingEssentials = essentialCategories.filter(
    (category) => !coveredCategories.includes(category)
  );
  const hasPaidTool = shortlist.some((resource) => resource.cost === 'Paid');
  const hasDeveloperTool = shortlist.some((resource) => resource.setup === 'Developer');

  return {
    coveredCategories,
    missingEssentials,
    nextSteps: [
      'Choose an owner for every shortlisted tool before connecting accounts.',
      missingEssentials.length > 0
        ? `Fill the missing essentials next: ${missingEssentials.join(', ')}.`
        : 'Map the handoff between intake, follow-up, payment, reporting, and QA.',
      hasPaidTool
        ? 'Confirm paid plan limits, billing owner, and cancellation path.'
        : 'Keep the first pass on free or open-source tiers until the workflow is proven.',
      hasDeveloperTool
        ? 'Document hosting, maintenance, and credential ownership for developer-run tools.'
        : 'Capture screenshots and SOP notes so the no-code stack is teachable.',
    ],
  };
}

export function createShortlistMarkdown(
  shortlist: AutomationResource[],
  generatedAt = new Date().toISOString().slice(0, 10)
): string {
  const stackPlan = buildStackPlan(shortlist);
  const groupedResources = shortlist.reduce<Record<string, AutomationResource[]>>((groups, resource) => {
    groups[resource.category] = groups[resource.category] ?? [];
    groups[resource.category].push(resource);
    return groups;
  }, {});

  const resourceSections = Object.entries(groupedResources)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([category, resources]) => {
      const lines = resources
        .sort((first, second) => first.name.localeCompare(second.name))
        .map(
          (resource) =>
            `- [${resource.name}](${resource.url}) — ${resource.summary} (${resource.cost}, ${resource.setup}). Role: ${resource.bestStackRole}`
        );

      return `## ${category}\n\n${lines.join('\n')}`;
    })
    .join('\n\n');

  const missingLine =
    stackPlan.missingEssentials.length > 0
      ? stackPlan.missingEssentials.join(', ')
      : 'No essential categories missing.';

  return [
    '# Small Business Automation Shortlist',
    '',
    `Generated: ${generatedAt}`,
    '',
    shortlist.length === 0
      ? 'No resources selected yet.'
      : resourceSections,
    '',
    '## Implementation notes',
    '',
    `Covered categories: ${stackPlan.coveredCategories.join(', ') || 'None yet'}.`,
    `Missing essentials: ${missingLine}.`,
    '',
    stackPlan.nextSteps.map((step) => `- ${step}`).join('\n'),
  ].join('\n');
}

export function parseSavedShortlist(rawValue: string | null, validIds: Set<string>): string[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
}
