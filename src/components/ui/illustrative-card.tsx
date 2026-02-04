import * as React from "react"
import { cn } from "@/lib/utils"
interface IllustrativeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}
export function IllustrativeCard({ className, children, ...props }: IllustrativeCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-xl overflow-hidden transition-transform hover:-translate-y-1 active:translate-y-0 active:shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
export function IllustrativeHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 border-b-2 border-black dark:border-white bg-accent/10", className)} {...props}>
      {children}
    </div>
  )
}
export function IllustrativeContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  )
}
export function IllustrativeFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 bg-muted/30 border-t-2 border-black dark:border-white flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  )
}
export function IllustrativeSection({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section 
      className={cn("py-8 md:py-10 lg:py-12 border-b-2 border-black/5 dark:border-white/5 last:border-0", className)} 
      {...props}
    >
      {children}
    </section>
  )
}