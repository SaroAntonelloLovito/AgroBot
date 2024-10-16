import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";

/**
 * Reduces the document array based on the provided new documents or actions.
 *
 * @param existing - The existing array of documents.
 * @param newDocs - The new documents or actions to apply.
 * @returns The updated array of documents.
 */
export function reduceDocs(
    existing?: Document[],
    newDocs?:
      | Document[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | { [key: string]: any }[]
      | string[]
      | string
      | "delete",
  ) {
    // Supports deletion by returning an empty array when "delete" is specified
    if (newDocs === "delete") {
      return [];
    }
    // Supports adding a single string document
    if (typeof newDocs === "string") {
      const docId = uuidv4();
      return [{ pageContent: newDocs, metadata: { id: docId }, id: docId }];
    }
    // User can provide "docs" content in a few different ways
    if (Array.isArray(newDocs)) {
      const coerced: Document[] = [];
      for (const item of newDocs) {
        if (typeof item === "string") {
          coerced.push({ pageContent: item, metadata: { id: uuidv4() } });
        } else if (typeof item === "object") {
          const doc = item as Document;
          const docId = item?.id || uuidv4();
          item.id = docId;
          if (!doc.metadata || !doc.metadata.id) {
            doc.metadata = doc.metadata || {};
            doc.metadata.id = docId;
          }
          coerced.push(doc);
        }
      }
      return coerced;
    }
    // Returns existing documents if no valid update is provided
    return existing || [];
  }