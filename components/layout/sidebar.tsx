"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { PieChart, Menu, Home, CreditCard, DollarSign } from "lucide-react"

const navigation = [
  {
    name: "Dashboard Principal",
    href: "/",
    icon: Home,
  },
  {
    name: "Cartera",
    href: "/portfolio",
    icon: PieChart,
  },
  {
    name: "Garantías",
    href: "/guarantees",
    icon: CreditCard,
  },
  {
    name: "Financiamiento",
    href: "/financing",
    icon: DollarSign,
  },
  /*{
    name: "Reportes",
    href: "/reports",
    icon: FileText,
  },*/
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center justify-center mb-6">
            <img src="/images/gcx-logo.png" alt="GCX Logo" className="h-12 w-auto" />
          </div>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === item.href && "bg-secondary text-secondary-foreground",
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <ScrollArea className="flex-1">
          <Sidebar />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
