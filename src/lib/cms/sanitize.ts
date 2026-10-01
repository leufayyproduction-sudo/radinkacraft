import "server-only";
import sanitizeHtmlLib from "sanitize-html";
import { z } from "zod";
import { pageBlocksSchema } from "@/lib/cms/blocks";

export function sanitizeRichText(html: string) {
  return sanitizeHtmlLib(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "title", "width", "height"] },
    allowedSchemes: ["https", "mailto", "tel"],
    transformTags: { a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) },
  });
}

export function sanitizeBlocks(value: unknown) {
  const blocks = pageBlocksSchema.parse(value);
  return blocks.map((block) => block.type === "teks" ? { ...block, html: sanitizeRichText(block.html) } : block);
}

export const blogContentSchema = z.string().max(100000).transform(sanitizeRichText);
