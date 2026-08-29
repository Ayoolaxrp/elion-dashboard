"use client";

// Premium SVG illustrations for landing pages

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Background gradient circles */}
      <circle cx="300" cy="200" r="180" fill="url(#heroGrad1)" opacity="0.1" />
      <circle cx="300" cy="200" r="120" fill="url(#heroGrad2)" opacity="0.15" />
      <circle cx="300" cy="200" r="60" fill="url(#heroGrad3)" opacity="0.2" />
      
      {/* Central node */}
      <circle cx="300" cy="200" r="40" fill="var(--color-accent)" />
      
      
      {/* Connected nodes - Left */}
      <circle cx="120" cy="120" r="24" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      <text x="120" y="125" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">CRM</text>
      <line x1="144" y1="132" x2="260" y2="180" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 4" />
      
      <circle cx="120" cy="280" r="24" fill="var(--color-surface-raised)" stroke="var(--color-success)" strokeWidth="2" />
      <text x="120" y="285" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">Email</text>
      <line x1="144" y1="268" x2="260" y2="220" stroke="var(--color-success)" strokeWidth="2" strokeDasharray="4 4" />
      
      <circle cx="200" cy="350" r="24" fill="var(--color-surface-raised)" stroke="var(--color-warning)" strokeWidth="2" />
      <text x="200" y="355" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">SMS</text>
      <line x1="216" y1="330" x2="280" y2="230" stroke="var(--color-warning)" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Connected nodes - Right */}
      <circle cx="480" cy="120" r="24" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      <text x="480" y="125" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">WA</text>
      <line x1="456" y1="132" x2="340" y2="180" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 4" />
      
      <circle cx="480" cy="280" r="24" fill="var(--color-surface-raised)" stroke="var(--color-error)" strokeWidth="2" />
      <text x="480" y="285" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">ERP</text>
      <line x1="456" y1="268" x2="340" y2="220" stroke="var(--color-error)" strokeWidth="2" strokeDasharray="4 4" />
      
      <circle cx="400" cy="350" r="24" fill="var(--color-surface-raised)" stroke="var(--color-accent-deep)" strokeWidth="2" />
      <text x="400" y="355" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">Ads</text>
      <line x1="384" y1="330" x2="320" y2="230" stroke="var(--color-accent-deep)" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Pulse rings */}
      <circle cx="300" cy="200" r="50" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3">
      </circle>
      
      {/* Floating particles */}
      <circle cx="180" cy="80" r="3" fill="var(--color-accent)" opacity="0.5">
      </circle>
      <circle cx="420" cy="90" r="2" fill="var(--color-success)" opacity="0.5">
      </circle>
      <circle cx="350" cy="320" r="2" fill="var(--color-warning)" opacity="0.5">
      </circle>
      
      <defs>
        <radialGradient id="heroGrad1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="var(--color-accent)" /><stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" /></radialGradient>
        <radialGradient id="heroGrad2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="var(--color-accent-deep)" /><stop offset="1" stopColor="var(--color-accent-deep)" stopOpacity="0" /></radialGradient>
        <radialGradient id="heroGrad3" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
      </defs>
    </svg>
  );
}

