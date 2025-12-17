/**
 * Subgraph v2 Queries (Ideation Market)
 * 
 * New schema with Listing and WhitelistedBuyer entities
 * Base URL: https://api.studio.thegraph.com/query/46078/ideation-market/version/latest
 */

import { gql } from "@apollo/client";

// Listing Types
export type TokenStandard = 'ERC721' | 'ERC1155';
export type ListingType = 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP';
export type ListingStatus = 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED';

// Get active listings with pagination
export const GET_ACTIVE_LISTINGS = gql`
    query GetActiveListings($first: Int = 20, $skip: Int = 0) {
        listings(
            first: $first
            skip: $skip
            where: { active: true }
            orderBy: createdAt
            orderDirection: desc
        ) {
            id
            chainId
            listingId
            tokenAddress
            tokenId
            tokenStandard
            erc1155QuantityListed
            remainingQuantity
            priceTotal
            unitPrice
            buyerWhitelistEnabled
            partialBuyEnabled
            listingType
            feeRate
            desiredTokenAddress
            desiredTokenId
            desiredErc1155Quantity
            seller
            status
            active
            createdAt
        }
    }
`;

// Get active listings for a specific collection
export const GET_LISTINGS_BY_COLLECTION = gql`
    query GetListingsByCollection($tokenAddress: Bytes!, $first: Int = 20, $skip: Int = 0) {
        listings(
            where: { tokenAddress: $tokenAddress, active: true }
            orderBy: createdAt
            orderDirection: desc
            first: $first
            skip: $skip
        ) {
            id
            listingId
            tokenId
            tokenStandard
            priceTotal
            remainingQuantity
            unitPrice
            listingType
            seller
            status
            createdAt
        }
    }
`;

// Get active listings for a specific NFT (721 or 1155)
export const GET_LISTINGS_BY_NFT = gql`
    query GetListingsByNFT($tokenAddress: Bytes!, $tokenId: BigInt!) {
        listings(
            where: { tokenAddress: $tokenAddress, tokenId: $tokenId, active: true }
            orderBy: createdAt
            orderDirection: desc
            first: 100
        ) {
            id
            listingId
            tokenAddress
            tokenId
            tokenStandard
            priceTotal
            remainingQuantity
            unitPrice
            listingType
            feeRate
            seller
            status
            active
            createdAt
            desiredTokenAddress
            desiredTokenId
            desiredErc1155Quantity
            buyerWhitelistEnabled
            partialBuyEnabled
        }
    }
`;

// Load one listing by ID (format: "11155111-<listingId>")
export const GET_LISTING_BY_ID = gql`
    query GetListingById($id: ID!) {
        listing(id: $id) {
            id
            chainId
            listingId
            tokenAddress
            tokenId
            tokenStandard
            erc1155QuantityListed
            remainingQuantity
            priceTotal
            unitPrice
            buyerWhitelistEnabled
            partialBuyEnabled
            listingType
            feeRate
            desiredTokenAddress
            desiredTokenId
            desiredErc1155Quantity
            seller
            status
            active
            createdAt
        }
    }
`;

// Get whitelisted buyers for a listing
export const GET_WHITELISTED_BUYERS = gql`
    query GetWhitelistedBuyers($listingId: BigInt!, $first: Int = 1000) {
        whitelistedBuyers(
            where: { listingId: $listingId }
            first: $first
        ) {
            id
            buyer
            createdAt
        }
    }
`;

// Get all listings by seller
export const GET_LISTINGS_BY_SELLER = gql`
    query GetListingsBySeller($seller: Bytes!, $first: Int = 100, $skip: Int = 0) {
        listings(
            where: { seller: $seller }
            orderBy: createdAt
            orderDirection: desc
            first: $first
            skip: $skip
        ) {
            id
            listingId
            tokenAddress
            tokenId
            tokenStandard
            priceTotal
            remainingQuantity
            listingType
            status
            active
            createdAt
        }
    }
`;

// Subscription for listing updates (real-time)
export const LISTINGS_UPDATED_SUBSCRIPTION = gql`
    subscription ListingsUpdated {
        listings(
            first: 1000
            where: { active: true }
            orderBy: listingId
            orderDirection: desc
        ) {
            id
            chainId
            listingId
            tokenAddress
            tokenId
            tokenStandard
            priceTotal
            remainingQuantity
            unitPrice
            listingType
            seller
            status
            active
            createdAt
        }
    }
`;

// Get listings by status
export const GET_LISTINGS_BY_STATUS = gql`
    query GetListingsByStatus($status: ListingStatus!, $first: Int = 100) {
        listings(
            where: { status: $status }
            orderBy: createdAt
            orderDirection: desc
            first: $first
        ) {
            id
            listingId
            tokenAddress
            tokenId
            tokenStandard
            priceTotal
            remainingQuantity
            seller
            status
            active
            createdAt
        }
    }
`;

// Get listings by type (PURE_ETH, SWAP_AND_ETH, PURE_SWAP)
export const GET_LISTINGS_BY_TYPE = gql`
    query GetListingsByType($listingType: ListingType!, $first: Int = 100) {
        listings(
            where: { listingType: $listingType, active: true }
            orderBy: createdAt
            orderDirection: desc
            first: $first
        ) {
            id
            listingId
            tokenAddress
            tokenId
            priceTotal
            listingType
            seller
            createdAt
            desiredTokenAddress
            desiredTokenId
        }
    }
`;
