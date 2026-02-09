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

      const cloudName =
        process.env.CLOUDINARY_CLOUD_NAME;

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
    /* ---------- PREFIX ROUTING ---------- */
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
            data.prefix = "misc";
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

    /* ---------- URL NORMALIZER ---------- */
    afterRead: [
      async ({ doc }) => {
        if (!doc) return doc;

        const cloudName =
          process.env.CLOUDINARY_CLOUD_NAME;

        const folder =
          doc.prefix || "misc";

        if (doc.filename) {
          doc.url = `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${doc.filename}`;
        }

        return doc;
      },
    ],
  },
};
