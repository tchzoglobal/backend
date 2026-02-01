import { CollectionConfig } from 'payload';

const Mediums: CollectionConfig = {
  slug: 'mediums',
  labels: { singular: 'Medium', plural: 'Mediums' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description'],
  },
  access: {
    read: () => true // Allow reading for now, but restrict via Admin Panel visibility
    
    },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
};

export default Mediums;
