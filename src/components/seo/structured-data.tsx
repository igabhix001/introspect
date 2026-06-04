export function StructuredData() {
  const schemas = [
    // SoftwareApplication schema
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "INTROSPECT™",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "333",
        "priceCurrency": "INR",
        "priceValidUntil": "2026-12-31",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150",
      },
      "description":
        "Risk management and trading discipline platform for intraday traders.",
      "url": "https://www.intradaymindview.com",
      "provider": {
        "@type": "Organization",
        "name": "Intraday MindView Learning",
        "url": "https://www.intradaymindview.com",
      },
    },
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Intraday MindView Learning",
      "url": "https://www.intradaymindview.com",
      "logo": "https://www.intradaymindview.com/logo.png",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Hindi"],
      },
    },
    // WebSite schema
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "INTROSPECT™ – Intraday MindView Learning",
      "url": "https://www.intradaymindview.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target":
          "https://www.intradaymindview.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    // FAQPage schema
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is INTROSPECT™?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "INTROSPECT™ is a comprehensive trading psychology and risk management platform designed by Intraday MindView Learning. It helps intraday traders build discipline, reduce emotional trading, manage risk per trade, and protect their capital with personalized rules, daily reports, and cognitive behavioral therapy (CBT) reflection tools.",
          },
        },
        {
          "@type": "Question",
          "name": "How does INTROSPECT™ help traders win consistent profit in the long run?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "INTROSPECT™ tackles the core reason why 90% of intraday traders lose money: lack of discipline and emotional decision-making. By establishing personalized risk limits, providing live position sizing, identifying behavioral mistakes, and coaching traders using CBT reflections, INTROSPECT™ helps traders establish a professional mindset and a mathematical edge to achieve consistent profitability over the long run.",
          },
        },
        {
          "@type": "Question",
          "name": "What features are included in INTROSPECT™?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The platform includes: 1) Diagnostic Assessment to evaluate trading psychology. 2) Advanced Trade Journal with automated mistake tagging. 3) AI Reflection Coach for CBT feedback on mistakes. 4) Position Size Calculator integrated with live market sentiment. 5) Daily End-of-Day Performance Reports. 6) 30, 60, and 90-Day Discipline Challenges with points and rewards.",
          },
        },
      ],
    },
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
