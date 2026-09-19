import { DocsPageContent, docsMetadata, docsStaticParams } from "@/components/layout/docs-page-content";

type Params = Promise<{ slug: string[] }>;

export function generateStaticParams() {
  return docsStaticParams();
}

export async function generateMetadata({ params }: { params: Params }) {
  return docsMetadata("th", (await params).slug);
}

export default async function ThaiDocsPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <DocsPageContent locale="th" slugParts={slug} />;
}
