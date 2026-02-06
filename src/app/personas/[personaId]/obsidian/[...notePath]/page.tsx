import Link from "next/link";
import { PersonaProfile, IndexData } from "@/types";
import { scanVault, buildNoteIndex, convertWikiLinks, extractTags } from "@/lib/obsidian";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface PageProps {
  params: Promise<{ personaId: string; notePath: string[] }>;
}

async function getProfile(personaId: string): Promise<PersonaProfile> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", personaId, "profile.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getAllPersonaIds(): Promise<string[]> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "index.json");
  const data = await fs.readFile(filePath, "utf-8");
  const index: IndexData = JSON.parse(data);
  return index.personas.map((p) => p.id);
}

export async function generateStaticParams() {
  const ids = await getAllPersonaIds();
  const params: { personaId: string; notePath: string[] }[] = [];

  for (const id of ids) {
    try {
      const profile = await getProfile(id);
      if (!profile.obsidian || profile.obsidian.total_notes === 0) continue;

      const vault = await scanVault(id);

      for (const note of vault.rootNotes) {
        params.push({ personaId: id, notePath: [encodeURIComponent(note.name)] });
      }

      for (const [folderName, notes] of vault.folders) {
        for (const note of notes) {
          params.push({ personaId: id, notePath: [encodeURIComponent(folderName), encodeURIComponent(note.name)] });
        }
      }
    } catch {
      // Skip personas without obsidian data
    }
  }

  return params;
}

export default async function ObsidianNotePage({ params }: PageProps) {
  const { personaId, notePath } = await params;
  const fs = await import("fs/promises");
  const pathModule = await import("path");

  const profile = await getProfile(personaId);

  // Decode path segments
  const decodedPath = notePath.map(decodeURIComponent);
  const noteName = decodedPath[decodedPath.length - 1];
  const folderName = decodedPath.length > 1 ? decodedPath[0] : null;

  // Read the markdown file
  const mdFilePath = pathModule.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "obsidian",
    ...decodedPath
  ) + ".md";

  let rawContent: string;
  try {
    rawContent = await fs.readFile(mdFilePath, "utf-8");
  } catch {
    return (
      <div className="space-y-8">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/personas">Personas</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/personas/${personaId}`}>{profile.name}</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/personas/${personaId}/obsidian`}>Vault</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{noteName}</span>
        </nav>
        <div className="card-static p-6">
          <p className="text-[var(--muted)]">Note not found.</p>
        </div>
      </div>
    );
  }

  // Extract tags and convert wiki-links
  const { cleanContent, tags } = extractTags(rawContent);
  const vault = await scanVault(personaId);
  const noteIndex = buildNoteIndex(vault);
  const processedContent = convertWikiLinks(cleanContent, personaId, noteIndex);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}`}>{profile.name}</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}/obsidian`}>Vault</Link>
        <span className="breadcrumb-separator">/</span>
        {folderName && (
          <>
            <span className="text-[var(--muted)]">{folderName}</span>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <span className="breadcrumb-current">{noteName}</span>
      </nav>

      {/* Note Content */}
      <div className="card-static p-6">
        <MarkdownRenderer content={processedContent} />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[var(--border)]">
            {tags.map((tag) => (
              <span key={tag} className="obsidian-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
