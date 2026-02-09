import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",

  admin: {
    useAsTitle: "alt",
    defaultColumns: ["filename", "alt", "url"],
  },

  access: {
    read: () => true,
  },

  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/*"],

    /* ---------------------------------------------
       Admin Thumbnail Preview
    ---------------------------------------------- */
    adminThumbnail: ({ doc }) => {
      if (doc?.url) return doc.url as string;

      const cloudName = "dv5xdsw9a";
      const folder =
        doc?.prefix || "subjects";

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

  /* ---------------------------------------------
     Folder Assignment Logic
  ---------------------------------------------- */
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== "create") return data;

        try {
          /**
           * Payload passes collection context
           * via query params in admin uploads
           */
          const resource =
            req?.query?.collection ||
            req?.body?.collection ||
            "";

          /* ---- Routing ---- */

          if (resource === "subjects") {
            data.prefix = "subjects";
          }

          else if (resource === "lessons") {
            data.prefix = "lessons";
          }

          else if (resource === "resources") {
            // ✅ Infographs go to lessons folder
            data.prefix = "lessons";
          }

          else {
            data.prefix = "misc";
          }

        } catch (err) {
          console.error(
            "❌ Media prefix assignment failed:",
            err
          );
        }

        return data;
      },
    ],
  },
};