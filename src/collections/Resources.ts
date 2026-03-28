import type { CollectionConfig, Where } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

/* ---------------- SLUG GENERATOR ---------------- */
const generateSlug = ({ data }: any) => {
  if (!data) return data;

  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  return data;
};

/* -----------------------------------------------------------
   Extract Plain Text from Lexical (for TTS + SEO)
------------------------------------------------------------ */
const extractPlainText = (node: any): string => {
  if (!node) return "";

  if (node.type === "text") {
    return node.text || "";
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractPlainText).join(" ");
  }

  return "";
};

/* -----------------------------------------------------------
   Convert Lexical → Hierarchical Mindmap JSON
------------------------------------------------------------ */
const convertNodesToMindmap = (rootChildren: any[]) => {
  if (!Array.isArray(rootChildren)) return [];

  const result: any[] = [];
  const stack: any[] = [];

  const extractListItemText = (children: any[]) => {
    let text = "";
    for (const child of children) {
      if (child.type === "text") text += child.text + " ";
      if (child.type === "paragraph" && child.children) {
        text += extractListItemText(child.children);
      }
      if (child.type === "list") continue;
    }
    return text.trim();
  };

  const processListItem = (node: any) => {
    if (node.type !== "listitem") return;

    const level = (node.indent || 0) + 1;
    const text = extractListItemText(node.children);
    if (!text) return;

    const newNode = { text, children: [] };

    if (stack.length === 0) {
      result.push(newNode);
      stack.push({ level, item: newNode });
      return;
    }

    if (level > stack[stack.length - 1].level) {
      stack[stack.length - 1].item.children.push(newNode);
      stack.push({ level, item: newNode });
      return;
    }

    while (
      stack.length &&
      stack[stack.length - 1].level >= level
    ) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(newNode);
    } else {
      stack[stack.length - 1].item.children.push(newNode);
    }

    stack.push({ level, item: newNode });
  };

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (!node) continue;
      if (node.type === "listitem") processListItem(node);
      if (node.children) walk(node.children);
    }
  };

  walk(rootChildren);
  return result;
};

/* -----------------------------------------------------------
   RESOURCES COLLECTION
------------------------------------------------------------ */
const Resources: CollectionConfig = {
  slug: "resources",

  access: {
    read: () => true,
  },

  admin: {
    useAsTitle: "title",
  },

  hooks: {
    beforeValidate: [generateSlug],

    beforeChange: [
      async ({ data }) => {
        /* -------- Mindmap -------- */
        const root =
          data?.mindmap?.root || data?.mindmap?.[0]?.root || null;

        if (root?.children) {
          try {
            data.mindmapJSON = convertNodesToMindmap(root.children);
          } catch (err) {
            console.error("❌ Mindmap conversion error:", err);
          }
        }

        /* -------- FAQ TEXT (TTS + SEO) -------- */
        if (Array.isArray(data?.faqs)) {
          data.faqText = data.faqs
            .map((f: any) => {
              const q =
                extractPlainText(f.question?.root) || "";
              const a =
                extractPlainText(f.answer?.root) || "";

              return `Question: ${q}. Answer: ${a}.`;
            })
            .join(" ");
        }

        return data;
      },
    ],

    afterRead: [
      ({ doc }) => {
        const boardSlug =
          typeof doc.board === "object" ? doc.board?.slug : null;

        const gradeSlug =
          typeof doc.grade === "object" ? doc.grade?.slug : null;

        const subjectSlug =
          typeof doc.subject === "object" ? doc.subject?.slug : null;

        const lessonSlug =
          typeof doc.lesson === "object" ? doc.lesson?.slug : null;

        if (
          boardSlug &&
          gradeSlug &&
          subjectSlug &&
          lessonSlug &&
          doc?.slug
        ) {
          doc.fullPath = `${boardSlug}/${gradeSlug}/${subjectSlug}/${lessonSlug}/${doc.slug}`;
        }

        return doc;
      },
    ],
  },

  fields: [
    { name: "title", type: "text", required: true },

    {
      name: "slug",
      type: "text",
      index: true,
      admin: { position: "sidebar" },
    },

    { name: "board", type: "relationship", relationTo: "boards", required: true },
    { name: "medium", type: "relationship", relationTo: "mediums", required: true },
    { name: "grade", type: "relationship", relationTo: "grades", required: true },

    {
      name: "subject",
      type: "relationship",
      relationTo: "subjects",
      required: true,
      filterOptions: ({ data }): Where => {
        if (data?.board && data?.medium && data?.grade) {
          return {
            and: [
              { board: { equals: data.board } },
              { medium: { equals: data.medium } },
              { grade: { equals: data.grade } },
            ],
          };
        }
        return { id: { exists: false } };
      },
    },

    {
      name: "lesson",
      type: "relationship",
      relationTo: "lessons",
      required: true,
      filterOptions: ({ data }): Where => {
        if (data?.subject) {
          return { subject: { equals: data.subject } };
        }
        return { id: { exists: false } };
      },
    },

    /* -------- MAIN CONTENT -------- */
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor(),
    },

    {
      name: "description",
      type: "textarea",
    },

    /* -------- FAQ (UPDATED) -------- */
    {
      name: "faqs",
      type: "array",
      fields: [
        {
          name: "question",
          type: "richText",
          editor: lexicalEditor(),
        },
        {
          name: "answer",
          type: "richText",
          editor: lexicalEditor(),
        },
      ],
    },

    {
      name: "faqText",
      type: "textarea",
      admin: { readOnly: true },
    },

    /* -------- SEO -------- */
    {
      name: "seo",
      type: "group",
      admin: { position: "sidebar" },
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
      ],
    },

    /* -------- FEATURES -------- */
    { name: "pdfPath", type: "text" },
    { name: "video", type: "text" },
    { name: "audio", type: "text" },

    {
      name: "studyGuide",
      type: "richText",
      editor: lexicalEditor(),
    },
    {
      name: "mindmap",
      type: "richText",
      editor: lexicalEditor(),
    },

    { name: "dataTable", type: "json" },

    {
      name: "infograph",
      type: "upload",
      relationTo: "media",
      admin: { position: "sidebar" },
    },

    {
      name: "mindmapJSON",
      type: "json",
      admin: { readOnly: true },
    },

    {
      name: "order",
      type: "number",
    },
  ],
};

export default Resources;