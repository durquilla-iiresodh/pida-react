
import React from 'react';

export const BalanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M12 2l4 4-4 4-4-4 4-4zM2 12h20M2 16h20M12 22v-6"/>
        <path d="M5 12l-3 6" />
        <path d="M19 12l3 6" />
    </svg>
);
