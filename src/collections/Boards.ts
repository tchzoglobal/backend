import { CollectionConfig } from 'payload/types';

const Boards: CollectionConfig = {
  slug: 'boards',
  labels: { singular: 'Board', plural: 'Boards' },
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

export default Boards;
