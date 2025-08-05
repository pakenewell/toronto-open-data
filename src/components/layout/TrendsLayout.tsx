import React from 'react';
import type { TrendsLayoutProps } from '../../types/ui';

const TrendsLayout: React.FC<TrendsLayoutProps> = ({ children }) => (
  <div className="section-spacing-y-default px-4 md:px-8 lg:px-12 bg-background min-h-screen text-foreground">
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </div>
);

export default TrendsLayout;