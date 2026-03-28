import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export const PageHeader = ({ title, description, actions, breadcrumbs }: PageHeaderProps) => {
return (
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
  <div>
    {breadcrumbs && (
      <div className="mb-2">
        {breadcrumbs}
      </div>
    )}
    <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
  </div>
  {actions && (
    <div className="flex items-center shrink-0 gap-3">
      {actions}
    </div>
  )}
</div>
);
};
