import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",

  admin: {
    useAsTitle: "alt",
    defaultColumns: [
      "filename",
      "alt",
      "url",
    ],
  },

  access: {
    read: () => true,
  },

  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/*"],

    adminThumbnail: ({ doc }) => {
      if (doc?.url) return doc.url as string;

      const cloudName = "dv5xdsw9a";
      const folder =
        doc?.prefix || "misc";

      return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${doc.filename}`;
    },
  },

  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "prefix",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({
        data,
        req,
        operation,
      }) => {
        if (operation !== "create")
          return data;

        try {
          const referer =
            req?.headers?.referer || "";

          /* Routing Logic */

          if (
            referer.includes(
              "/subjects"
            )
          ) {
            data.prefix = "subjects";
          } else if (
            referer.includes(
              "/lessons"
            )
          ) {
            data.prefix = "lessons";
          } else if (
            referer.includes(
              "/resources"
            )
          ) {
            // Infographs stored with lessons
            data.prefix = "lessons";
          } else {
            data.prefix = "misc";
          }
        } catch (err) {
          console.error(
            "Media prefix assignment failed:",
            err
          );

          data.prefix = "misc";
        }

        return data;
      },
    ],
  },
};