export function WorkflowIllustration() {
  return (
    <svg viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Step 1 */}
      <rect x="10" y="70" width="80" height="60" rx="12" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      <text x="50" y="95" textAnchor="middle" fill="var(--color-accent)" fontSize="10" fontWeight="bold">TRIGGER</text>
      <text x="50" y="115" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">New Lead</text>
      
      {/* Arrow 1 */}
      <path d="M95 100 L115 100" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowhead)" />
      
      {/* Step 2 */}
      <rect x="120" y="70" width="80" height="60" rx="12" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      <text x="160" y="95" textAnchor="middle" fill="var(--color-accent)" fontSize="10" fontWeight="bold">QUALIFY</text>
      <text x="160" y="115" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Route</text>
      
      {/* Arrow 2 */}
      <path d="M205 100 L225 100" stroke="var(--color-accent)" strokeWidth="2" markerEnd="url(#arrowhead2)" />
      
      {/* Step 3 */}
      <rect x="230" y="70" width="80" height="60" rx="12" fill="var(--color-surface-raised)" stroke="var(--color-success)" strokeWidth="2" />
      <text x="270" y="95" textAnchor="middle" fill="var(--color-success)" fontSize="10" fontWeight="bold">RESPOND</text>
      <text x="270" y="115" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">WhatsApp</text>
      
      {/* Arrow 3 */}
      <path d="M315 100 L335 100" stroke="var(--color-success)" strokeWidth="2" markerEnd="url(#arrowhead3)" />
      
      {/* Step 4 */}
      <rect x="340" y="70" width="80" height="60" rx="12" fill="var(--color-surface-raised)" stroke="var(--color-warning)" strokeWidth="2" />
      <text x="380" y="95" textAnchor="middle" fill="var(--color-warning)" fontSize="10" fontWeight="bold">FOLLOW UP</text>
      <text x="380" y="115" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Sequence</text>
      
      {/* Arrow 4 */}
      <path d="M425 100 L445 100" stroke="var(--color-warning)" strokeWidth="2" markerEnd="url(#arrowhead4)" />
      
      {/* Step 5 */}
      <rect x="450" y="70" width="40" height="60" rx="12" fill="var(--color-accent)" />
      <text x="470" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">WIN</text>
      
      {/* Pulse on active step */}
      <rect x="230" y="70" width="80" height="60" rx="12" fill="none" stroke="var(--color-success)" strokeWidth="2" opacity="0.5">
      </rect>
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" /></marker>
        <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" /></marker>
        <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-success)" /></marker>
        <marker id="arrowhead4" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-warning)" /></marker>
      </defs>
    </svg>
  );
}

export function AnalyticsIllustration() {
  return (
    <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Chart background */}
      <rect x="20" y="20" width="260" height="160" rx="12" fill="var(--color-surface-raised)" />
      
      {/* Grid lines */}
      <line x1="60" y1="40" x2="60" y2="160" stroke="var(--color-border)" strokeWidth="1" />
      <line x1="110" y1="40" x2="110" y2="160" stroke="var(--color-border)" strokeWidth="1" />
      <line x1="160" y1="40" x2="160" y2="160" stroke="var(--color-border)" strokeWidth="1" />
      <line x1="210" y1="40" x2="210" y2="160" stroke="var(--color-border)" strokeWidth="1" />
      <line x1="260" y1="40" x2="260" y2="160" stroke="var(--color-border)" strokeWidth="1" />
      
      {/* Bars */}
      <rect x="40" y="100" width="20" height="60" rx="4" fill="var(--color-accent)" opacity="0.8" />
      <rect x="90" y="80" width="20" height="80" rx="4" fill="var(--color-accent)" opacity="0.9" />
      <rect x="140" y="60" width="20" height="100" rx="4" fill="var(--color-accent)" />
      <rect x="190" y="45" width="20" height="115" rx="4" fill="var(--color-success)" />
      <rect x="240" y="50" width="20" height="110" rx="4" fill="var(--color-success)" opacity="0.8" />
      
      {/* Trend line */}
      <path d="M50 95 L100 75 L150 55 L200 40 L250 45" stroke="var(--color-warning)" strokeWidth="2" fill="none" />
      <circle cx="250" cy="45" r="4" fill="var(--color-warning)" />
      
      {/* Labels */}
      <text x="50" y="175" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Jan</text>
      <text x="100" y="175" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Feb</text>
      <text x="150" y="175" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Mar</text>
      <text x="200" y="175" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Apr</text>
      <text x="250" y="175" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">May</text>
      
      {/* Animated bar */}
      <rect x="190" y="45" width="20" height="115" rx="4" fill="var(--color-success)" opacity="0.3">
      </rect>
    </svg>
  );
}

