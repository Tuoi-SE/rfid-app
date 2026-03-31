import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export const PageHeader = ({ title, description, actions, breadcrumbs }: PageHeaderProps) => {
return (
<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
  <div>
    {breadcrumbs && (
      <div className="mb-1.5">
        {breadcrumbs}
      </div>
    )}
    <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
  </div>
  {actions && (
    <div className="flex items-center shrink-0 gap-3">
      {actions}
    </div>
  )}
</div>
);
};
