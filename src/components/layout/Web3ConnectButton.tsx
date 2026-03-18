'use client'
import { ConnectButton as RBConnect } from '@rainbow-me/rainbowkit'

export function Web3ConnectButton() {
    return (
        <div className="flex items-center w-full justify-center">
            <RBConnect
                showBalance={false}
                chainStatus="icon"
                accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
            />
        </div>
    )
}
