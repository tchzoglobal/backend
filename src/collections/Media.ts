import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",

  admin: {
    useAsTitle: "alt",

    // Helpful in admin list view
    defaultColumns: ["filename", "alt", "url"],
  },

  access: {
    read: () => true,
  },

  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/*"],

    /* -------------------------------------------------
       Cloudinary Folder Routing (IMPORTANT)
       Uses `prefix` saved on doc OR falls back
    -------------------------------------------------- */
    // NOTE:
    // Your Cloudinary adapter must store folder in `prefix`
    // If not, set it in adapter config instead.

    /* -------------------------------------------------
       Admin Thumbnail Preview
    -------------------------------------------------- */
    adminThumbnail: ({ doc }) => {
      // ✅ New uploads (URL already saved)
      if (doc?.url) return doc.url as string;

      // ⚠️ Fallback for legacy DB records
      const cloudName = "dv5xdsw9a";

      // Folder priority:
      // 1. Stored prefix
      // 2. Resource infographs → lessons
      // 3. Default → subjects
      const folder =
        doc?.prefix ||
        doc?.folder ||
        "subjects";

      return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${doc.filename}`;
    },
  },

  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },

    /* -------------------------------------------------
       Folder / Prefix Tracker (for routing + fallback)
    -------------------------------------------------- */
    {
      name: "prefix",
      type: "text",
      admin: {
        readOnly: true,
        description:
          "Cloudinary folder prefix (auto-assigned)",
      },
    },
  ],

  /* -------------------------------------------------
     Auto-assign Cloudinary folder by collection usage
  -------------------------------------------------- */
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        try {
          // Detect which collection is uploading
          const referrer =
            req.headers.get("referer") || "";

          if (referrer.includes("subjects")) {
            data.prefix = "subjects";
          } else if (referrer.includes("lessons")) {
            data.prefix = "lessons";
          } else if (referrer.includes("resources")) {
            // ✅ Your requirement:
            // Infographs → lessons folder
            data.prefix = "lessons";
          } else {
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
