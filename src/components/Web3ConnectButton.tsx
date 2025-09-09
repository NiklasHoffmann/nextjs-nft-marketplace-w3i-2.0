// app/components/Web3ConnectButton.tsx
'use client'
import { ConnectButton as RBConnect } from '@rainbow-me/rainbowkit'

export function Web3ConnectButton() {
    return (
        <div className="flex items-center">
            <RBConnect
                showBalance={{ smallScreen: false, largeScreen: true }}
                accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            />
        </div>
    )
}
