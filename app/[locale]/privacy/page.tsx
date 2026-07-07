import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/types';
import { buildPageMetadata } from '@/lib/metadata';

interface Props {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return buildPageMetadata({
    title: t('title'),
    description:
      locale === 'fr'
        ? 'Notre politique de confidentialité explique comment nous collectons et utilisons vos données.'
        : 'Our privacy policy explains how we collect and use your data.',
    locale,
    path: '/privacy',
  });
}

export default async function PrivacyPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const today = new Date().toISOString().slice(0, 10);

  const isEn = locale === 'en';

  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t('heading')}</h1>
        <p className="mt-2 text-sm text-gray-400">
          {t('lastUpdated')}: {today}
        </p>

        <div className="prose prose-gray mt-8 max-w-none">
          {isEn ? (
            <>
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly (e.g. contact form submissions) and
                information collected automatically (e.g. usage analytics via Google Analytics 4).
              </p>

              <h2>2. Cookies & Tracking</h2>
              <p>
                MyActivity.ca uses cookies for analytics (Google Analytics 4) and advertising
                (Google AdSense). These are loaded only after you give explicit consent via the
                cookie banner, in compliance with Quebec Law 25 and Canadian federal privacy law.
              </p>

              <h2>3. Affiliate Links</h2>
              <p>
                Some links on this site are affiliate links (GetYourGuide, Viator, Groupon,
                Ticketmaster). Clicking these links may result in us earning a commission at no
                extra cost to you. We do not share personally identifiable information with
                affiliate partners.
              </p>

              <h2>4. Data Retention</h2>
              <p>
                Analytics data is retained for 14 months (GA4 default). We do not store personal
                data beyond what is required by our service providers.
              </p>

              <h2>5. Your Rights (Quebec Law 25)</h2>
              <p>
                Under Quebec Law 25 (Act respecting the protection of personal information in the
                private sector), you have the right to access, correct, and request deletion of
                your personal information. To exercise these rights, contact us at{' '}
                <a href="mailto:hello@myactivity.ca">hello@myactivity.ca</a>.
              </p>

              <h2>6. Opt-Out</h2>
              <p>
                You may decline cookies at any time via the cookie banner or by clearing your
                browser&apos;s local storage. Doing so will prevent GA4 and AdSense from loading.
              </p>

              <h2>7. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. The &quot;Last Updated&quot; date at the top of
                this page reflects the most recent revision.
              </p>

              <h2>8. Contact</h2>
              <p>
                Questions? Email us at{' '}
                <a href="mailto:hello@myactivity.ca">hello@myactivity.ca</a>.
              </p>
            </>
          ) : (
            <>
              <h2>1. Renseignements que nous collectons</h2>
              <p>
                Nous collectons les renseignements que vous nous fournissez directement (p. ex.,
                soumissions de formulaire de contact) et les renseignements collectés
                automatiquement (p. ex., analytique d&apos;utilisation via Google Analytics 4).
              </p>

              <h2>2. Témoins et suivi</h2>
              <p>
                MyActivity.ca utilise des témoins à des fins d&apos;analytique (Google Analytics 4) et de
                publicité (Google AdSense). Ces témoins ne sont chargés qu&apos;après votre consentement
                explicite via le bandeau de témoins, conformément à la Loi 25 du Québec et à la loi
                fédérale canadienne sur la protection des renseignements personnels.
              </p>

              <h2>3. Liens affiliés</h2>
              <p>
                Certains liens sur ce site sont des liens affiliés (GetYourGuide, Viator, Groupon,
                Ticketmaster). En cliquant sur ces liens, nous pouvons percevoir une commission
                sans frais supplémentaires pour vous. Nous ne partageons pas de renseignements
                personnels identifiables avec nos partenaires affiliés.
              </p>

              <h2>4. Conservation des données</h2>
              <p>
                Les données analytiques sont conservées 14 mois (par défaut dans GA4). Nous ne
                stockons pas de données personnelles au-delà de ce qui est requis par nos
                fournisseurs de services.
              </p>

              <h2>5. Vos droits (Loi 25)</h2>
              <p>
                En vertu de la Loi 25 (Loi modernisant des dispositions législatives en matière de
                protection des renseignements personnels), vous avez le droit d&apos;accéder à vos
                renseignements personnels, de les corriger et d&apos;en demander la suppression. Pour
                exercer ces droits, contactez-nous à{' '}
                <a href="mailto:hello@myactivity.ca">hello@myactivity.ca</a>.
              </p>

              <h2>6. Désinscription</h2>
              <p>
                Vous pouvez refuser les témoins à tout moment via le bandeau de témoins ou en
                effaçant le stockage local de votre navigateur. Cela empêchera le chargement de
                GA4 et AdSense.
              </p>

              <h2>7. Modifications de cette politique</h2>
              <p>
                Nous pouvons mettre à jour cette politique de temps à autre. La date de «&nbsp;Dernière
                mise à jour&nbsp;» en haut de cette page reflète la révision la plus récente.
              </p>

              <h2>8. Contact</h2>
              <p>
                Des questions? Écrivez-nous à{' '}
                <a href="mailto:hello@myactivity.ca">hello@myactivity.ca</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
