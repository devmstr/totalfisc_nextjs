import {
    LayoutDashboard,
    BarChart3,
    Send,
    Receipt,
    Landmark,
    Users,
    PenLine,
    Notebook,
    Factory,
    Building2,
    Settings,
    HelpCircle,
    ChevronDown,
    ChevronRight,
    Home,
    ShoppingCart,
    ShoppingBag,
    Contact,
    CreditCard,
    Briefcase,
    PieChart,
    ShieldCheck,
    UserCircle,
    Activity,
    Calendar,
    Bell,
    Search,
    User,
    LogOut,
    Check,
    ChevronsUpDown,
    Plus,
    Icon as LucideIcon,
    Settings2
} from 'lucide-react'

export const Icons = {
    LayoutDashboard,
    BarChart3,
    Send,
    Receipt,
    Landmark,
    Users,
    PenLine,
    Notebook,
    Factory,
    Building2,
    Settings,
    HelpCircle,
    ChevronDown,
    ChevronRight,
    Home,
    ShoppingCart,
    ShoppingBag,
    Contact,
    CreditCard,
    Briefcase,
    PieChart,
    ShieldCheck,
    UserCircle,
    Activity,
    Calendar,
    Bell,
    Search,
    User,
    LogOut,
    Check,
    ChevronsUpDown,
    Plus,
    Settings2
}

export type Icon = keyof typeof Icons

interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
    name: Icon
    size?: number | string
    color?: string
    strokeWidth?: number | string
}

export function DynamicIcon({ name, ...props }: IconProps) {
    const IconComponent = Icons[name]
    if (!IconComponent) return null
    return <IconComponent {...props} />
}
