import React from 'react'
export function Card({ className='', children }:{ className?: string; children: React.ReactNode }){
  return <div className={`glass transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent-500/25 ${className}`}>{children}</div>
}
export function CardHeader({ children }:{ children: React.ReactNode }){ return <div className="p-3 border-b border-neutral-200/70 dark:border-neutral-800/70">{children}</div> }
/** Card title; `as` picks the element (a heading level where the title heads a section) without changing its look. */
export function CardTitle({ children, className='', as: Tag = 'div' }:{ children: React.ReactNode; className?: string; as?: 'div'|'h2'|'h3'|'h4' }){ return <Tag className={`text-lg font-semibold text-center ${className}`}>{children}</Tag> }
export function CardContent({ children, className='' }:{ children: React.ReactNode; className?: string }){ return <div className={`p-3 ${className}`}>{children}</div> }
