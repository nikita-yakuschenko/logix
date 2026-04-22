import { ProjectTypeDetailPage } from "@/pages/project-type-detail-page"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ProjectTypeDetailPage slug={slug} />
}