export function AutomationFlowIllustration() {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Central hub */}
      <circle cx="200" cy="150" r="50" fill="var(--color-accent)" />
      <text x="200" y="145" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">AUTOMATE</text>
      <text x="200" y="160" textAnchor="middle" fill="white" fontSize="9">Everything</text>
      
      {/* Surrounding nodes */}
      <g>
        <circle cx="80" cy="80" r="30" fill="var(--color-surface-raised)" stroke="var(--color-success)" strokeWidth="2" />
        <text x="80" y="77" textAnchor="middle" fill="var(--color-success)" fontSize="8" fontWeight="bold">LEADS</text>
        
        <line x1="105" y1="95" x2="160" y2="130" stroke="var(--color-success)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      <g>
        <circle cx="320" cy="80" r="30" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
        <text x="320" y="77" textAnchor="middle" fill="var(--color-accent)" fontSize="8" fontWeight="bold">EMAIL</text>
        
        <line x1="295" y1="95" x2="240" y2="130" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      <g>
        <circle cx="80" cy="220" r="30" fill="var(--color-surface-raised)" stroke="var(--color-warning)" strokeWidth="2" />
        <text x="80" y="217" textAnchor="middle" fill="var(--color-warning)" fontSize="8" fontWeight="bold">CRM</text>
        
        <line x1="105" y1="205" x2="160" y2="170" stroke="var(--color-warning)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      <g>
        <circle cx="320" cy="220" r="30" fill="var(--color-surface-raised)" stroke="var(--color-error)" strokeWidth="2" />
        <text x="320" y="217" textAnchor="middle" fill="var(--color-error)" fontSize="8" fontWeight="bold">BOOK</text>
        
        <line x1="295" y1="205" x2="240" y2="170" stroke="var(--color-error)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      <g>
        <circle cx="200" cy="40" r="25" fill="var(--color-surface-raised)" stroke="var(--color-accent-deep)" strokeWidth="2" />
        <text x="200" y="37" textAnchor="middle" fill="var(--color-accent-deep)" fontSize="8" fontWeight="bold">WA</text>
        <text x="200" y="50" textAnchor="middle" fill="var(--color-text-muted)" fontSize="7">Auto</text>
        <line x1="200" y1="65" x2="200" y2="100" stroke="var(--color-accent-deep)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      <g>
        <circle cx="200" cy="260" r="25" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
        <text x="200" y="257" textAnchor="middle" fill="var(--color-accent)" fontSize="8" fontWeight="bold">DATA</text>
        <text x="200" y="270" textAnchor="middle" fill="var(--color-text-muted)" fontSize="7">Sync</text>
        <line x1="200" y1="235" x2="200" y2="200" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
      
      {/* Pulse rings */}
      <circle cx="200" cy="150" r="55" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3">
      </circle>
    </svg>
  );
}

export function PricingIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Gradient background */}
      <circle cx="100" cy="100" r="90" fill="url(#priceGrad)" opacity="0.1" />
      
      {/* Shield */}
      <path d="M100 30 L140 50 L140 100 C140 130 120 150 100 160 C80 150 60 130 60 100 L60 50 Z" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      
      {/* Checkmark */}
      <path d="M85 100 L95 110 L120 85" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Decorative elements */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.1" />
      
      <defs>
        <radialGradient id="priceGrad" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="var(--color-accent)" /><stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" /></radialGradient>
      </defs>
    </svg>
  );
}

export function TeamIllustration() {
  return (
    <svg viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Person 1 */}
      <circle cx="80" cy="50" r="20" fill="var(--color-surface-raised)" stroke="var(--color-accent)" strokeWidth="2" />
      <circle cx="80" cy="45" r="8" fill="var(--color-accent)" opacity="0.5" />
      <path d="M65 65 Q80 80 95 65" fill="var(--color-accent)" opacity="0.3" />
      
      {/* Person 2 */}
      <circle cx="150" cy="50" r="20" fill="var(--color-surface-raised)" stroke="var(--color-success)" strokeWidth="2" />
      <circle cx="150" cy="45" r="8" fill="var(--color-success)" opacity="0.5" />
      <path d="M135 65 Q150 80 165 65" fill="var(--color-success)" opacity="0.3" />
      
      {/* Person 3 */}
      <circle cx="220" cy="50" r="20" fill="var(--color-surface-raised)" stroke="var(--color-warning)" strokeWidth="2" />
      <circle cx="220" cy="45" r="8" fill="var(--color-warning)" opacity="0.5" />
      <path d="M205 65 Q220 80 235 65" fill="var(--color-warning)" opacity="0.3" />
      
      {/* Connection lines */}
      <line x1="100" y1="50" x2="130" y2="50" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="170" y1="50" x2="200" y2="50" stroke="var(--color-success)" strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Labels */}
      <text x="80" y="90" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9">Sales</text>
      <text x="150" y="90" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9">Marketing</text>
      <text x="220" y="90" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9">Operations</text>
      
      {/* Stats */}
      <text x="150" y="120" textAnchor="middle" fill="var(--color-accent)" fontSize="11" fontWeight="bold">Business Automation Systems</text>
    </svg>
  );
}
