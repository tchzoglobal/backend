import type { CollectionConfig, Where } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

/* -----------------------------------------------------------
   Extract plain text from Lexical nodes
------------------------------------------------------------ */
const extractText = (node: any): string => {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children))
    return node.children.map(extractText).join(" ");
  return "";
};

/* -----------------------------------------------------------
   Convert Lexical → Proper hierarchical mindmap
------------------------------------------------------------ */
const convertNodesToMindmap = (rootChildren: any[]) => {
  if (!Array.isArray(rootChildren)) return [];

  const result: any[] = [];
  const stack: any[] = [];

  const extractListItemText = (children: any[]) => {
    let text = "";
    for (const child of children) {
      if (child.type === "text") text += child.text + " ";
      if (child.type === "paragraph" && Array.isArray(child.children)) {
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

    while (stack.length && stack[stack.length - 1].level >= level) {
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
   MAIN COLLECTION
------------------------------------------------------------ */
const Resources: CollectionConfig = {
  slug: "resources",
  indexes: [
    { fields: ['lesson'] },
    { fields: ['subject'] },
    { fields: ['board', 'grade', 'medium'] },
    { fields: ['subject', 'lesson'] },
    { fields: ['lesson', 'board', 'grade', 'medium'] },
    { fields: ['createdAt'] },
  ],
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ['title', 'subject', 'board', 'grade', 'medium'],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "board", type: "relationship", relationTo: "boards", required: true },
    { name: "medium", type: "relationship", relationTo: "mediums", required: true },
    { name: "grade", type: "relationship", relationTo: "grades", required: true },

    {
      name: "subject",
      type: "relationship",
      relationTo: "subjects",
      required: true,
      // ✅ Explicitly typed as Where to fix index signature error
      filterOptions: ({ data }): Where => {
        const board = data?.board;
        const medium = data?.medium;
        const grade = data?.grade;

        if (board && medium && grade) {
          return {
            and: [
              { board: { equals: board } },
              { medium: { equals: medium } },
              { grade: { equals: grade } },
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

    { name: "video", type: "text", label: "Video (YouTube URL)" },
    { name: "audio", type: "text", label: "Audio (YouTube URL)" },
    { name: "faq", type: "richText", editor: lexicalEditor() },
    { name: "briefingDoc", type: "richText", editor: lexicalEditor() },
    { name: "studyGuide", type: "richText", editor: lexicalEditor() },
    { name: "mindmap", type: "richText", editor: lexicalEditor() },

    {
      name: "mindmapJSON",
      type: "json",
      admin: { readOnly: true },
      label: "Mindmap (Generated JSON)",
    },
  ],

  hooks: {
    beforeChange: [
      async ({ data }) => {
        const mindmapRoot =
          data?.mindmap?.root ||
          data?.mindmap?.[0]?.root ||
          null;

        if (mindmapRoot?.children) {
          try {
            data.mindmapJSON = convertNodesToMindmap(mindmapRoot.children);
          } catch (err) {
            console.error("❌ Mindmap conversion error:", err);
          }
        }
        return data;
      },
    ],

    afterChange: [
      async ({ doc, req }) => {
        try {
          const lessonId = typeof doc.lesson === "object" ? doc.lesson?.id : doc.lesson;
          const subjectId = typeof doc.subject === "object" ? doc.subject?.id : doc.subject;

          if (lessonId) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "resources",
                lessonID: lessonId,
                secret: process.env.REVALIDATE_TOKEN,
              }),
            });
          }

          if (subjectId) {
            // ✅ Cast as any to fix the "slug does not exist on type Subject" error
            const subject = (await req.payload.findByID({
              collection: "subjects",
              id: subjectId,
            })) as any;

            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "lessons",
                subject: subject?.slug || subject?.name || 'unknown',
                secret: process.env.REVALIDATE_TOKEN,
              }),
            });
          }
        } catch (err) {
          console.error("❌ Resource ISR revalidation failed:", err);
        }
      },
    ],

    afterDelete: [
      async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "resources",
              secret: process.env.REVALIDATE_TOKEN,
            }),
          });
        } catch (err) {
          console.error("❌ Resource delete ISR failed:", err);
        }
      },
    ],
  },
};

export default Resources;