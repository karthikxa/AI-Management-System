'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProjectFilesView } from '@/features/workspace/project-layout/project-files-view';
import { ProjectFilesSkeleton } from '@/features/workspace/project-layout/project-files-skeleton';

/**
 * /projects/[id]/files — Google-Drive-style file explorer over the project repository.
 */
export default function ProjectFilesPage() {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <Suspense fallback={<ProjectFilesSkeleton />}>
        <ProjectFilesView projectId={projectId || 'default'} />
      </Suspense>
    </div>
  );
}
