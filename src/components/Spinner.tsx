import React from "react";
import "./input.css"

type SpinnerProps = { 
    size?: number;       //pixel
    ariaLabel?: string;
    className?: string ;
}

export function Spinner({size=18, ariaLabel="Loading", className} : SpinnerProps) {
    return(
        <span 
            role="status"
            aria-label={ariaLabel}
            className={className}
            style={{
                width: size,
                height: size,
                display: "inline-block",
                borderRadius: "50%",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
            }}  
        ></span>
    )
}