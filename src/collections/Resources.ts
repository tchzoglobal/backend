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
      stack[stack.length - 1].item.children.push(
        newNode
      );
    }

    stack.push({ level, item: newNode });
  };

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (!node) continue;
      if (node.type === "listitem")
        processListItem(node);
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

  indexes: [
    { fields: ["lesson"] },
    { fields: ["subject"] },
    { fields: ["board", "grade", "medium"] },
    { fields: ["subject", "lesson"] },
    { fields: ["lesson", "board", "grade", "medium"] },
    { fields: ["createdAt"] },
  ],

  access: {
    read: () => true,
  },

  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "subject",
      "board",
      "grade",
      "medium",
    ],
  },

  fields: [
    /* ---------------- BASIC INFO ---------------- */
    {
      name: "title",
      type: "text",
      required: true,
    },

    {
      name: "board",
      type: "relationship",
      relationTo: "boards",
      required: true,
    },
    {
      name: "medium",
      type: "relationship",
      relationTo: "mediums",
      required: true,
    },
    {
      name: "grade",
      type: "relationship",
      relationTo: "grades",
      required: true,
    },

    /* ---------------- SUBJECT FILTER ---------------- */
    {
      name: "subject",
      type: "relationship",
      relationTo: "subjects",
      required: true,
      filterOptions: ({ data }): Where => {
        if (
          data?.board &&
          data?.medium &&
          data?.grade
        ) {
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

    /* ---------------- LESSON FILTER ---------------- */
    {
      name: "lesson",
      type: "relationship",
      relationTo: "lessons",
      required: true,
      filterOptions: ({ data }): Where => {
        if (data?.subject) {
          return {
            subject: {
              equals: data.subject,
            },
          };
        }
        return { id: { exists: false } };
      },
    },

    /* ---------------- MEDIA LINKS ---------------- */
    {
      name: "video",
      type: "text",
      label: "Video (YouTube URL)",
    },
    {
      name: "audio",
      type: "text",
      label: "Audio (YouTube URL)",
    },

    /* ---------------- RICH TEXT ---------------- */
    {
      name: "faq",
      type: "richText",
      editor: lexicalEditor(),
    },
    {
      name: "briefingDoc",
      type: "richText",
      editor: lexicalEditor(),
    },
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

    /* ---------------- NEW: DATA TABLE ---------------- */
    {
      name: "dataTable",
      type: "json",
      label: "Data Table (JSON)",
      admin: {
        description:
          "Paste structured JSON for tabular display",
      },
    },

    /* ---------------- NEW: INFOGRAPH ---------------- */
    {
      name: "infograph",
      type: "upload",
      relationTo: "media",
      label: "Infograph",
      required: false,
      admin: {
        position: "sidebar",
      },
      filterOptions: { mimeType: { contains: "image" }, },
    },

    /* ---------------- GENERATED ---------------- */
    {
      name: "mindmapJSON",
      type: "json",
      label: "Mindmap (Generated JSON)",
      admin: {
        readOnly: true,
      },
    },
  ],

  /* -----------------------------------------------------------
     HOOKS
  ------------------------------------------------------------ */
  hooks: {
    /* ---------- BEFORE CHANGE ---------- */
    beforeChange: [
      async ({ data }) => {
        const root =
          data?.mindmap?.root ||
          data?.mindmap?.[0]?.root ||
          null;

        if (root?.children) {
          try {
            data.mindmapJSON =
              convertNodesToMindmap(
                root.children
              );
          } catch (err) {
            console.error(
              "❌ Mindmap conversion error:",
              err
            );
          }
        }

        return data;
      },
    ],

    /* ---------- AFTER CHANGE (ISR) ---------- */
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        try {
          const lessonId =
            typeof doc.lesson === "object"
              ? doc.lesson?.id
              : doc.lesson;

          const subjectId =
            typeof doc.subject === "object"
              ? doc.subject?.id
              : doc.subject;

          /* ----- Detect field changes ----- */
          const infographChanged =
            JSON.stringify(
              previousDoc?.infograph
            ) !==
            JSON.stringify(doc?.infograph);

          const dataTableChanged =
            JSON.stringify(
              previousDoc?.dataTable
            ) !==
            JSON.stringify(doc?.dataTable);

          const shouldRevalidate =
            infographChanged ||
            dataTableChanged;

          /* ----- Lesson ISR ----- */
          if (lessonId && shouldRevalidate) {
            await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  type: "resources",
                  lessonID: lessonId,
                  reason:
                    infographChanged
                      ? "infograph-update"
                      : "datatable-update",
                  secret:
                    process.env.REVALIDATE_TOKEN,
                }),
              }
            );
          }

          /* ----- Subject → Lessons ISR ----- */
          if (subjectId && shouldRevalidate) {
            const subject = (await req.payload.findByID(
              {
                collection: "subjects",
                id: subjectId,
              }
            )) as any;

            await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  type: "lessons",
                  subject:
                    subject?.slug ||
                    subject?.name ||
                    "unknown",
                  secret:
                    process.env.REVALIDATE_TOKEN,
                }),
              }
            );
          }
        } catch (err) {
          console.error(
            "❌ Resource ISR failed:",
            err
          );
        }
      },
    ],

    /* ---------- AFTER DELETE ---------- */
    afterDelete: [
      async () => {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                type: "resources",
                secret:
                  process.env.REVALIDATE_TOKEN,
              }),
            }
          );
        } catch (err) {
          console.error(
            "❌ Delete ISR failed:",
            err
          );
        }
      },
    ],
  },
};

export default Resources;