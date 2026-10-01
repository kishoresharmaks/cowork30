import { Metadata } from 'next';
import BlogSingleClient from './BlogSingleClient';

interface Props {
  params: { slug: string };
}

async function getPostData(slug: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${backendUrl}/cms/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPostData(params.slug);
  const post = data?.post;

  if (!post) {
    return {
      title: 'Article Not Found | Cowork30 Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  const articleUrl = `https://cowork30.com/blog/${post.slug}`;
  const imageUrl = post.featuredImage?.startsWith('http')
    ? post.featuredImage
    : `https://cowork30.com${post.featuredImage}`;

  return {
    title: `${post.title} | Cowork30 Editorial`,
    description: post.shortDescription,
    keywords: [post.category, 'coworking', 'hybrid workspace', 'modern offices', 'Cowork30'],
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: post.title,
      description: post.shortDescription,
      url: articleUrl,
      siteName: 'Cowork30 Workspace Platform',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      authors: [post.authorName || 'Cowork30 Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.shortDescription,
      images: [imageUrl],
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const data = await getPostData(params.slug);
  const post = data?.post || null;
  const relatedPosts = data?.related || [];

  // JSON-LD Structured Data Schema for Google Search Indexing
  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.shortDescription,
        image: post.featuredImage?.startsWith('http')
          ? post.featuredImage
          : `https://cowork30.com${post.featuredImage}`,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt || post.createdAt,
        author: {
          '@type': 'Person',
          name: post.authorName || 'Cowork30 Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Cowork30',
          logo: {
            '@type': 'ImageObject',
            url: 'https://cowork30.com/icon.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://cowork30.com/blog/${post.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogSingleClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
