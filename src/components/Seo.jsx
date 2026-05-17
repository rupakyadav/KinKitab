import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'KinKitab';
const DEFAULT_DESCRIPTION =
  'KinKitab is a marketplace for used books. Buy and sell pre-loved reads in your city, with cash on delivery.';

/**
 * Centralized <head> manager so every page sets a consistent title,
 * description, and Open Graph / Twitter card metadata.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — A second life for every book`;
  const canonicalUrl =
    url || (typeof window !== 'undefined' ? window.location.href : undefined);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
