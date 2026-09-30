import React from 'react';

/**
 * Shared layout primitives for status-page views.
 *
 * These primitives are intentionally presentational and free of any
 * admin-only or user-only logic so that both the user-facing status view
 * and the admin status view can consume them without divergence.
 */

export interface StatusPageLayoutProps {
  /** Page title rendered in the shared header. */
  title: string;
  /** Optional supporting description shown under the title. */
  description?: string;
  /** Optional actions (e.g. refresh, filters) rendered on the right. */
  actions?: React.ReactNode;
  /** Main content of the status page. */
  children: React.ReactNode;
}

/**
 * Shared outer layout used by both user and admin status pages.
 * Renders a consistent header (title/description/actions) and content area.
 */
export function StatusPageLayout({
  title,
  description,
  actions,
  children,
}: StatusPageLayoutProps) {
  return (
    <div className="status-page">
      <header className="status-page__header">
        <div className="status-page__heading">
          <h1 className="status-page__title">{title}</h1>
          {description ? (
            <p className="status-page__description">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="status-page__actions">{actions}</div>
        ) : null}
      </header>
      <div className="status-page__content">{children}</div>
    </div>
  );
}

export interface StatusPageSectionProps {
  /** Section heading. */
  title?: string;
  /** Optional section-level actions. */
  actions?: React.ReactNode;
  /** Section body. */
  children: React.ReactNode;
}

/**
 * Shared section primitive for grouping status content. Used by both the
 * user-facing and admin status views to keep spacing/structure consistent.
 */
export function StatusPageSection({
  title,
  actions,
  children,
}: StatusPageSectionProps) {
  return (
    <section className="status-page__section">
      {title || actions ? (
        <div className="status-page__section-header">
          {title ? (
            <h2 className="status-page__section-title">{title}</h2>
          ) : null}
          {actions ? (
            <div className="status-page__section-actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className="status-page__section-content">{children}</div>
    </section>
  );
}

export default StatusPageLayout;
