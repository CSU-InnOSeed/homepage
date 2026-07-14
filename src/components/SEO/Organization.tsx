import { useEffect } from 'react';
import { BRAND, CONTACT_EMAIL, META } from '../../content/site';

/**
 * Organization — JSON-LD structured data describing the InnOSeed
 * organization as a schema.org Organization.
 *
 * Rendered exactly once at the root of the SPA (App.tsx). Lives on
 * every route because crawlers that follow the SPA's client-side
 * routes don't get a fresh HTML document — the same Organization
 * node applies to the whole site. Google reads Organization JSON-LD
 * to power the knowledge panel and link the site to its social
 * profiles.
 *
 * Static fields (name / url / logo / sameAs) are baked at build
 * time. If you later wire a CMS, swap the literals for the CMS-
 * supplied values and the schema stays valid as long as the JSON
 * shape matches schema.org/Organization.
 *
 * The script is created via useEffect rather than rendered as a
 * <script> in JSX because React would otherwise re-execute it on
 * every reconciliation; with useEffect we mount once at App start
 * and never touch the DOM again.
 */
export default function Organization() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (document.head.querySelector('script[data-seo="organization"]')) {
      // Strict-mode double-mount in dev, or HMR — keep one canonical
      // node and bail.
      return undefined;
    }

    const url = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://innoseed.club';

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND,
      alternateName: 'InnOSeed Lab',
      url,
      logo: `${url}/imgs/favicon.png`,
      // Same as logo, but the wider og-cover is what we'd want
      // shared as the "hero image" of the org. schema.org doesn't
      // require image for Organization, so we leave it off.
      description: META.description,
      email: CONTACT_EMAIL,
      sameAs: [
        'https://github.com/CSU-InnOSeed',
        'https://blog.csdn.net/cyl_csdn_1',
      ],
      foundingDate: '2019',
      // affiliation: 中南大学计算机学院 (CSU School of Computer Science)
      parentOrganization: {
        '@type': 'College',
        name: '中南大学计算机学院',
        alternateName: 'Central South University · School of Computer Science and Engineering',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset['seo'] = 'organization';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    // No cleanup: this is a singleton node that's correct for the
    // whole SPA session. Removing on unmount would just cause the
    // next mount to re-add it.
  }, []);

  return null;
}