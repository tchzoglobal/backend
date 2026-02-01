import { CollectionConfig } from 'payload';

const Grades: CollectionConfig = {
  slug: 'grades',
  labels: {
    singular: 'Grade',
    plural: 'Grades',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'board', 'medium'],
  },
  access: {
    read: () => true // Allow reading for now, but restrict via Admin Panel visibility
    
    },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Grade Name',
    },
    {
      name: 'board',
      type: 'relationship',
      relationTo: 'boards',
      required: true,
      label: 'Board',
    },
    {
      name: 'medium',
      type: 'relationship',
      relationTo: 'mediums',
      required: true,
      label: 'Medium',
    },
  ],
};

export default Grades;
