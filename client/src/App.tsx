
import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, List, Menu, CreditCard, PiggyBank, Repeat, Settings, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import SmartSavingsPage from './pages/SmartSavingsPage';
import RecurringTransactionsPage from './pages/RecurringTransactionsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { cn } from './lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';

function SidebarNav() {
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
          )
        }
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </NavLink>
      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
          )
        }
      >
        <List className="h-4 w-4" />
        Transações
      </NavLink>
      <NavLink
        to="/recurring"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
          )
        }
      >
        <Repeat className="h-4 w-4" />
        Recorrências
      </NavLink>
      <NavLink
        to="/credit-cards"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
          )
        }
      >
        <CreditCard className="h-4 w-4" />
        Cartões
      </NavLink>
      <NavLink
        to="/smart-savings"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary',
          )
        }
      >
        <PiggyBank className="h-4 w-4" />
        Poupança Inteligente
      </NavLink>
    </nav>
  );
}

function Sidebar() {
  const { logout } = useAuth();
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="">FinTrack</span>
          </Link>
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <div className="mt-auto p-4 space-y-2">
           <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary',
              )
            }
          >
            <Settings className="h-4 w-4" />
            Configurações
          </NavLink>
          <Button variant="ghost" className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-primary" onClick={logout}>
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

function MobileNav() {
  const { logout } = useAuth();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Wallet className="h-6 w-6 text-primary" />
              <span className="">FinTrack</span>
            </Link>
            <SidebarNav />
          </nav>
           <div className="mt-auto p-4 space-y-2">
           <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary',
              )
            }
          >
            <Settings className="h-4 w-4" />
            Configurações
          </NavLink>
          <Button variant="ghost" className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-primary" onClick={logout}>
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Can add search or other header items here */}
      </div>
    </header>
  );
}

function MainLayout() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <MobileNav />
        <main className="flex flex-1 flex-col gap-4 lg:gap-6 bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/recurring" element={<RecurringTransactionsPage />} />
            <Route path="/credit-cards" element={<CreditCardsPage />} />
            <Route path="/smart-savings" element={<SmartSavingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a global spinner
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<MainLayout />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
