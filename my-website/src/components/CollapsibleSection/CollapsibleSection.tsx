import React, { useState } from 'react';
import styles from './CollapsibleSection.module.css';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.collapsibleSection}>
      <button className={`${styles.toggleButton} ${isOpen ? styles.open : ''}`} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}>▼</span>
      </button>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
