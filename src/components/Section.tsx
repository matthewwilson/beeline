import type { ReactNode } from 'react'
import styles from './section.module.css'

interface SectionProps {
  title: string
  hint?: string
  children: ReactNode
}

/**
 * A labelled panel section: an eyebrow title, an optional hint line and its content,
 * with consistent spacing. Shared by the controls panel and the mobile map extras so
 * the "eyebrow + hint + body" pattern lives in one place.
 */
export function Section({ title, hint, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <p className={`eyebrow ${styles.label}`}>{title}</p>
      {hint && <p className={`hint ${styles.hint}`}>{hint}</p>}
      {children}
    </section>
  )
}
