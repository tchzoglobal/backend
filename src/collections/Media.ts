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
      const folder = doc?.prefix || "misc";

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
          /* ---------------------------------------
             Detect upload origin
          ---------------------------------------- */
          const referer = req?.headers?.referer || "";

          /* ---- Routing Rules ---- */

          if (referer.includes("/subjects")) {
            data.prefix = "subjects";
          }

          else if (referer.includes("/lessons")) {
            data.prefix = "lessons";
          }

          else if (referer.includes("/resources")) {
            // Infographs live with lessons
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

          data.prefix = "misc";
        }

        return data;
      },
    ],
  },
};