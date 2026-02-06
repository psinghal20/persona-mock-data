import fs from "fs/promises";
import path from "path";

export interface VaultNote {
  name: string; // filename without .md
  relativePath: string; // e.g. "Daily Notes/2026-01-30" or "Home"
  folder: string | null; // null for root notes
}

export interface VaultStructure {
  rootNotes: VaultNote[];
  folders: Map<string, VaultNote[]>;
}

/**
 * Scan an obsidian vault directory and return its structure.
 */
export async function scanVault(personaId: string): Promise<VaultStructure> {
  const vaultDir = path.join(process.cwd(), "public", "data", personaId, "obsidian");
  const rootNotes: VaultNote[] = [];
  const folders = new Map<string, VaultNote[]>();

  const entries = await fs.readdir(vaultDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const name = entry.name.replace(/\.md$/, "");
      rootNotes.push({ name, relativePath: name, folder: null });
    } else if (entry.isDirectory()) {
      const folderPath = path.join(vaultDir, entry.name);
      const folderEntries = await fs.readdir(folderPath, { withFileTypes: true });
      const notes: VaultNote[] = [];

      for (const fe of folderEntries) {
        if (fe.isFile() && fe.name.endsWith(".md")) {
          const name = fe.name.replace(/\.md$/, "");
          notes.push({
            name,
            relativePath: `${entry.name}/${name}`,
            folder: entry.name,
          });
        }
      }

      folders.set(entry.name, notes);
    }
  }

  return { rootNotes, folders };
}

/**
 * Build a note index mapping note names to their relative paths.
 * Used for resolving short wiki-links like [[Shopping List]].
 */
export function buildNoteIndex(vault: VaultStructure): Map<string, string> {
  const index = new Map<string, string>();

  for (const note of vault.rootNotes) {
    index.set(note.name, note.relativePath);
  }

  for (const [, notes] of vault.folders) {
    for (const note of notes) {
      index.set(note.name, note.relativePath);
    }
  }

  return index;
}

/**
 * Convert Obsidian wiki-links to standard markdown links.
 * Handles: [[Note Name]], [[path/Note|Display Text]]
 */
export function convertWikiLinks(
  content: string,
  personaId: string,
  noteIndex: Map<string, string>
): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, linkContent: string) => {
    let target: string;
    let display: string;

    if (linkContent.includes("|")) {
      const [rawTarget, ...rest] = linkContent.split("|");
      target = rawTarget.trim();
      display = rest.join("|").trim();
    } else {
      target = linkContent.trim();
      display = target;
      // If target has a path, use only the last part for display
      if (target.includes("/")) {
        display = target.split("/").pop()!;
      }
    }

    // Resolve the target path — only link if the note actually exists
    let resolvedPath: string | undefined;
    if (target.includes("/")) {
      // Full path like "Daily Notes/2026-01-30" — check the last segment exists
      const noteName = target.split("/").pop()!;
      if (noteIndex.has(noteName)) {
        resolvedPath = target;
      }
    } else {
      resolvedPath = noteIndex.get(target);
    }

    if (!resolvedPath) {
      // Note doesn't exist in vault — render as plain text
      return `**${display}**`;
    }

    const encodedPath = resolvedPath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const href = `/personas/${personaId}/obsidian/${encodedPath}`;

    return `[${display}](${href})`;
  });
}

/**
 * Extract tags from the end of content (format: Tags: #tag1 #tag2).
 * Returns the cleaned content and extracted tags.
 */
export function extractTags(content: string): { cleanContent: string; tags: string[] } {
  const tags: string[] = [];
  const lines = content.split("\n");

  // Look for Tags: line near the end (within last 5 lines)
  let tagLineIndex = -1;
  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    if (lines[i].startsWith("Tags:")) {
      tagLineIndex = i;
      const tagMatches = lines[i].match(/#[\w-]+/g);
      if (tagMatches) {
        tags.push(...tagMatches.map((t) => t.slice(1))); // Remove # prefix
      }
      break;
    }
  }

  if (tagLineIndex >= 0) {
    lines.splice(tagLineIndex, 1);
  }

  return { cleanContent: lines.join("\n"), tags };
}
