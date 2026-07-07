import Link from 'next/link';
import { generateBreadcrumbSchema, type BreadcrumbItem } from '@/lib/schema';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schema = generateBreadcrumbSchema(items);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Visual breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.url} className="flex items-center gap-1">
                {isLast ? (
                  <span aria-current="page" className="text-gray-900 font-medium">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.url}
                      className="hover:text-brand-red hover:underline"
                    >
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-gray-300">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
