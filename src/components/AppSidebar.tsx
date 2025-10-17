import { Package, FileText, BarChart3, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export const AppSidebar = () => {
  const { userRole, signOut, user } = useAuth();

  const menuItems = [
    { title: 'Inventaris', url: '/inventaris', icon: Package, roles: ['admin', 'user'] },
    { title: 'POS Report', url: '/pos-report', icon: FileText, roles: ['admin', 'user'] },
    { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary px-4 py-6">
            GOGO App v2
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="mb-2 text-sm text-muted-foreground">
          <p className="font-medium">{user?.email}</p>
          <p className="text-xs capitalize">Role: {userRole}</p>
        </div>
        <Button 
          onClick={signOut} 
          variant="outline" 
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};