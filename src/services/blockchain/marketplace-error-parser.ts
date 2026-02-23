const IDEATION_MARKET_ERROR_MESSAGES = {
    AlreadyListed: 'Dieses NFT ist bereits gelistet. Öffnen Sie die Detailseite, um das bestehende Listing zu verwalten.',
    BuyerNotWhitelisted: 'Ihr Wallet ist für dieses Listing nicht freigeschaltet (Buyer Whitelist).',
    CollectionNotWhitelisted: 'Diese Collection ist auf diesem Marketplace nicht freigeschaltet.',
    ContractPaused: 'Der Marketplace ist aktuell pausiert. Bitte versuchen Sie es später erneut.',
    CurrencyNotAllowed: 'Die gewählte Zahlungswährung ist für diesen Marketplace nicht erlaubt. Bitte wählen Sie eine andere Währung.',
    ERC20TokenAddressIsNotAContract: 'Die gewählte ERC20-Adresse ist kein gültiger Token-Contract.',
    ERC20TransferFailed: 'Die ERC20-Überweisung ist fehlgeschlagen. Bitte prüfen Sie Guthaben, Allowance und Token-Einstellungen.',
    EthTransferFailed: 'Die ETH-Überweisung ist fehlgeschlagen. Bitte versuchen Sie die Transaktion erneut.',
    FreeListingsNotSupported: 'Kostenlose Listings (Preis 0) sind nicht erlaubt.',
    InsufficientSwapTokenBalance: 'Nicht genügend Swap-Token verfügbar. Bitte Guthaben erhöhen oder Menge reduzieren.',
    InvalidNoSwapParameters: 'Ungültige No-Swap-Parameter. Bitte Listing-Einstellungen prüfen.',
    InvalidPurchaseQuantity: 'Ungültige Kaufmenge angegeben.',
    InvalidUnitPrice: 'Ungültiger Stückpreis. Bitte geben Sie einen gültigen Preis größer 0 an.',
    ListingTermsChanged: 'Die Listing-Bedingungen haben sich geändert. Bitte Seite aktualisieren und erneut versuchen.',
    NoSwapForSameToken: 'Ein Swap auf denselben Token ist nicht erlaubt.',
    NotApprovedForMarketplace: 'NFT ist nicht für den Marketplace freigegeben. Bitte zuerst Approve/SetApprovalForAll ausführen.',
    NotAuthorizedOperator: 'Ihr Wallet ist nicht als Operator für diesen Vorgang autorisiert.',
    NotAuthorizedToCancel: 'Sie sind nicht berechtigt, dieses Listing zu stornieren.',
    NotListed: 'Dieses NFT ist nicht (mehr) gelistet.',
    NotSupportedTokenStandard: 'Dieser Token-Standard wird vom Marketplace nicht unterstützt.',
    PartialBuyNotPossible: 'Teilkäufe sind für dieses Listing nicht erlaubt.',
    PriceNotMet: 'Der angegebene Preis stimmt nicht mit dem aktuellen Listing-Preis überein.',
    Reentrant: 'Sicherheitsabbruch durch Reentrancy-Schutz. Bitte erneut versuchen.',
    RoyaltyFeeExceedsProceeds: 'Die Royalty übersteigt den Verkaufserlös. Listing kann so nicht ausgeführt werden.',
    SameBuyerAsSeller: 'Käufer und Verkäufer dürfen nicht dieselbe Adresse sein.',
    SellerInsufficientTokenBalance: 'Die gelistete Menge ist nicht vollständig verfügbar. Bitte Seite aktualisieren und ggf. Menge reduzieren.',
    SellerNotTokenOwner: 'Der Verkäufer ist nicht (mehr) Eigentümer des Tokens.',
    StillApproved: 'Die Freigabe ist weiterhin aktiv und kann in diesem Zustand nicht verarbeitet werden.',
    WhitelistDisabled: 'Whitelist-Funktion ist für diesen Vorgang deaktiviert.',
    WrongErc1155HolderParameter: 'Ungültiger ERC1155-Holder-Parameter übergeben.',
    WrongPaymentCurrency: 'Falsche Zahlungswährung übergeben. Bitte Listing-Währung verwenden.',
    WrongQuantityParameter: 'Ungültiger Mengenparameter übergeben.'
} as const;

const IDEATION_MARKET_ERROR_CODES = Object.keys(IDEATION_MARKET_ERROR_MESSAGES) as Array<keyof typeof IDEATION_MARKET_ERROR_MESSAGES>;

type IdeationMarketErrorCode = keyof typeof IDEATION_MARKET_ERROR_MESSAGES;

function collectErrorTexts(error: unknown): string {
    if (!error) return '';

    const rawError = error as Record<string, unknown>;
    const collected: string[] = [];

    const pushIfString = (value: unknown) => {
        if (typeof value === 'string' && value.trim()) {
            collected.push(value);
        }
    };

    pushIfString(rawError.message);
    pushIfString(rawError.shortMessage);
    pushIfString(rawError.reason);
    pushIfString(rawError.details);
    pushIfString(rawError.toString?.());

    const cause = rawError.cause as Record<string, unknown> | undefined;
    if (cause) {
        pushIfString(cause.message);
        pushIfString(cause.shortMessage);
        pushIfString(cause.reason);
        pushIfString(cause.details);
    }

    const data = rawError.data as Record<string, unknown> | undefined;
    if (data) {
        pushIfString(data.errorName);
        pushIfString(data.message);
    }

    return collected.join(' | ');
}

export function detectIdeationMarketError(error: unknown): IdeationMarketErrorCode | null {
    const errorText = collectErrorTexts(error).toLowerCase();
    if (!errorText) return null;

    for (const errorCode of IDEATION_MARKET_ERROR_CODES) {
        const prefixedCode = `ideationmarket__${errorCode.toLowerCase()}`;
        const plainCode = errorCode.toLowerCase();

        if (errorText.includes(prefixedCode) || errorText.includes(plainCode)) {
            return errorCode;
        }
    }

    return null;
}

export function parseIdeationMarketError(error: unknown): string | null {
    const detected = detectIdeationMarketError(error);
    if (!detected) return null;
    return IDEATION_MARKET_ERROR_MESSAGES[detected];
}

export function getIdeationMarketErrorMessage(errorCode: IdeationMarketErrorCode): string {
    return IDEATION_MARKET_ERROR_MESSAGES[errorCode];
}
