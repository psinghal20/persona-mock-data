import Link from "next/link";
import { PersonaProfile, IndexData } from "@/types";
import { scanVault } from "@/lib/obsidian";

interface PageProps {
  params: Promise<{ personaId: string }>;
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
  const params: { personaId: string }[] = [];

  for (const id of ids) {
    try {
      const profile = await getProfile(id);
      if (profile.obsidian && profile.obsidian.total_notes > 0) {
        params.push({ personaId: id });
      }
    } catch {
      // Skip personas without obsidian data
    }
  }

  return params;
}

export default async function ObsidianVaultPage({ params }: PageProps) {
  const { personaId } = await params;
  const profile = await getProfile(personaId);
  const vault = await scanVault(personaId);

  // Sort root notes: Home first, then alphabetical
  const sortedRootNotes = [...vault.rootNotes].sort((a, b) => {
    if (a.name === "Home") return -1;
    if (b.name === "Home") return 1;
    return a.name.localeCompare(b.name);
  });

  // Sort folders alphabetically, filter out empty ones
  const sortedFolders = [...vault.folders.entries()]
    .filter(([, notes]) => notes.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  const totalNotes = profile.obsidian?.total_notes ?? 0;
  const folderCount = sortedFolders.length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}`}>{profile.name}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Obsidian Vault</span>
      </nav>

      {/* Header */}
      <div className="card-static p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-3xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Obsidian Vault</h1>
            <p className="text-[var(--muted)] mt-1">
              {profile.name}&apos;s personal knowledge base
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">{totalNotes}</div>
            <div className="text-sm text-[var(--muted)]">
              notes in {folderCount} {folderCount === 1 ? "folder" : "folders"}
            </div>
          </div>
        </div>
      </div>

      {/* Root Notes */}
      {sortedRootNotes.length > 0 && (
        <div>
          <h3 className="section-header">Root Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedRootNotes.map((note) => (
              <Link
                key={note.relativePath}
                href={`/personas/${personaId}/obsidian/${encodeURIComponent(note.name)}`}
                className="note-card"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-sm">{note.name}</span>
                  {note.name === "Home" && (
                    <span className="obsidian-tag ml-auto">home</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Folders */}
      {sortedFolders.map(([folderName, notes]) => {
        const sortedNotes = [...notes].sort((a, b) => {
          // For Daily Notes, sort reverse chronologically
          if (folderName === "Daily Notes") {
            return b.name.localeCompare(a.name);
          }
          return a.name.localeCompare(b.name);
        });

        return (
          <div key={folderName}>
            <h3 className="section-header">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {folderName} ({notes.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedNotes.map((note) => (
                <Link
                  key={note.relativePath}
                  href={`/personas/${personaId}/obsidian/${encodeURIComponent(note.folder!)}/${encodeURIComponent(note.name)}`}
                  className="note-card"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-sm">{note.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
