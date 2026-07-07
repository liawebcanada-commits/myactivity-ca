'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Category, Locale } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  activeSlug?: string;
  locale: Locale;
  citySlug: string;
}

export default function CategoryFilter({
  categories,
  activeSlug,
  locale,
  citySlug,
}: CategoryFilterProps) {
  const t = useTranslations('categories');
  const tf = useTranslations('filters');
  const router = useRouter();

  const handleSelect = (slug: string | null) => {
    if (slug === null) {
      router.push(`/${locale}/activities/${citySlug}`);
    } else {
      router.push(`/${locale}/activities/${citySlug}/${slug}`);
    }
  };

  return (
    <nav
      aria-label={tf('allCategories')}
      className="flex flex-wrap gap-2"
    >
      {/* "All" button */}
      <button
        onClick={() => handleSelect(null)}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeSlug
            ? 'border-brand-red bg-brand-red text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:border-brand-red hover:text-brand-red'
        }`}
        aria-pressed={!activeSlug}
      >
        {tf('allCategories')}
      </button>

      {categories.map((cat) => {
        const isActive = cat.slug === activeSlug;
        const label = locale === 'fr' ? cat.name_fr : cat.name_en;

        return (
          <button
            key={cat.slug}
            onClick={() => handleSelect(cat.slug)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-brand-red bg-brand-red text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand-red hover:text-brand-red'
            }`}
            aria-pressed={isActive}
          >
            <span aria-hidden="true">{cat.icon}</span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
