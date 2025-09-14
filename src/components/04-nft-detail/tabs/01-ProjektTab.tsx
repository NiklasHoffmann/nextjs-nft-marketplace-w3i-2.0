"use client";

import { AdminNFTInsight, AdminCollectionInsight } from '@/types';

interface ProjektTabProps {
  adminInsights?: AdminNFTInsight;
  collectionInsights?: AdminCollectionInsight;
  loading?: boolean;
}

export default function ProjektTab({ adminInsights, collectionInsights, loading }: ProjektTabProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Use NFT-specific insights if available, otherwise fall back to collection insights
  const insights = adminInsights || collectionInsights;
  const isCollectionLevel = !adminInsights && collectionInsights;

  if (!insights) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg mb-2">Keine Projekt-Informationen verfügbar</p>
        <p className="text-gray-400 text-sm">
          Weder NFT-spezifische noch Collection-weite Insights wurden erstellt.
        </p>
      </div>
    );
  }

  const hasProjectInfo = insights.projectName || insights.projectDescription || 
                        insights.projectWebsite || insights.projectTwitter || 
                        insights.projectDiscord;

  const hasPartnerships = insights.partnerships?.length || insights.partnershipDetails;

  return (
    <div className="space-y-8">
      {/* Project/Product Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🚀</span>
          Projekt & Produkt
        </h3>
        
        {/* Collection Level Indicator */}
        {isCollectionLevel && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center">
              <span className="mr-2">🔗</span>
              Diese Informationen gelten für die gesamte Collection
            </p>
          </div>
        )}

        {hasProjectInfo ? (
          <div className="space-y-4">
            {insights.projectName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projektname
                </label>
                <p className="text-gray-900 font-medium">{insights.projectName}</p>
              </div>
            )}
            
            {insights.projectDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {insights.projectDescription}
                </p>
              </div>
            )}
            
            {/* Project Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {insights.projectWebsite && (
                <a
                  href={insights.projectWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="mr-1">🌐</span>
                  Website
                </a>
              )}
              
              {insights.projectTwitter && (
                <a
                  href={insights.projectTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                >
                  <span className="mr-1">🐦</span>
                  Twitter
                </a>
              )}
              
              {insights.projectDiscord && (
                <a
                  href={insights.projectDiscord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <span className="mr-1">💬</span>
                  Discord
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Keine Projekt-Informationen verfügbar.
          </p>
        )}
      </div>

      {/* Partnerships */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🤝</span>
          Partnerschaften
        </h3>
        
        {hasPartnerships ? (
          <div className="space-y-4">
            {insights.partnerships && insights.partnerships.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner
                </label>
                <div className="flex flex-wrap gap-2">
                  {insights.partnerships.map((partner, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {insights.partnershipDetails && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details zu Partnerschaften
                </label>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {insights.partnershipDetails}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Keine Partnerschaft-Informationen verfügbar.
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>Erstellt von: {insights.createdBy}</span>
          <span>
            Zuletzt aktualisiert: {new Date(insights.updatedAt).toLocaleDateString('de-DE')}
          </span>
        </div>
      </div>
    </div>
  );
}
