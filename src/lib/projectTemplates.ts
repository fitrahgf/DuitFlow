export interface ProjectTemplate {
  nameKey: string;
  subcategoryKeys: string[];
}

export const projectTemplates: Record<string, ProjectTemplate> = {
  vacation: {
    nameKey: 'templates.vacation',
    subcategoryKeys: [
      'templates.categories.tickets',
      'templates.categories.accommodation',
      'templates.categories.food',
      'templates.categories.transport',
      'templates.categories.gifts',
      'templates.categories.others'
    ],
  },
  moving: {
    nameKey: 'templates.moving',
    subcategoryKeys: [
      'templates.categories.rent',
      'templates.categories.movingService',
      'templates.categories.furniture',
      'templates.categories.renovation',
      'templates.categories.others'
    ],
  },
  wedding: {
    nameKey: 'templates.wedding',
    subcategoryKeys: [
      'templates.categories.venue',
      'templates.categories.catering',
      'templates.categories.decoration',
      'templates.categories.attire',
      'templates.categories.documentation',
      'templates.categories.invitations',
      'templates.categories.others'
    ],
  },
  custom: {
    nameKey: 'templates.custom',
    subcategoryKeys: ['templates.categories.cat1', 'templates.categories.cat2'],
  },
};
