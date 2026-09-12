
import React from 'react'
export function Card({ className='', children }:{ className?: string; children: React.ReactNode }){
  return <div className={`glass transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent-500/25 ${className}`}>{children}</div>
}
export function CardHeader({ children }:{ children: React.ReactNode }){ return <div className="p-3 border-b border-neutral-200/70 dark:border-neutral-800/70">{children}</div> }
export function CardTitle({ children, className='' }:{ children: React.ReactNode; className?: string }){ return <div className={`text-lg font-semibold text-center ${className}`}>{children}</div> }
export function CardContent({ children, className='' }:{ children: React.ReactNode; className?: string }){ return <div className={`p-3 ${className}`}>{children}</div> }
