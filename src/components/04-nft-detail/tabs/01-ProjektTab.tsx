"use client";

import { AdminNFTInsight, AdminCollectionInsight } from '@/types';
import { TitleDescriptionPair } from '@/types/05-features/03-nft-insights';

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

  // Check for enhanced description structure with project info
  const hasEnhancedProjectInfo = (insights.projectDescriptions?.titleDescriptionPairs?.length ?? 0) > 0 ||
    (insights.specificDescriptions?.titleDescriptionPairs?.length ?? 0) > 0; // Legacy support

  const hasProjectLinks = insights.projectWebsite || insights.projectTwitter ||
    insights.projectDiscord;

  const hasPartnerships = insights.partnerships?.length || insights.partnershipDetails;

  return (
    <div className="space-y-8">
      {/* Title-Description Pairs Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Collection Level Indicator */}
        {isCollectionLevel && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center">
              <span className="mr-2">🔗</span>
              Diese Informationen gelten für die gesamte Collection
            </p>
          </div>
        )}

        {(hasEnhancedProjectInfo || hasProjectLinks || insights.projectDescriptions?.titleDescriptionPairs?.length || insights.specificDescriptions?.titleDescriptionPairs?.length) ? (
          <div className="space-y-6">
            {/* Show ALL Project Title-Description Pairs individually */}
            {/* First check new projectDescriptions structure */}
            {insights.projectDescriptions?.titleDescriptionPairs?.map((pair: TitleDescriptionPair, index: number) => {
              // Filter out empty pairs
              const hasContent = pair.title.trim() || pair.descriptions.some((desc: string) => desc.trim());
              if (!hasContent) return null;

              return (
                <div key={pair.id || index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  {/* Title */}
                  <div className="mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {pair.title || `Abschnitt ${index + 1}`}
                    </h4>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-3">
                    {pair.descriptions.filter((desc: string) => desc.trim()).map((desc: string, descIndex: number) => (
                      <div key={descIndex} className="pl-4 border-l-2 border-blue-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Legacy support - show specificDescriptions if no projectDescriptions exist */}
            {(!insights.projectDescriptions?.titleDescriptionPairs?.length && insights.specificDescriptions?.titleDescriptionPairs?.length) &&
              insights.specificDescriptions.titleDescriptionPairs.map((pair: TitleDescriptionPair, index: number) => {
                // Filter out empty pairs
                const hasContent = pair.title.trim() || pair.descriptions.some((desc: string) => desc.trim());
                if (!hasContent) return null;

                return (
                  <div key={pair.id || index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    {/* Title */}
                    <div className="mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {pair.title || `Abschnitt ${index + 1}`}
                      </h4>
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-3">
                      {pair.descriptions.filter((desc: string) => desc.trim()).map((desc: string, descIndex: number) => (
                        <div key={descIndex} className="pl-4 border-l-2 border-blue-200">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            }

            {/* Project Links Section */}
            {hasProjectLinks && (
              <div className="border border-gray-100 rounded-lg p-4 bg-blue-50">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-blue-500 mr-2">🔗</span>
                  Projekt-Links
                </h4>
                <div className="flex flex-wrap gap-3">
                  {insights.projectWebsite && (
                    <a
                      href={insights.projectWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
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
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-sky-600 bg-white rounded-lg hover:bg-sky-100 transition-colors border border-sky-200"
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
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-white rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <span className="mr-1">💬</span>
                      Discord
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Fallback: Show legacy descriptions if available */}
            {insights.descriptions && insights.descriptions.length > 0 ? (
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-gray-500 mr-2">📝</span>
                  Beschreibungen (Legacy Format)
                </h4>
                <div className="space-y-3">
                  {insights.descriptions.map((desc, index) => (
                    <div key={index} className="pl-4 border-l-2 border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : insights.description ? (
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-gray-500 mr-2">📝</span>
                  Beschreibung (Legacy Format)
                </h4>
                <div className="pl-4 border-l-2 border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {insights.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg font-medium mb-2">
                  Keine Projekt-Informationen verfügbar
                </p>
                <p className="text-gray-400 text-sm">
                  Hier werden detaillierte Informationen über das Projekt angezeigt, sobald sie verfügbar sind.
                </p>
              </div>
            )}
          </div>
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
